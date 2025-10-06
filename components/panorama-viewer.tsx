"use client"

import { useState } from "react"
import { ChevronLeft, Plus, AlertCircle, Info, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import Link from "next/link"

export function PanoramaViewer() {
  const [timelineValue, setTimelineValue] = useState([50])

  return (
    <div className="relative flex min-h-screen flex-col bg-black">
      {/* Panorama View */}
      <div className="relative flex-1">
        <img
          src="/construction-interior-wide.jpg"
          alt="Construction site panorama"
          className="h-full w-full object-cover"
        />

        {/* Annotation Markers */}
        <div className="absolute top-1/4 right-1/3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive shadow-lg">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div className="absolute top-12 right-0 w-48 rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground shadow-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Issue: Wall not to spec. Check plans</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-1/2 left-1/4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 shadow-lg">
            <Info className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="absolute bottom-1/3 left-1/2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 shadow-lg">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
          <Link href="/timeline">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-black/50 text-white">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-base font-semibold text-white">Project Alpha - New Office Tower</h1>
          <Link href="/reports/new">
            <Button variant="ghost" size="sm" className="rounded-full bg-black/50 text-white">
              Compare
            </Button>
          </Link>
        </div>

        {/* Minimap */}
        <div className="absolute bottom-24 left-6">
          <div className="h-32 w-32 rounded-full border-4 border-white bg-black/70 p-2">
            <svg className="h-full w-full" viewBox="0 0 100 100">
              {/* Floor plan simplified */}
              <rect x="10" y="10" width="80" height="80" fill="none" stroke="white" strokeWidth="1" opacity="0.6" />
              <line x1="10" y1="50" x2="90" y2="50" stroke="white" strokeWidth="1" opacity="0.6" />
              <line x1="50" y1="10" x2="50" y2="90" stroke="white" strokeWidth="1" opacity="0.6" />

              {/* Current position */}
              <circle cx="50" cy="50" r="4" fill="#00D9A3" />
            </svg>
          </div>
        </div>

        {/* Add Annotation Button */}
        <div className="absolute bottom-24 right-6">
          <Button size="icon" className="h-16 w-16 rounded-full bg-white text-black shadow-lg hover:bg-white/90">
            <Plus className="h-8 w-8" />
          </Button>
        </div>
      </div>

      {/* Timeline Control */}
      <div className="bg-[#2a2a2a] px-6 py-4">
        <div className="mb-2 flex items-center justify-between text-xs text-white">
          <span className="font-medium">TIMELINE</span>
        </div>
        <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
          <span>Nov 15, 2023</span>
          <span>Dec 15, 2023</span>
          <span>Dec 15, 2023</span>
          <span>Loda 10, 24</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Slider value={timelineValue} onValueChange={setTimelineValue} max={100} step={1} className="flex-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-xs text-white">Nov 15, 2023</span>
        </div>
      </div>
    </div>
  )
}
