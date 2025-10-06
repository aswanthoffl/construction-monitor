"use client"

import { useState } from "react"
import { ChevronLeft, Camera, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import Link from "next/link"

export function CaptureMode() {
  const [isCapturing, setIsCapturing] = useState(false)

  return (
    <div className="relative flex min-h-screen flex-col bg-black">
      {/* Camera View */}
      <div className="relative flex-1">
        <img
          src="/construction-interior-wide.jpg"
          alt="Construction site view"
          className="h-full w-full object-cover"
        />

        {/* AR Overlay - Floor Plan */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="h-[500px] w-[300px]" viewBox="0 0 300 500">
            {/* Floor plan outline */}
            <rect x="50" y="50" width="200" height="400" fill="none" stroke="white" strokeWidth="1" opacity="0.6" />

            {/* Interior walls */}
            <line x1="50" y1="150" x2="250" y2="150" stroke="white" strokeWidth="1" opacity="0.6" />
            <line x1="50" y1="250" x2="250" y2="250" stroke="white" strokeWidth="1" opacity="0.6" />
            <line x1="50" y1="350" x2="250" y2="350" stroke="white" strokeWidth="1" opacity="0.6" />
            <line x1="150" y1="50" x2="150" y2="450" stroke="white" strokeWidth="1" opacity="0.6" />

            {/* Capture path with nodes */}
            <path
              d="M 150 420 L 150 380 L 150 320 L 150 280 L 150 220 L 150 180 L 150 120 L 150 80"
              fill="none"
              stroke="#00D9A3"
              strokeWidth="3"
            />

            {/* Capture nodes */}
            <circle cx="150" cy="420" r="6" fill="#00D9A3" stroke="white" strokeWidth="2" />
            <circle cx="150" cy="380" r="6" fill="#00D9A3" stroke="white" strokeWidth="2" />
            <circle cx="150" cy="320" r="6" fill="#00D9A3" stroke="white" strokeWidth="2" />
            <circle cx="150" cy="280" r="6" fill="#00D9A3" stroke="white" strokeWidth="2" />
            <circle cx="150" cy="220" r="6" fill="#00D9A3" stroke="white" strokeWidth="2" />
            <circle cx="150" cy="180" r="6" fill="#00D9A3" stroke="white" strokeWidth="2" />
            <circle cx="150" cy="120" r="6" fill="#00D9A3" stroke="white" strokeWidth="2" />
            <circle cx="150" cy="80" r="6" fill="#00D9A3" stroke="white" strokeWidth="2" />
          </svg>
        </div>

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
          <Link href="/timeline">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-black/50 text-white">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-white">Project Alpha - New Office Tower</h1>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-black/50 text-white">
            <Maximize2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-[#2a2a2a] px-6 py-6">
        <div className="mb-6 space-y-4">
          {/* Capture Frequency */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-white">Capture Frequency</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-xs text-white">Time-Based (3s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full border border-white" />
                  <span className="text-xs text-gray-400">Distance-Based (2m)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                <Slider defaultValue={[50]} max={100} step={1} className="w-20" />
              </div>
            </div>
          </div>

          {/* Status Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-gray-400">GPS: High Accuracy</p>
              <p className="text-gray-400">IMU Tracking</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400">COMPASS: N 45° E</p>
              <p className="text-gray-400">BATTERY: 85%</p>
            </div>
          </div>
        </div>

        {/* Capture Button */}
        <Button
          size="lg"
          className="h-24 w-24 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 mx-auto flex flex-col items-center justify-center gap-1"
          onClick={() => setIsCapturing(!isCapturing)}
        >
          <Camera className="h-8 w-8" />
          <span className="text-xs font-bold">{isCapturing ? "STOP CAPTURE" : "START CAPTURE"}</span>
        </Button>
      </div>
    </div>
  )
}
