"use client"

import { useState, useEffect } from "react"
import { Calendar, ArrowLeftRight, SplitSquareHorizontal, Layers, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { VirtualTour } from "@/lib/types"
import { tourDB } from "@/lib/db"

type ComparisonMode = "side-by-side" | "overlay" | "slider"

export function TimelineComparison() {
  const [tours, setTours] = useState<VirtualTour[]>([])
  const [selectedTourA, setSelectedTourA] = useState<VirtualTour | null>(null)
  const [selectedTourB, setSelectedTourB] = useState<VirtualTour | null>(null)
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("side-by-side")
  const [currentIndexA, setCurrentIndexA] = useState(0)
  const [currentIndexB, setCurrentIndexB] = useState(0)
  const [overlayOpacity, setOverlayOpacity] = useState(50)
  const [sliderPosition, setSliderPosition] = useState(50)

  useEffect(() => {
    const loadTours = async () => {
      try {
        await tourDB.init()
        const allTours = await tourDB.getAllTours()
        setTours(allTours.filter((t) => t.status === "completed"))

        if (allTours.length >= 2) {
          setSelectedTourA(allTours[0])
          setSelectedTourB(allTours[1])
        }
      } catch (error) {
        console.error("[v0] Error loading tours:", error)
      }
    }

    loadTours()
  }, [])

  const handleNext = () => {
    if (selectedTourA && currentIndexA < selectedTourA.capturePoints.length - 1) {
      setCurrentIndexA(currentIndexA + 1)
    }
    if (selectedTourB && currentIndexB < selectedTourB.capturePoints.length - 1) {
      setCurrentIndexB(currentIndexB + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndexA > 0) {
      setCurrentIndexA(currentIndexA - 1)
    }
    if (currentIndexB > 0) {
      setCurrentIndexB(currentIndexB - 1)
    }
  }

  const currentPointA = selectedTourA?.capturePoints[currentIndexA]
  const currentPointB = selectedTourB?.capturePoints[currentIndexB]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Timeline Comparison</h1>
              <p className="text-sm text-muted-foreground mt-1">Compare construction progress over time</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={comparisonMode === "side-by-side" ? "default" : "outline"}
                size="sm"
                onClick={() => setComparisonMode("side-by-side")}
              >
                <SplitSquareHorizontal className="h-4 w-4 mr-2" />
                Side by Side
              </Button>
              <Button
                variant={comparisonMode === "overlay" ? "default" : "outline"}
                size="sm"
                onClick={() => setComparisonMode("overlay")}
              >
                <Layers className="h-4 w-4 mr-2" />
                Overlay
              </Button>
              <Button
                variant={comparisonMode === "slider" ? "default" : "outline"}
                size="sm"
                onClick={() => setComparisonMode("slider")}
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Slider
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tour Selection */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Tour A (Before)</h3>
                <Badge variant="secondary">
                  <Calendar className="h-3 w-3 mr-1" />
                  {selectedTourA ? new Date(selectedTourA.date).toLocaleDateString() : "N/A"}
                </Badge>
              </div>
              <Select
                value={selectedTourA?.id}
                onValueChange={(value) => {
                  const tour = tours.find((t) => t.id === value)
                  setSelectedTourA(tour || null)
                  setCurrentIndexA(0)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tour" />
                </SelectTrigger>
                <SelectContent>
                  {tours.map((tour) => (
                    <SelectItem key={tour.id} value={tour.id}>
                      {tour.projectName} - {new Date(tour.date).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTourA && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{selectedTourA.capturePoints.length} capture points</p>
                  <p>{selectedTourA.metadata.totalDistance.toFixed(1)}m distance</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Tour B (After)</h3>
                <Badge variant="secondary">
                  <Calendar className="h-3 w-3 mr-1" />
                  {selectedTourB ? new Date(selectedTourB.date).toLocaleDateString() : "N/A"}
                </Badge>
              </div>
              <Select
                value={selectedTourB?.id}
                onValueChange={(value) => {
                  const tour = tours.find((t) => t.id === value)
                  setSelectedTourB(tour || null)
                  setCurrentIndexB(0)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tour" />
                </SelectTrigger>
                <SelectContent>
                  {tours.map((tour) => (
                    <SelectItem key={tour.id} value={tour.id}>
                      {tour.projectName} - {new Date(tour.date).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTourB && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{selectedTourB.capturePoints.length} capture points</p>
                  <p>{selectedTourB.metadata.totalDistance.toFixed(1)}m distance</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Comparison View */}
        {selectedTourA && selectedTourB && (
          <div className="space-y-4">
            {/* Side by Side Mode */}
            {comparisonMode === "side-by-side" && (
              <div className="grid grid-cols-2 gap-4">
                <Card className="relative overflow-hidden" style={{ height: "600px" }}>
                  <img
                    src={currentPointA?.imageUrl || "/placeholder.svg?height=600&width=800"}
                    alt="Tour A"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
                    Point {currentIndexA + 1} / {selectedTourA.capturePoints.length}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <Slider
                      value={[currentIndexA]}
                      onValueChange={([value]) => setCurrentIndexA(value)}
                      min={0}
                      max={selectedTourA.capturePoints.length - 1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </Card>

                <Card className="relative overflow-hidden" style={{ height: "600px" }}>
                  <img
                    src={currentPointB?.imageUrl || "/placeholder.svg?height=600&width=800"}
                    alt="Tour B"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
                    Point {currentIndexB + 1} / {selectedTourB.capturePoints.length}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <Slider
                      value={[currentIndexB]}
                      onValueChange={([value]) => setCurrentIndexB(value)}
                      min={0}
                      max={selectedTourB.capturePoints.length - 1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </Card>
              </div>
            )}

            {/* Overlay Mode */}
            {comparisonMode === "overlay" && (
              <Card className="relative overflow-hidden" style={{ height: "600px" }}>
                <img
                  src={currentPointA?.imageUrl || "/placeholder.svg?height=600&width=1600"}
                  alt="Tour A"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <img
                  src={currentPointB?.imageUrl || "/placeholder.svg?height=600&width=1600"}
                  alt="Tour B"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ opacity: overlayOpacity / 100 }}
                />
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <Badge className="bg-black/70 text-white">Before</Badge>
                  <div className="flex items-center gap-2 bg-black/70 px-4 py-2 rounded-lg">
                    <span className="text-white text-sm">Opacity</span>
                    <Slider
                      value={[overlayOpacity]}
                      onValueChange={([value]) => setOverlayOpacity(value)}
                      min={0}
                      max={100}
                      step={1}
                      className="w-32"
                    />
                  </div>
                  <Badge className="bg-black/70 text-white">After</Badge>
                </div>
                <div className="absolute bottom-4 left-4 right-4 space-y-2">
                  <div className="flex items-center justify-between text-white text-sm bg-black/70 px-4 py-2 rounded-lg">
                    <span>
                      Tour A: Point {currentIndexA + 1} / {selectedTourA.capturePoints.length}
                    </span>
                    <span>
                      Tour B: Point {currentIndexB + 1} / {selectedTourB.capturePoints.length}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Slider Mode */}
            {comparisonMode === "slider" && (
              <Card className="relative overflow-hidden" style={{ height: "600px" }}>
                <div className="absolute inset-0 flex">
                  <div
                    className="relative overflow-hidden"
                    style={{ width: `${sliderPosition}%`, transition: "width 0.1s" }}
                  >
                    <img
                      src={currentPointA?.imageUrl || "/placeholder.svg?height=600&width=1600"}
                      alt="Tour A"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ width: "100vw", maxWidth: "none" }}
                    />
                  </div>
                  <div className="flex-1 relative overflow-hidden">
                    <img
                      src={currentPointB?.imageUrl || "/placeholder.svg?height=600&width=1600"}
                      alt="Tour B"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ width: "100vw", maxWidth: "none", right: 0 }}
                    />
                  </div>
                </div>
                {/* Slider Handle */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10"
                  style={{ left: `${sliderPosition}%` }}
                  onMouseDown={(e) => {
                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const rect = e.currentTarget.parentElement?.getBoundingClientRect()
                      if (rect) {
                        const x = moveEvent.clientX - rect.left
                        const percentage = (x / rect.width) * 100
                        setSliderPosition(Math.max(0, Math.min(100, percentage)))
                      }
                    }
                    const handleMouseUp = () => {
                      document.removeEventListener("mousemove", handleMouseMove)
                      document.removeEventListener("mouseup", handleMouseUp)
                    }
                    document.addEventListener("mousemove", handleMouseMove)
                    document.addEventListener("mouseup", handleMouseUp)
                  }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <ArrowLeftRight className="h-4 w-4 text-black" />
                  </div>
                </div>
                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">Before</div>
                <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">After</div>
              </Card>
            )}

            {/* Navigation Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="lg" onClick={handlePrevious} disabled={currentIndexA === 0}>
                <ChevronLeft className="h-5 w-5 mr-2" />
                Previous
              </Button>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Synchronized Navigation</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round(
                    ((currentIndexA + currentIndexB) /
                      (selectedTourA.capturePoints.length + selectedTourB.capturePoints.length - 2)) *
                      100,
                  )}
                  % complete
                </p>
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={handleNext}
                disabled={
                  currentIndexA === selectedTourA.capturePoints.length - 1 &&
                  currentIndexB === selectedTourB.capturePoints.length - 1
                }
              >
                Next
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {(!selectedTourA || !selectedTourB) && (
          <Card className="p-12">
            <div className="text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select two tours to compare construction progress over time</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
