"use client"

import { useEffect, useState } from "react"
import { AdvancedPanoramaViewer } from "@/components/advanced-panorama-viewer"
import { tourDB } from "@/lib/db"
import type { VirtualTour } from "@/lib/types"
import { Loader2 } from "lucide-react"

export default function PanoramaPage({ params }: { params: { id: string } }) {
  const [tour, setTour] = useState<VirtualTour | null>(null)
  const [floorPlan, setFloorPlan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTour = async () => {
      try {
        await tourDB.init()
        const loadedTour = await tourDB.getTour(params.id)

        if (loadedTour) {
          setTour(loadedTour)
          if (loadedTour.floorPlan) {
            setFloorPlan(loadedTour.floorPlan)
          }
        }
      } catch (error) {
        console.error("[v0] Error loading tour:", error)
      } finally {
        setLoading(false)
      }
    }

    loadTour()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-white">Loading 360° tour...</p>
        </div>
      </div>
    )
  }

  if (!tour) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-white text-xl">Tour not found</p>
          <a href="/tour-manager" className="text-primary hover:underline mt-4 inline-block">
            Back to Tour Manager
          </a>
        </div>
      </div>
    )
  }

  return <AdvancedPanoramaViewer tour={tour} floorPlan={floorPlan} onSave={(updatedTour) => setTour(updatedTour)} />
}
