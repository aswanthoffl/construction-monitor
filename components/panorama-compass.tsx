"use client"

import { useEffect, useState } from "react"
import { Navigation2 } from "lucide-react"

interface PanoramaCompassProps {
  yaw: number
  direction: number
}

export function PanoramaCompass({ yaw, direction }: PanoramaCompassProps) {
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    setRotation(yaw + direction)
  }, [yaw, direction])

  const getCardinalDirection = (angle: number) => {
    const normalized = ((angle % 360) + 360) % 360
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    const index = Math.round(normalized / 45) % 8
    return directions[index]
  }

  return (
    <div className="relative w-24 h-24 bg-black/80 rounded-full border-2 border-white/20 flex items-center justify-center">
      {/* Compass Rose */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full" style={{ transform: `rotate(${-rotation}deg)` }}>
          {/* Cardinal directions */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 text-white text-xs font-bold">N</div>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-white/50 text-xs">S</div>
          <div className="absolute right-1 top-1/2 -translate-y-1/2 text-white/50 text-xs">E</div>
          <div className="absolute left-1 top-1/2 -translate-y-1/2 text-white/50 text-xs">W</div>

          {/* Compass needle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Navigation2 className="h-8 w-8 text-primary" style={{ transform: "rotate(-45deg)" }} />
          </div>
        </div>
      </div>

      {/* Current direction indicator */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 px-3 py-1 rounded text-white text-xs font-semibold whitespace-nowrap">
        {getCardinalDirection(rotation)} {Math.round(rotation % 360)}°
      </div>
    </div>
  )
}
