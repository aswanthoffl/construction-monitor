"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { VirtualTourViewer } from "@/components/virtual-tour-viewer"
import { tourDB } from "@/lib/db"
import type { VirtualTour, FloorPlan } from "@/lib/types"

export default function TourViewPage() {
  const params = useParams()
  const [tour, setTour] = useState<VirtualTour | null>(null)
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTour = async () => {
      try {
        await tourDB.init()
        const tourData = await tourDB.getTour(params.id as string)

        if (tourData) {
          setTour(tourData)

          // Load floor plan if available
          if (tourData.floorPlan?.id) {
            const floorPlanData = await tourDB.getFloorPlan(tourData.floorPlan.id)
            setFloorPlan(floorPlanData)
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
        <div className="text-white text-lg">Loading tour...</div>
      </div>
    )
  }

  if (!tour) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-white text-lg">Tour not found</div>
      </div>
    )
  }

  return <VirtualTourViewer tour={tour} floorPlan={floorPlan || undefined} />
}
