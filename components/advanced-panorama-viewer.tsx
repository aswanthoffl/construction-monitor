"use client"

import type React from "react"
import { VirtualTourViewer } from "@/components/virtual-tour-viewer"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Map,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Eye,
  Tag,
  Save,
  Navigation2,
  Home,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { VirtualTour, FloorPlan, CapturePoint } from "@/lib/types"
import { gpsToFloorPlanCoordinates, getCardinalDirection } from "@/lib/geo-utils"
import { tourDB } from "@/lib/db"

interface Hotspot {
  id: string
  pitch: number
  yaw: number
  type: "navigation" | "info" | "label"
  text: string
  targetIndex?: number
  cssClass?: string
}

interface AdvancedPanoramaViewerProps {
  tour: VirtualTour
  floorPlan?: FloorPlan
  onSave?: (tour: VirtualTour) => void
}

export function AdvancedPanoramaViewer({ tour, floorPlan, onSave }: AdvancedPanoramaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playSpeed, setPlaySpeed] = useState(1)
  const [showFloorPlan, setShowFloorPlan] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isVRMode, setIsVRMode] = useState(false)
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [isAddingLabel, setIsAddingLabel] = useState(false)
  const [newLabelText, setNewLabelText] = useState("")
  const [zoom, setZoom] = useState(100)
  const [pitch, setPitch] = useState(0)
  const [yaw, setYaw] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isEquirectangular, setIsEquirectangular] = useState<boolean | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  const pannellumRef = useRef<any>(null)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const currentPoint = tour.capturePoints[currentIndex]
  const totalPoints = tour.capturePoints.length

  useEffect(() => {
    const point = currentPoint
    if (!point?.imageUrl) {
      setIsEquirectangular(null)
      return
    }

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const ratio = img.width / img.height
      // Equirectangular panoramas are ~2:1; allow small tolerance
      const isApproxEquirect = ratio > 1.95 && ratio < 2.05
      setIsEquirectangular(isApproxEquirect)
      console.log("[v0] Panorama aspect check:", { width: img.width, height: img.height, ratio, isApproxEquirect })
    }
    img.onerror = () => {
      console.warn("[v0] Failed to load image for aspect check; defaulting to flat viewer")
      setIsEquirectangular(false)
    }
    img.src = point.imageUrl
  }, [currentPoint])

  useEffect(() => {
    if (!viewerRef.current || !currentPoint) return
    if (isEquirectangular === false) return // do not init pannellum for non-360 images
    if (isEquirectangular === null) return // still determining

    // Load Pannellum library dynamically
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"
    script.async = true
    document.head.appendChild(script)

    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css"
    document.head.appendChild(link)

    script.onload = () => {
      if (window.pannellum && viewerRef.current) {
        // Destroy existing viewer
        if (pannellumRef.current) {
          pannellumRef.current.destroy()
        }

        // Create new viewer with higher pixel ratio for sharper rendering
        pannellumRef.current = window.pannellum.viewer(viewerRef.current, {
          type: "equirectangular",
          panorama: currentPoint.imageUrl || "/360-panorama.png",
          autoLoad: true,
          showControls: false,
          mouseZoom: true,
          draggable: true,
          keyboardZoom: true,
          friction: 0.15,
          // Ensure sharper canvas on HiDPI screens
          maxPixelRatio: Math.min(window.devicePixelRatio || 1, 2),
          // Keep hfov synced with our zoom and set sensible bounds
          hfov: zoom,
          minHfov: 30,
          maxHfov: 120,
          pitch: pitch,
          yaw: currentPoint.direction || yaw,
          hotSpots: generateHotspots(),
        })

        // Listen to view changes
        pannellumRef.current.on("mouseup", () => {
          setPitch(pannellumRef.current.getPitch())
          setYaw(pannellumRef.current.getYaw())
        })
      }
    }

    return () => {
      if (pannellumRef.current) {
        pannellumRef.current.destroy()
      }
    }
  }, [currentIndex, currentPoint, hotspots, showLabels, isEquirectangular])

  useEffect(() => {
    if (pannellumRef.current) {
      pannellumRef.current.setHfov(zoom)
    }
  }, [zoom])

  const generateHotspots = useCallback(() => {
    const spots: any[] = []

    // Add navigation arrows to adjacent panoramas
    if (currentIndex > 0) {
      spots.push({
        pitch: 0,
        yaw: -180,
        type: "info",
        text: "← Previous",
        cssClass: "custom-hotspot navigation-hotspot",
        clickHandlerFunc: () => handleNavigate(currentIndex - 1),
      })
    }

    if (currentIndex < totalPoints - 1) {
      spots.push({
        pitch: 0,
        yaw: 0,
        type: "info",
        text: "Next →",
        cssClass: "custom-hotspot navigation-hotspot",
        clickHandlerFunc: () => handleNavigate(currentIndex + 1),
      })
    }

    // Add custom label hotspots
    if (showLabels) {
      hotspots
        .filter((h) => h.type === "label")
        .forEach((hotspot) => {
          spots.push({
            pitch: hotspot.pitch,
            yaw: hotspot.yaw,
            type: "info",
            text: hotspot.text,
            cssClass: "custom-hotspot label-hotspot",
          })
        })
    }

    // Add navigation hotspots to specific points
    hotspots
      .filter((h) => h.type === "navigation" && h.targetIndex !== undefined)
      .forEach((hotspot) => {
        spots.push({
          pitch: hotspot.pitch,
          yaw: hotspot.yaw,
          type: "info",
          text: `Go to Point ${hotspot.targetIndex! + 1}`,
          cssClass: "custom-hotspot navigation-hotspot",
          clickHandlerFunc: () => handleNavigate(hotspot.targetIndex!),
        })
      })

    return spots
  }, [currentIndex, totalPoints, hotspots, showLabels])

  const handleNavigate = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalPoints || index === currentIndex) return

      setIsTransitioning(true)

      // Fade out
      setTimeout(() => {
        setCurrentIndex(index)
        setIsTransitioning(false)
      }, 300)
    },
    [currentIndex, totalPoints],
  )

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= totalPoints - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 3000 / playSpeed)
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [isPlaying, playSpeed, totalPoints])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handleNavigate(currentIndex - 1)
      else if (e.key === "ArrowRight") handleNavigate(currentIndex + 1)
      else if (e.key === " ") {
        e.preventDefault()
        setIsPlaying(!isPlaying)
      } else if (e.key === "f" || e.key === "F") toggleFullscreen()
      else if (e.key === "m" || e.key === "M") setShowFloorPlan(!showFloorPlan)
      else if (e.key === "l" || e.key === "L") setShowLabels(!showLabels)
      else if (e.key === "h" || e.key === "H") resetView()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentIndex, isPlaying, showFloorPlan, showLabels])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return

    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x

    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) handleNavigate(currentIndex - 1)
      else handleNavigate(currentIndex + 1)
    }

    touchStartRef.current = null
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const toggleVRMode = () => {
    if (pannellumRef.current) {
      if (!isVRMode) {
        pannellumRef.current.toggleFullscreen()
      }
      setIsVRMode(!isVRMode)
    }
  }

  const resetView = () => {
    if (pannellumRef.current) {
      pannellumRef.current.setPitch(0)
      pannellumRef.current.setYaw(currentPoint?.direction || 0)
      pannellumRef.current.setHfov(100)
    }
    setPitch(0)
    setYaw(currentPoint?.direction || 0)
    setZoom(100)
  }

  const addLabel = () => {
    if (!newLabelText.trim()) return

    const newHotspot: Hotspot = {
      id: `label-${Date.now()}`,
      pitch: pannellumRef.current?.getPitch() || 0,
      yaw: pannellumRef.current?.getYaw() || 0,
      type: "label",
      text: newLabelText,
    }

    setHotspots([...hotspots, newHotspot])
    setNewLabelText("")
    setIsAddingLabel(false)
  }

  const handleSaveTour = async () => {
    const updatedTour = {
      ...tour,
      metadata: {
        ...tour.metadata,
        hotspots: hotspots,
      },
    }

    await tourDB.saveTour(updatedTour)
    onSave?.(updatedTour)
  }

  const getFloorPlanPosition = (point: CapturePoint) => {
    if (!floorPlan) return null
    return gpsToFloorPlanCoordinates(point.gps, floorPlan)
  }

  return (
    <>
      {isEquirectangular === false ? (
        <VirtualTourViewer tour={tour} floorPlan={floorPlan} />
      ) : (
        <div
          ref={containerRef}
          className="relative flex h-screen flex-col bg-black"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            ref={viewerRef}
            className={`relative flex-1 transition-opacity duration-300 ${isTransitioning ? "opacity-30" : "opacity-100"}`}
            style={{ width: "100%", height: "100%" }}
          />
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
                asChild
              >
                <a href="/tour-manager">
                  <ChevronLeft className="h-6 w-6" />
                </a>
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-white">{tour.projectName}</h1>
                <p className="text-xs text-gray-300">
                  360° Indoor Tour • {totalPoints} panoramas • {tour.metadata.totalDistance.toFixed(0)}m
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="bg-black/70 text-white">
                      <Navigation2 className="h-3 w-3 mr-1" />
                      {getCardinalDirection(currentPoint?.direction || 0)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Current viewing direction</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-black/70 text-white hover:bg-black/90"
                    onClick={() => setZoom((prev) => Math.min(prev + 20, 120))}
                  >
                    <ZoomIn className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Zoom In</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-black/70 text-white hover:bg-black/90"
                    onClick={() => setZoom((prev) => Math.max(prev - 20, 50))}
                  >
                    <ZoomOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Zoom Out</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-black/70 text-white hover:bg-black/90"
                    onClick={resetView}
                  >
                    <Home className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Reset View (H)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-12 w-12 rounded-full text-white hover:bg-black/90 ${showFloorPlan ? "bg-primary" : "bg-black/70"}`}
                    onClick={() => setShowFloorPlan(!showFloorPlan)}
                  >
                    <Map className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Toggle Map (M)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-12 w-12 rounded-full text-white hover:bg-black/90 ${showLabels ? "bg-primary" : "bg-black/70"}`}
                    onClick={() => setShowLabels(!showLabels)}
                  >
                    <Tag className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Toggle Labels (L)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-black/70 text-white hover:bg-black/90"
                    onClick={toggleFullscreen}
                  >
                    {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Fullscreen (F)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-12 w-12 rounded-full text-white hover:bg-black/90 ${isVRMode ? "bg-primary" : "bg-black/70"}`}
                    onClick={toggleVRMode}
                  >
                    <Eye className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">VR Mode</TooltipContent>
              </Tooltip>

              <Dialog open={isAddingLabel} onOpenChange={setIsAddingLabel}>
                <DialogTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 rounded-full bg-black/70 text-white hover:bg-black/90"
                      >
                        <Tag className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Add Label</TooltipContent>
                  </Tooltip>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Label</DialogTitle>
                    <DialogDescription>Add a label at your current view position</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="label-text">Label Text</Label>
                      <Input
                        id="label-text"
                        value={newLabelText}
                        onChange={(e) => setNewLabelText(e.target.value)}
                        placeholder="e.g., Kitchen Door, Sofa, Window"
                      />
                    </div>
                    <Button onClick={addLabel} className="w-full">
                      Add Label
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-black/70 text-white hover:bg-black/90"
                    onClick={handleSaveTour}
                  >
                    <Save className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Save Tour</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-black/80 rounded-full p-2 flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full text-white hover:bg-white/20"
                onClick={() => handleNavigate(currentIndex - 1)}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full text-white hover:bg-white/20"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>

              <div className="px-4">
                <Slider
                  value={[currentIndex]}
                  onValueChange={([value]) => handleNavigate(value)}
                  min={0}
                  max={totalPoints - 1}
                  step={1}
                  className="w-64"
                />
              </div>

              <span className="text-white text-sm font-medium px-2">
                {currentIndex + 1} / {totalPoints}
              </span>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full text-white hover:bg-white/20"
                onClick={() => handleNavigate(currentIndex + 1)}
                disabled={currentIndex === totalPoints - 1}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-1 ml-2 px-2 border-l border-white/20">
                <span className="text-white text-xs">Speed:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 px-2 text-xs ${playSpeed === 0.5 ? "bg-white/20" : ""}`}
                  onClick={() => setPlaySpeed(0.5)}
                >
                  0.5x
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 px-2 text-xs ${playSpeed === 1 ? "bg-white/20" : ""}`}
                  onClick={() => setPlaySpeed(1)}
                >
                  1x
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 px-2 text-xs ${playSpeed === 2 ? "bg-white/20" : ""}`}
                  onClick={() => setPlaySpeed(2)}
                >
                  2x
                </Button>
              </div>
            </div>
          </div>

          {showFloorPlan && floorPlan && (
            <div className="absolute top-20 left-4 w-80 bg-black/90 rounded-lg border border-white/20 overflow-hidden z-10">
              <div className="relative w-full h-80 p-4">
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-semibold">
                  FLOOR PLAN
                </div>
                <img
                  src={floorPlan.imageUrl || "/placeholder.svg"}
                  alt="Floor plan"
                  className="w-full h-full object-contain opacity-50"
                />
                <svg className="absolute inset-0 w-full h-full">
                  {/* Draw path */}
                  <path
                    d={tour.capturePoints
                      .map((point, index) => {
                        const pos = getFloorPlanPosition(point)
                        if (!pos) return ""
                        const x = (pos.x / floorPlan.bounds.width) * 320
                        const y = (pos.y / floorPlan.bounds.height) * 320
                        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
                      })
                      .join(" ")}
                    fill="none"
                    stroke="#00D9A3"
                    strokeWidth="3"
                    opacity="0.6"
                  />
                  {/* Draw panorama points */}
                  {tour.capturePoints.map((point, index) => {
                    const pos = getFloorPlanPosition(point)
                    if (!pos) return null
                    const x = (pos.x / floorPlan.bounds.width) * 320
                    const y = (pos.y / floorPlan.bounds.height) * 320
                    const isCurrent = index === currentIndex

                    return (
                      <g key={point.id} className="cursor-pointer transition-all" onClick={() => handleNavigate(index)}>
                        <circle
                          cx={x}
                          cy={y}
                          r={isCurrent ? 10 : 6}
                          fill={isCurrent ? "#00D9A3" : "#3B82F6"}
                          stroke="white"
                          strokeWidth={isCurrent ? 3 : 2}
                          className="hover:r-8 transition-all"
                        />
                        {isCurrent && (
                          <>
                            <circle cx={x} cy={y} r={16} fill="none" stroke="#00D9A3" strokeWidth="2" opacity="0.5">
                              <animate attributeName="r" from="16" to="24" dur="1.5s" repeatCount="indefinite" />
                              <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                            </circle>
                            <line
                              x1={x}
                              y1={y}
                              x2={x + Math.cos(((point.direction - 90) * Math.PI) / 180) * 25}
                              y2={y + Math.sin(((point.direction - 90) * Math.PI) / 180) * 25}
                              stroke="#00D9A3"
                              strokeWidth="3"
                              markerEnd="url(#arrowhead)"
                            />
                          </>
                        )}
                      </g>
                    )
                  })}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="10"
                      refX="5"
                      refY="3"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <polygon points="0 0, 10 3, 0 6" fill="#00D9A3" />
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>
          )}

          {!isFullscreen && (
            <div className="absolute bottom-24 left-4 bg-black/80 text-white px-4 py-3 rounded-lg text-xs space-y-1 z-10">
              <p className="font-semibold flex items-center gap-2">
                <Info className="h-4 w-4" />
                Keyboard Shortcuts
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <p>← → Navigate</p>
                <p>Space Play/Pause</p>
                <p>F Fullscreen</p>
                <p>M Toggle Map</p>
                <p>L Toggle Labels</p>
                <p>H Reset View</p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

// Add type declaration for pannellum
declare global {
  interface Window {
    pannellum: any
  }
}
