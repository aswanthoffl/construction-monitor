"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, MapPin, RotateCw, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { tourDB } from "@/lib/db"
import type { FloorPlan, GPSCoordinate } from "@/lib/types"

export function FloorPlanUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [floorPlanImage, setFloorPlanImage] = useState<string | null>(null)
  const [floorPlanName, setFloorPlanName] = useState("")
  const [scale, setScale] = useState(0.1) // meters per pixel
  const [rotation, setRotation] = useState(0)
  const [origin, setOrigin] = useState<GPSCoordinate | null>(null)
  const [isSettingOrigin, setIsSettingOrigin] = useState(false)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      setFloorPlanImage(imageUrl)
      setFloorPlanName(file.name.replace(/\.[^/.]+$/, ""))

      // Get image dimensions
      const img = new Image()
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height })
      }
      img.src = imageUrl
    }
    reader.readAsDataURL(file)
  }

  const handleSetOrigin = () => {
    setIsSettingOrigin(true)
    // Request current GPS position
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setOrigin({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          })
          setIsSettingOrigin(false)
        },
        (error) => {
          console.error("[v0] GPS error:", error)
          alert("Unable to get GPS location. Please enable location services.")
          setIsSettingOrigin(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      )
    }
  }

  const handleSave = async () => {
    if (!floorPlanImage || !origin) {
      alert("Please upload a floor plan and set the origin GPS coordinates.")
      return
    }

    const floorPlan: FloorPlan = {
      id: `floorplan-${Date.now()}`,
      name: floorPlanName || "Untitled Floor Plan",
      imageUrl: floorPlanImage,
      scale,
      origin,
      rotation,
      bounds: imageDimensions,
    }

    try {
      await tourDB.saveFloorPlan(floorPlan)
      alert("Floor plan saved successfully!")
      console.log("[v0] Floor plan saved:", floorPlan)
    } catch (error) {
      console.error("[v0] Error saving floor plan:", error)
      alert("Failed to save floor plan.")
    }
  }

  const handleCancel = () => {
    setFloorPlanImage(null)
    setFloorPlanName("")
    setScale(0.1)
    setRotation(0)
    setOrigin(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Floor Plan Upload</h1>
          <p className="text-muted-foreground mt-2">
            Upload a floor plan and configure GPS mapping for accurate position tracking
          </p>
        </div>

        {!floorPlanImage ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-primary/10 p-6">
                <Upload className="h-12 w-12 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Upload Floor Plan</h3>
                <p className="text-sm text-muted-foreground mt-1">Supports PNG, JPG, or PDF files</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()} size="lg" className="mt-4">
                <Upload className="mr-2 h-5 w-5" />
                Choose File
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Floor Plan Preview */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Floor Plan Preview</h3>
              <div className="relative bg-muted rounded-lg overflow-hidden" style={{ height: "400px" }}>
                <img
                  src={floorPlanImage || "/placeholder.svg"}
                  alt="Floor plan"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                  }}
                />
                {/* Origin marker */}
                {origin && (
                  <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Origin Set
                  </div>
                )}
              </div>
            </Card>

            {/* Configuration */}
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-semibold">Configuration</h3>

              {/* Floor Plan Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Floor Plan Name</Label>
                <Input
                  id="name"
                  value={floorPlanName}
                  onChange={(e) => setFloorPlanName(e.target.value)}
                  placeholder="e.g., Level 1 - Office Tower"
                />
              </div>

              {/* Scale */}
              <div className="space-y-2">
                <Label>Scale (meters per pixel)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[scale]}
                    onValueChange={([value]) => setScale(value)}
                    min={0.01}
                    max={1}
                    step={0.01}
                    className="flex-1"
                  />
                  <div className="w-20 text-right">
                    <Input
                      type="number"
                      value={scale.toFixed(2)}
                      onChange={(e) => setScale(Number.parseFloat(e.target.value) || 0.1)}
                      step={0.01}
                      min={0.01}
                      max={1}
                      className="text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Adjust based on your floor plan's scale. Typical values: 0.05-0.2
                </p>
              </div>

              {/* Rotation */}
              <div className="space-y-2">
                <Label>Rotation (degrees)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[rotation]}
                    onValueChange={([value]) => setRotation(value)}
                    min={0}
                    max={360}
                    step={1}
                    className="flex-1"
                  />
                  <div className="w-20 text-right">
                    <Input
                      type="number"
                      value={rotation}
                      onChange={(e) => setRotation(Number.parseInt(e.target.value) || 0)}
                      step={1}
                      min={0}
                      max={360}
                      className="text-sm"
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={() => setRotation((prev) => (prev + 90) % 360)}>
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Rotate to align with true north</p>
              </div>

              {/* GPS Origin */}
              <div className="space-y-2">
                <Label>GPS Origin (Top-Left Corner)</Label>
                {origin ? (
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Lat: {origin.latitude.toFixed(6)}, Lon: {origin.longitude.toFixed(6)}
                      </p>
                      <p className="text-xs text-muted-foreground">Accuracy: {origin.accuracy.toFixed(1)}m</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleSetOrigin}>
                      Update
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleSetOrigin}
                    disabled={isSettingOrigin}
                    className="w-full bg-transparent"
                    variant="outline"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {isSettingOrigin ? "Getting GPS Location..." : "Set GPS Origin"}
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  Stand at the top-left corner of your floor plan and capture GPS coordinates
                </p>
              </div>

              {/* Dimensions Info */}
              <div className="p-4 bg-muted rounded-lg space-y-1">
                <p className="text-sm font-medium">Floor Plan Dimensions</p>
                <p className="text-xs text-muted-foreground">
                  {imageDimensions.width} × {imageDimensions.height} pixels
                </p>
                <p className="text-xs text-muted-foreground">
                  Physical size: {(imageDimensions.width * scale).toFixed(1)}m ×{" "}
                  {(imageDimensions.height * scale).toFixed(1)}m
                </p>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4">
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!origin}>
                <Check className="mr-2 h-4 w-4" />
                Save Floor Plan
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
