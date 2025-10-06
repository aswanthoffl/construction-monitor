"use client"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Settings, Zap, Eye, Compass } from "lucide-react"

interface PanoramaControlsProps {
  autoRotate: boolean
  onAutoRotateChange: (value: boolean) => void
  autoRotateSpeed: number
  onAutoRotateSpeedChange: (value: number) => void
  showCompass: boolean
  onShowCompassChange: (value: boolean) => void
  transitionSpeed: number
  onTransitionSpeedChange: (value: number) => void
}

export function PanoramaControls({
  autoRotate,
  onAutoRotateChange,
  autoRotateSpeed,
  onAutoRotateSpeedChange,
  showCompass,
  onShowCompassChange,
  transitionSpeed,
  onTransitionSpeedChange,
}: PanoramaControlsProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-black/70 text-white hover:bg-black/90">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Panorama Settings</SheetTitle>
          <SheetDescription>Customize your 360° viewing experience</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 mt-6">
          {/* Auto Rotate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-rotate" className="flex items-center gap-2">
                <Compass className="h-4 w-4" />
                Auto Rotate
              </Label>
              <Switch id="auto-rotate" checked={autoRotate} onCheckedChange={onAutoRotateChange} />
            </div>
            {autoRotate && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Rotation Speed</Label>
                <Slider
                  value={[autoRotateSpeed]}
                  onValueChange={([value]) => onAutoRotateSpeedChange(value)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
              </div>
            )}
          </div>

          {/* Show Compass */}
          <div className="flex items-center justify-between">
            <Label htmlFor="show-compass" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Show Compass
            </Label>
            <Switch id="show-compass" checked={showCompass} onCheckedChange={onShowCompassChange} />
          </div>

          {/* Transition Speed */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Transition Speed
            </Label>
            <Slider
              value={[transitionSpeed]}
              onValueChange={([value]) => onTransitionSpeedChange(value)}
              min={100}
              max={1000}
              step={100}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Fast (100ms)</span>
              <span>Slow (1000ms)</span>
            </div>
          </div>

          {/* Quality Settings */}
          <div className="space-y-2">
            <Label>Image Quality</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm">
                Low
              </Button>
              <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                Medium
              </Button>
              <Button variant="outline" size="sm">
                High
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Higher quality uses more bandwidth</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
