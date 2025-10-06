"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { tourDB } from "@/lib/db"
import { calculateDistance, gpsToFloorPlanCoordinates } from "@/lib/geo-utils"
import { estimateSimilarityFromTwoAnchors } from "@/lib/path-align"
import { FloorPathEditor } from "@/components/floor-path-editor"
import { computePolylineLengths, pointOnPathAt, transformPath as transformLocalPath } from "@/lib/path-align"
import type { CapturePoint, FloorPlan, GPSCoordinate, SensorData, VirtualTour } from "@/lib/types"
import { VideoIcon, ImageIcon, Save, Film } from "lucide-react"

interface VideoUploadProps {
  floorPlan: FloorPlan
}

export function VideoUpload({ floorPlan }: VideoUploadProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const floorImgRef = useRef<HTMLImageElement | null>(null)

  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [capturePoints, setCapturePoints] = useState<CapturePoint[]>([])
  const [startTime, setStartTime] = useState<number | null>(null)
  const [anchorStartPx, setAnchorStartPx] = useState<{ x: number; y: number } | null>(null)
  const [anchorForwardPx, setAnchorForwardPx] = useState<{ x: number; y: number } | null>(null)
  const [isPickingForward, setIsPickingForward] = useState(false)
  const [renderSize, setRenderSize] = useState<{ w: number; h: number }>({ w: 320, h: 320 })

  const [startLat, setStartLat] = useState<number>(floorPlan.origin.latitude)
  const [startLon, setStartLon] = useState<number>(floorPlan.origin.longitude)
  const [stepMeters, setStepMeters] = useState<number>(1) // meters moved per frame (at 2 fps => ~2 m/s)

  const [showPathEditor, setShowPathEditor] = useState(false)
  const [drawnPathPx, setDrawnPathPx] = useState<{ x: number; y: number }[] | null>(null)

  useEffect(() => {
    // ensure DB ready for saving
    tourDB.init().catch((e) => console.error("[v0] DB init error:", e))
  }, [])

  useEffect(() => {
    const updateSize = () => {
      const el = floorImgRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setRenderSize({ w: rect.width, h: rect.height })
    }
    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setVideoUrl(url)
    setCapturePoints([])
    setProgress(0)
    setStartTime(null)
    setAnchorStartPx(null)
    setAnchorForwardPx(null)
    setDrawnPathPx(null)
  }

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return
    setDuration(videoRef.current.duration || 0)
  }

  const seekTo = (t: number) =>
    new Promise<void>((resolve) => {
      const video = videoRef.current!
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked)
        resolve()
      }
      video.addEventListener("seeked", onSeeked, { once: true })
      video.currentTime = Math.min(t, Math.max(0, duration - 0.001))
    })

  // Convert local meter deltas to GPS degrees from a starting lat/lon
  const metersToLatLon = (lat0: number, lon0: number, dxEastMeters: number, dyNorthMeters: number) => {
    const metersPerDegLat = 111320 // approx
    const metersPerDegLon = 111320 * Math.cos((lat0 * Math.PI) / 180)
    const dLat = dyNorthMeters / metersPerDegLat
    const dLon = dxEastMeters / metersPerDegLon
    return { latitude: lat0 + dLat, longitude: lon0 + dLon }
  }

  const buildMockSensors = (headingDeg: number, timestamp: number): SensorData => ({
    accelerometer: { x: 0, y: 0, z: 0 },
    gyroscope: { x: 0, y: 0, z: 0 },
    orientation: {
      alpha: headingDeg, // compass heading (0-360)
      beta: 0,
      gamma: 0,
    },
    timestamp,
  })

  const mapClickToFloorPx = (e: React.MouseEvent) => {
    const el = floorImgRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const px = Math.max(0, Math.min(floorPlan.bounds.width, (x / rect.width) * floorPlan.bounds.width))
    const py = Math.max(0, Math.min(floorPlan.bounds.height, (y / rect.height) * floorPlan.bounds.height))
    return { x: px, y: py }
  }

  const handlePickAnchor = (e: React.MouseEvent) => {
    const p = mapClickToFloorPx(e)
    if (!p) return
    if (!isPickingForward) {
      setAnchorStartPx(p)
      // auto-switch to forward after picking start
      setIsPickingForward(true)
    } else {
      setAnchorForwardPx(p)
      setIsPickingForward(false)
    }
  }

  const extractFramesAt2fps = async () => {
    if (!videoRef.current || !canvasRef.current || !videoUrl) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set CORS to avoid canvas tainting if needed
    try {
      video.crossOrigin = "anonymous"
    } catch {
      // ignore if not allowed by the browser for local blob
    }

    // Ensure metadata is loaded
    if (!duration || Number.isNaN(duration)) {
      await new Promise<void>((res) => {
        const onLoaded = () => {
          video.removeEventListener("loadedmetadata", onLoaded)
          res()
        }
        video.addEventListener("loadedmetadata", onLoaded, { once: true })
      })
      setDuration(video.duration || 0)
    }

    setIsProcessing(true)
    setStartTime(Date.now())

    // Determine timestamps (every 0.5s)
    const times: number[] = []
    const step = 0.5
    for (let t = 0; t <= duration; t += step) {
      times.push(Number(t.toFixed(3)))
    }

    const points: CapturePoint[] = []
    const localPath: { x: number; y: number }[] = [] // local odometry path in meters
    let dxTotal = 0
    const dyTotal = 0

    for (let i = 0; i < times.length; i++) {
      const t = times[i]
      // Seek
      await seekTo(t)

      // Draw frame
      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9))
      if (!blob) continue
      const imageUrl = URL.createObjectURL(blob)

      // Simulate motion eastward stepMeters per frame
      dxTotal += stepMeters
      // Build GPS coord from start + offsets
      const gpsBase = metersToLatLon(startLat, startLon, dxTotal, dyTotal)
      const gps: GPSCoordinate = {
        latitude: gpsBase.latitude,
        longitude: gpsBase.longitude,
        accuracy: 3,
        timestamp: Date.now() + Math.round(t * 1000),
      }

      // Mock sensors facing east (90°)
      const sensors: SensorData = buildMockSensors(90, gps.timestamp)

      const capturePoint: CapturePoint = {
        id: `capture-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        timestamp: gps.timestamp,
        gps,
        sensors,
        imageUrl,
        direction: 90,
      }
      points.push(capturePoint)

      localPath.push({ x: dxTotal, y: dyTotal })

      setProgress(Math.round(((i + 1) / times.length) * 100))
    }
    ;(points as any).__localPath = localPath

    setCapturePoints(points)
    setIsProcessing(false)
  }

  const handleSaveTour = async () => {
    if (capturePoints.length === 0) {
      alert("No frames extracted. Please process a video first.")
      return
    }
    const projectName = prompt("Enter a name for this tour:")
    if (!projectName) return

    try {
      console.log("[v0] Processing tour with", capturePoints.length, "capture points from video")
      // Build path segments
      const pathSegments = []
      for (let i = 0; i < capturePoints.length - 1; i++) {
        const start = capturePoints[i]
        const end = capturePoints[i + 1]
        const distance = calculateDistance(start.gps.latitude, start.gps.longitude, end.gps.latitude, end.gps.longitude)
        const durationMs = end.timestamp - start.timestamp
        pathSegments.push({ start, end, distance, duration: durationMs })
      }

      const now = Date.now()
      const localPath: { x: number; y: number }[] =
        ((capturePoints as any).__localPath as { x: number; y: number }[]) || []
      let floorPositions: { x: number; y: number }[] | null = null
      let transformParams: { scale: number; rotationRad: number; tx: number; ty: number } | undefined = undefined

      if (drawnPathPx && drawnPathPx.length > 1) {
        const { segLen, total } = computePolylineLengths(drawnPathPx)
        floorPositions = capturePoints.map((_, idx) => {
          const s = drawnPathPx.length < 2 ? 0 : (idx / Math.max(1, capturePoints.length - 1)) * total
          const { x, y } = pointOnPathAt(drawnPathPx, segLen, s)
          return { x, y }
        })
      } else if (anchorStartPx && anchorForwardPx && localPath.length > 0) {
        const t = estimateSimilarityFromTwoAnchors({
          floorStartPx: anchorStartPx,
          floorForwardPx: anchorForwardPx,
          localForwardMeters: 1,
        })
        transformParams = t
        floorPositions = transformLocalPath(localPath, t)
      } else {
        floorPositions = capturePoints.map((p) => gpsToFloorPlanCoordinates(p.gps, floorPlan))
      }

      const tour: VirtualTour = {
        id: `tour-${now}-${Math.random().toString(36).slice(2, 9)}`,
        projectId: `project-${now}`,
        projectName,
        date: new Date(),
        capturePoints: capturePoints.map((p, idx) => {
          const pos = floorPositions![idx]
          // derive facing from path tangent when drawn path exists
          let direction = p.direction
          if (drawnPathPx && drawnPathPx.length > 1) {
            const { segLen } = computePolylineLengths(drawnPathPx)
            const s = (idx / Math.max(1, capturePoints.length - 1)) * segLen.reduce((a, b) => a + b, 0)
            const { angle } = pointOnPathAt(drawnPathPx, segLen, s)
            direction = ((angle * 180) / Math.PI + 360) % 360
          }
          return { ...p, floorPlanPosition: pos, direction }
        }),
        pathSegments,
        floorPlan,
        metadata: {
          duration: startTime ? Date.now() - startTime : 0,
          totalDistance:
            capturePoints.length > 1
              ? capturePoints
                  .slice(1)
                  .reduce(
                    (sum, p, idx) =>
                      sum +
                      calculateDistance(
                        capturePoints[idx].gps.latitude,
                        capturePoints[idx].gps.longitude,
                        p.gps.latitude,
                        p.gps.longitude,
                      ),
                    0,
                  )
              : 0,
          captureCount: capturePoints.length,
          captureMode: "video",
          captureInterval: 0.5,
          alignment: {
            startPx: anchorStartPx ?? undefined,
            forwardPx: anchorForwardPx ?? undefined,
            transform: transformParams,
            pathPx: drawnPathPx ?? undefined,
          },
        },
        status: "completed",
      }

      await tourDB.saveTour(tour)
      for (const cp of tour.capturePoints) await tourDB.saveCapturePoint(cp)

      alert(`Tour "${projectName}" saved successfully with ${capturePoints.length} frames!`)
      console.log("[v0] Tour saved successfully:", tour.id)

      // Reset UI
      setCapturePoints([])
      setProgress(0)
      setStartTime(null)
      setAnchorStartPx(null)
      setAnchorForwardPx(null)
      setDrawnPathPx(null)
    } catch (error) {
      console.error("[v0] Error saving tour:", error)
      alert("Failed to save tour. Please try again.")
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground text-pretty">Video Upload to Virtual Tour</h1>
        <Badge variant="secondary" className="font-mono">
          2 fps extraction
        </Badge>
      </div>

      <Card className="p-4 md:p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Select Video</label>
            <Input type="file" accept="video/*" onChange={handleFileChange} />
            <p className="text-xs text-muted-foreground">
              We'll extract images every 0.5 seconds to build a virtual tour aligned to your floor plan.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Starting GPS (Latitude)</label>
            <Input
              type="number"
              step="0.000001"
              value={startLat}
              onChange={(e) => setStartLat(Number(e.target.value))}
            />
            <label className="text-sm font-medium text-foreground">Starting GPS (Longitude)</label>
            <Input
              type="number"
              step="0.000001"
              value={startLon}
              onChange={(e) => setStartLon(Number(e.target.value))}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Step per Frame (meters)</label>
            <Input
              type="number"
              step="0.1"
              value={stepMeters}
              onChange={(e) => setStepMeters(Number(e.target.value))}
            />
            <div className="text-xs text-muted-foreground">
              At 2 fps, 1 meter/frame ≈ 2 m/s simulated walking speed.
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                src={videoUrl ?? undefined}
                onLoadedMetadata={handleLoadedMetadata}
                className="h-full w-full object-contain"
                controls
                playsInline
              />
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Film className="h-4 w-4" />
                <span className="text-sm">Duration:</span>
              </div>
              <div className="text-sm font-medium text-foreground">{duration.toFixed(1)}s</div>
            </div>

            <div className="space-y-2">
              <div className="h-2 w-full rounded bg-muted overflow-hidden">
                <div
                  className="h-2 bg-primary transition-all"
                  style={{ width: `${isProcessing ? progress : capturePoints.length ? 100 : progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  <span>Frames:</span>
                </div>
                <span className="font-medium text-foreground">{capturePoints.length}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                className="gap-2"
                onClick={extractFramesAt2fps}
                disabled={!videoUrl || isProcessing}
                title="Extract frames at 2 fps"
              >
                <VideoIcon className="h-4 w-4" />
                {isProcessing ? "Processing..." : "Process Video"}
              </Button>

              <Button
                variant="default"
                className="gap-2"
                onClick={handleSaveTour}
                disabled={capturePoints.length === 0 || isProcessing}
              >
                <Save className="h-4 w-4" />
                Save Tour
              </Button>
            </div>

            <div className="rounded-md border p-3">
              <p className="text-sm text-pretty">
                The tour will be aligned to your floor plan using its origin GPS, scale, and rotation. You can adjust
                the starting GPS to better match your route before saving.
              </p>
            </div>

            <div className="rounded-md border p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">Floor Plan Alignment</p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowPathEditor(true)}>
                    Draw Path
                  </Button>
                </div>
              </div>
              <div className="relative">
                <img
                  ref={floorImgRef}
                  src={floorPlan.imageUrl || "/placeholder.svg"}
                  alt="Floor plan"
                  className="w-full h-64 object-contain rounded-md cursor-crosshair"
                  onClick={handlePickAnchor}
                />
                <svg className="absolute inset-0 w-full h-64 pointer-events-none">
                  {drawnPathPx && drawnPathPx.length > 1 && (
                    <path
                      d={drawnPathPx
                        .map((pt, i) => {
                          const x = (pt.x / floorPlan.bounds.width) * renderSize.w
                          const y = (pt.y / floorPlan.bounds.height) * renderSize.h
                          return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#00D9A3"
                      strokeWidth="3"
                      opacity="0.8"
                    />
                  )}
                  {anchorStartPx && (
                    <circle
                      cx={(anchorStartPx.x / floorPlan.bounds.width) * renderSize.w}
                      cy={(anchorStartPx.y / floorPlan.bounds.height) * renderSize.h}
                      r="6"
                      fill="#22c55e"
                      stroke="white"
                      strokeWidth="2"
                    />
                  )}
                  {anchorForwardPx && (
                    <circle
                      cx={(anchorForwardPx.x / floorPlan.bounds.width) * renderSize.w}
                      cy={(anchorForwardPx.y / floorPlan.bounds.height) * renderSize.h}
                      r="6"
                      fill="#3b82f6"
                      stroke="white"
                      strokeWidth="2"
                    />
                  )}
                  {!drawnPathPx && anchorStartPx && anchorForwardPx && (capturePoints as any).__localPath && (
                    <path
                      d={(() => {
                        const localPath: { x: number; y: number }[] = (capturePoints as any).__localPath
                        const t = estimateSimilarityFromTwoAnchors({
                          floorStartPx: anchorStartPx,
                          floorForwardPx: anchorForwardPx,
                          localForwardMeters: 1,
                        })
                        const fp = transformLocalPath(localPath, t)
                        return fp
                          .map((pt, i) => {
                            const x = (pt.x / floorPlan.bounds.width) * renderSize.w
                            const y = (pt.y / floorPlan.bounds.height) * renderSize.h
                            return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
                          })
                          .join(" ")
                      })()}
                      fill="none"
                      stroke="#00D9A3"
                      strokeWidth="3"
                      opacity="0.7"
                    />
                  )}
                </svg>
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                Use Draw Path to sketch your route on the floor plan. Frames will be placed along that path by time. If
                you skip this, you can still use Start/Forward anchors to align a straight path.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {showPathEditor && (
        <div className="fixed inset-0 z-50 bg-black/60 p-6 flex items-center justify-center">
          <div className="max-w-5xl w-full rounded-lg bg-background p-4">
            <FloorPathEditor
              floorPlanImageUrl={floorPlan.imageUrl}
              onCancel={() => setShowPathEditor(false)}
              onComplete={({ start, polyline }) => {
                // convert normalized -> pixels
                const toPx = (p: { x: number; y: number }) => ({
                  x: p.x * floorPlan.bounds.width,
                  y: p.y * floorPlan.bounds.height,
                })
                const pxPolyline = [toPx(start), ...polyline.map(toPx)]
                setDrawnPathPx(pxPolyline)
                setShowPathEditor(false)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
