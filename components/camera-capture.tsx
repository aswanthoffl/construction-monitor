"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, Video, MapPin, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { SensorManager } from "@/lib/sensor-manager"
import { tourDB } from "@/lib/db"
import { calculateDistance, getCardinalDirection, gpsToFloorPlanCoordinates } from "@/lib/geo-utils"
import type { CapturePoint, GPSCoordinate, SensorData, FloorPlan, VirtualTour } from "@/lib/types"

interface CameraCaptureProps {
  floorPlan: FloorPlan
}

export function CameraCapture({ floorPlan }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sensorManager = useRef<SensorManager>(new SensorManager())
  const miniMapRef = useRef<HTMLDivElement>(null)
  const miniMapImgRef = useRef<HTMLImageElement>(null)

  const [isCapturing, setIsCapturing] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturePoints, setCapturePoints] = useState<CapturePoint[]>([])
  const [currentGPS, setCurrentGPS] = useState<GPSCoordinate | null>(null)
  const [currentSensors, setCurrentSensors] = useState<SensorData | null>(null)
  const [lastCapturePosition, setLastCapturePosition] = useState<GPSCoordinate | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [startAnchorPx, setStartAnchorPx] = useState<{ x: number; y: number } | null>(null)
  const [isSettingStart, setIsSettingStart] = useState(false)

  const [stats, setStats] = useState({
    captureCount: 0,
    totalDistance: 0,
    duration: 0,
    accuracy: 0,
    heading: 0,
    battery: 100,
  })

  // Initialize camera and sensors
  useEffect(() => {
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        })
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (error) {
        console.error("[v0] Camera access error:", error)
        alert("Unable to access camera. Please grant camera permissions.")
      }
    }

    initCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // Start GPS and sensor tracking
  useEffect(() => {
    const initSensors = async () => {
      const hasPermission = await sensorManager.current.requestPermissions()
      if (!hasPermission) {
        console.error("[v0] Sensor permissions denied")
        return
      }

      sensorManager.current.startGPSTracking((gps) => {
        setCurrentGPS(gps)
        setStats((prev) => ({ ...prev, accuracy: gps.accuracy }))
      })

      sensorManager.current.startSensorTracking((sensors) => {
        setCurrentSensors(sensors)
        setStats((prev) => ({
          ...prev,
          heading: sensors.orientation.alpha,
        }))
      })
    }

    initSensors()

    // Battery status
    if ("getBattery" in navigator) {
      ;(navigator as any).getBattery().then((battery: any) => {
        setStats((prev) => ({ ...prev, battery: Math.round(battery.level * 100) }))
        battery.addEventListener("levelchange", () => {
          setStats((prev) => ({ ...prev, battery: Math.round(battery.level * 100) }))
        })
      })
    }

    return () => {
      sensorManager.current.stopAll()
    }
  }, [])

  useEffect(() => {
    if (!isCapturing) return

    const interval = setInterval(() => {
      captureImage()
    }, 500) // 2 photos per second

    return () => clearInterval(interval)
  }, [isCapturing, currentGPS, currentSensors])

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current || !currentGPS || !currentSensors) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to video size
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to blob
    canvas.toBlob(
      async (blob) => {
        if (!blob) return

        // Create object URL for the image
        const imageUrl = URL.createObjectURL(blob)

        // Create capture point
        const capturePoint: CapturePoint = {
          id: `capture-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          gps: currentGPS,
          sensors: currentSensors,
          imageUrl,
          direction: currentSensors.orientation.alpha,
        }

        // Update state
        setCapturePoints((prev) => [...prev, capturePoint])

        // Update stats
        setStats((prev) => ({
          ...prev,
          captureCount: prev.captureCount + 1,
          totalDistance: lastCapturePosition
            ? prev.totalDistance +
              calculateDistance(
                lastCapturePosition.latitude,
                lastCapturePosition.longitude,
                currentGPS.latitude,
                currentGPS.longitude,
              )
            : 0,
        }))

        setLastCapturePosition(currentGPS)

        // Save to IndexedDB
        try {
          await tourDB.saveCapturePoint(capturePoint)
          console.log("[v0] Capture point saved:", capturePoint.id)
        } catch (error) {
          console.error("[v0] Error saving capture point:", error)
        }
      },
      "image/jpeg",
      0.9,
    )
  }

  const handleStartStop = () => {
    if (isCapturing) {
      setIsCapturing(false)
      console.log("[v0] Capture stopped. Total points:", capturePoints.length)
    } else {
      if (!startAnchorPx) {
        alert("Please click 'Set Start' and pick your starting point on the floor plan before recording.")
        return
      }
      setIsCapturing(true)
      setStartTime(Date.now())
      setLastCapturePosition(currentGPS)
      console.log("[v0] Capture started")
    }
  }

  const handleMiniMapClick = (e: React.MouseEvent) => {
    if (!isSettingStart) return
    const containerRect = miniMapRef.current?.getBoundingClientRect()
    const vp = getMiniMapViewport()
    if (!containerRect || !vp) return

    const localX = e.clientX - containerRect.left
    const localY = e.clientY - containerRect.top

    // Clamp to the actual drawn image area
    const xInImg = Math.max(0, Math.min(vp.width, localX - vp.left))
    const yInImg = Math.max(0, Math.min(vp.height, localY - vp.top))

    const px = (xInImg / vp.width) * floorPlan.bounds.width
    const py = (yInImg / vp.height) * floorPlan.bounds.height

    setStartAnchorPx({ x: px, y: py })
    setIsSettingStart(false)
  }

  const handleSaveTour = async () => {
    if (capturePoints.length === 0) {
      alert("No capture points to save. Please capture some images first.")
      return
    }

    const projectName = prompt("Enter a name for this tour:")
    if (!projectName) return

    setIsSaving(true)

    try {
      // Process images for Street View experience
      console.log("[v0] Processing tour with", capturePoints.length, "capture points")

      // Calculate path segments for smooth navigation
      const pathSegments = []
      for (let i = 0; i < capturePoints.length - 1; i++) {
        const start = capturePoints[i]
        const end = capturePoints[i + 1]
        const distance = calculateDistance(start.gps.latitude, start.gps.longitude, end.gps.latitude, end.gps.longitude)
        const duration = end.timestamp - start.timestamp

        pathSegments.push({
          start,
          end,
          distance,
          duration,
        })
      }

      // Create tour object
      const basePositions = capturePoints.map((point) => gpsToFloorPlanCoordinates(point.gps, floorPlan))
      let dx = 0
      let dy = 0
      if (startAnchorPx && basePositions.length) {
        dx = startAnchorPx.x - basePositions[0].x
        dy = startAnchorPx.y - basePositions[0].y
      }

      const tour: VirtualTour = {
        id: `tour-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        projectId: `project-${Date.now()}`,
        projectName,
        date: new Date(),
        capturePoints: capturePoints.map((point, i) => ({
          ...point,
          floorPlanPosition: { x: basePositions[i].x + dx, y: basePositions[i].y + dy },
        })),
        pathSegments,
        floorPlan,
        metadata: {
          duration: startTime ? Date.now() - startTime : 0,
          totalDistance: stats.totalDistance,
          captureCount: capturePoints.length,
          captureMode: "time",
          captureInterval: 0.5, // 2 photos per second
        },
        status: "completed",
      }

      // Save tour to database
      await tourDB.init()
      await tourDB.saveTour(tour)

      console.log("[v0] Tour saved successfully:", tour.id)
      alert(`Tour "${projectName}" saved successfully with ${capturePoints.length} capture points!`)

      // Reset capture state
      setCapturePoints([])
      setStats({
        captureCount: 0,
        totalDistance: 0,
        duration: 0,
        accuracy: 0,
        heading: 0,
        battery: stats.battery,
      })
      setStartTime(null)
      setStartAnchorPx(null)
    } catch (error) {
      console.error("[v0] Error saving tour:", error)
      alert("Failed to save tour. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const getCurrentFloorPlanPosition = () => {
    // When capturing, prefer last aligned position if available.
    if (capturePoints.length > 0) {
      const last = capturePoints[capturePoints.length - 1]
      if (last.floorPlanPosition) return last.floorPlanPosition

      // If a Start anchor is set, align GPS positions by shifting so first point snaps to Start.
      if (startAnchorPx) {
        const firstPos = gpsToFloorPlanCoordinates(capturePoints[0].gps, floorPlan)
        const dx = startAnchorPx.x - firstPos.x
        const dy = startAnchorPx.y - firstPos.y
        const lastPos = gpsToFloorPlanCoordinates(last.gps, floorPlan)
        return { x: lastPos.x + dx, y: lastPos.y + dy }
      }

      // If no Start anchor, do NOT show any position (avoid random default).
      return null
    }

    // Before first capture: only show marker if user pinned Start.
    if (startAnchorPx) return startAnchorPx

    // No Start anchor -> no marker.
    return null
  }

  const currentPosition = getCurrentFloorPlanPosition()

  // Map helpers: compute the actual drawn image rect inside the mini-map container (object-contain may letterbox)
  function getMiniMapViewport() {
    const container = miniMapRef.current
    const img = miniMapImgRef.current
    if (!container || !img) return null

    const containerRect = container.getBoundingClientRect()
    const imgRect = img.getBoundingClientRect()

    // Return coordinates relative to the container
    const left = imgRect.left - containerRect.left
    const top = imgRect.top - containerRect.top
    const width = imgRect.width
    const height = imgRect.height
    return { left, top, width, height }
  }

  // Convert floor-plan pixel coords -> SVG overlay pixels (relative to container)
  function fpToSvgPx(pos: { x: number; y: number }) {
    const vp = getMiniMapViewport()
    if (!vp) return { x: 0, y: 0 }
    const x = vp.left + (pos.x / floorPlan.bounds.width) * vp.width
    const y = vp.top + (pos.y / floorPlan.bounds.height) * vp.height
    return { x, y }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-black">
      {/* Video Preview */}
      <div className="relative flex-1">
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
          <Link href="/capture">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-white drop-shadow-lg">Live Capture - 2 photos/sec</h1>
          <div className="w-10" />
        </div>

        {/* Status Indicators */}
        <div className="absolute top-20 left-4 right-4 flex flex-wrap gap-2">
          {isCapturing && (
            <Badge className="bg-red-500 text-white animate-pulse">
              <div className="h-2 w-2 rounded-full bg-white mr-2" />
              Recording
            </Badge>
          )}
          {currentGPS && (
            <Badge className="bg-black/70 text-white">
              <MapPin className="h-3 w-3 mr-1" />
              {currentGPS.accuracy.toFixed(0)}m accuracy
            </Badge>
          )}
          {currentSensors && (
            <Badge className="bg-black/70 text-white">
              <Navigation className="h-3 w-3 mr-1" />
              {getCardinalDirection(currentSensors.orientation.alpha)}
            </Badge>
          )}
        </div>

        {/* Capture Count */}
        {isCapturing && (
          <div className="absolute top-20 right-4 bg-black/70 text-white px-4 py-2 rounded-lg">
            <div className="text-2xl font-bold">{stats.captureCount}</div>
            <div className="text-xs text-gray-300">captures</div>
          </div>
        )}

        <div
          ref={miniMapRef}
          className="absolute bottom-32 right-4 w-64 h-64 bg-black/80 rounded-lg border-2 border-primary/50 overflow-hidden"
          onClick={handleMiniMapClick}
          role="presentation"
          aria-label="Mini map"
        >
          <div className="relative w-full h-full p-2">
            <img
              ref={miniMapImgRef}
              src={floorPlan.imageUrl || "/placeholder.svg?height=256&width=256&query=floor%20plan%20placeholder"}
              alt="Floor plan"
              className="w-full h-full object-contain opacity-60"
            />
            {/* Path overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Draw captured path (anchored if start is set) */}
              {capturePoints.length > 1 && (
                <path
                  d={(() => {
                    const d: string[] = []
                    let dx = 0,
                      dy = 0
                    if (startAnchorPx) {
                      const first = gpsToFloorPlanCoordinates(capturePoints[0].gps, floorPlan)
                      dx = startAnchorPx.x - first.x
                      dy = startAnchorPx.y - first.y
                    }
                    capturePoints.forEach((p, i) => {
                      const base = gpsToFloorPlanCoordinates(p.gps, floorPlan)
                      const pos = { x: base.x + dx, y: base.y + dy }
                      const svg = fpToSvgPx(pos)
                      d.push(i === 0 ? `M ${svg.x} ${svg.y}` : `L ${svg.x} ${svg.y}`)
                    })
                    return d.join(" ")
                  })()}
                  fill="none"
                  stroke="#00D9A3"
                  strokeWidth="2"
                />
              )}
              {/* Draw capture points (anchored if Start is set) */}
              {capturePoints.map((p) => {
                let dx = 0,
                  dy = 0
                if (startAnchorPx && capturePoints.length > 0) {
                  const first = gpsToFloorPlanCoordinates(capturePoints[0].gps, floorPlan)
                  dx = startAnchorPx.x - first.x
                  dy = startAnchorPx.y - first.y
                }
                const base = gpsToFloorPlanCoordinates(p.gps, floorPlan)
                const svg = fpToSvgPx({ x: base.x + dx, y: base.y + dy })
                return <circle key={p.id} cx={svg.x} cy={svg.y} r={3} fill="#00D9A3" stroke="white" strokeWidth="1" />
              })}
              {/* Simplified and guarded current position rendering */}
              {startAnchorPx && currentPosition && (
                <g>
                  <circle
                    cx={fpToSvgPx(currentPosition).x}
                    cy={fpToSvgPx(currentPosition).y}
                    r={8}
                    fill="#FF0000"
                    stroke="white"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                  <circle
                    cx={fpToSvgPx(currentPosition).x}
                    cy={fpToSvgPx(currentPosition).y}
                    r={12}
                    fill="none"
                    stroke="#FF0000"
                    strokeWidth="2"
                    opacity="0.5"
                  />
                  {currentSensors && (
                    <line
                      x1={fpToSvgPx(currentPosition).x}
                      y1={fpToSvgPx(currentPosition).y}
                      x2={
                        fpToSvgPx(currentPosition).x + Math.cos((currentSensors.orientation.alpha * Math.PI) / 180) * 20
                      }
                      y2={
                        fpToSvgPx(currentPosition).y + Math.sin((currentSensors.orientation.alpha * Math.PI) / 180) * 20
                      }
                      stroke="#FF0000"
                      strokeWidth="3"
                    />
                  )}
                </g>
              )}
            </svg>
            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold">
              {isSettingStart ? "CLICK TO SET START" : startAnchorPx ? "YOU ARE HERE" : "SET START TO BEGIN"}
            </div>
            {/* Toggle to set start anchor */}
            <div className="absolute bottom-2 left-2 flex gap-2">
              <button
                className="px-2 py-1 text-[10px] rounded bg-white/10 text-white ring-1 ring-white/20"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsSettingStart((v) => !v)
                }}
              >
                {isSettingStart ? "Cancel" : "Set Start"}
              </button>
              {startAnchorPx && (
                <span className="px-2 py-1 text-[10px] rounded bg-green-600 text-white">Start pinned</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-[#1a1a1a] px-6 py-6 border-t border-gray-800">
        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <p className="text-gray-400">Captures</p>
            <p className="text-white font-semibold text-lg">{stats.captureCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-400">GPS</p>
            <p className="text-white font-semibold">{stats.accuracy.toFixed(0)}m</p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-400">Distance</p>
            <p className="text-white font-semibold">{stats.totalDistance.toFixed(1)}m</p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-400">Battery</p>
            <p className="text-white font-semibold">{stats.battery}%</p>
          </div>
        </div>

        {/* Capture Button */}
        <div className="flex items-center justify-center gap-4">
          <Button
            size="lg"
            className={`h-20 w-20 rounded-full shadow-lg transition-all ${
              isCapturing
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
            onClick={handleStartStop}
            disabled={!startAnchorPx || !currentGPS || !currentSensors || isSaving}
          >
            {isCapturing ? (
              <div className="flex flex-col items-center gap-1">
                <div className="h-6 w-6 rounded bg-white" />
                <span className="text-[10px] font-bold">STOP</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Video className="h-6 w-6" />
                <span className="text-[10px] font-bold">START</span>
              </div>
            )}
          </Button>

          {capturePoints.length > 0 && !isCapturing && (
            <Button
              size="lg"
              variant="default"
              className="h-16 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold"
              onClick={handleSaveTour}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : `Save Tour (${capturePoints.length})`}
            </Button>
          )}

          <Button
            size="icon"
            variant="outline"
            className="h-16 w-16 rounded-full border-2 border-white/20 bg-black/50 text-white hover:bg-white/10"
            asChild
          >
            <Link href="/tour-manager">
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold">{capturePoints.length}</span>
                <span className="text-[8px]">SAVED</span>
              </div>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
