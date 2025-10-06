"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { AlertCircle, Upload, Map } from "lucide-react"
import { tourDB } from "@/lib/db"
import type { FloorPlan } from "@/lib/types"
import { VideoUpload } from "@/components/video-upload"

export default function VideoUploadPage() {
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFloorPlan = async () => {
      try {
        await tourDB.init()
        const latestFloorPlan = await tourDB.getLatestFloorPlan()
        setFloorPlan(latestFloorPlan)
      } catch (error) {
        console.error("[v0] Error loading floor plan:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFloorPlan()
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!floorPlan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="max-w-md p-8 text-center space-y-6">
          <div className="mx-auto rounded-full bg-orange-500/10 p-6 w-fit">
            <AlertCircle className="h-12 w-12 text-orange-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Floor Plan Required</h1>
            <p className="text-muted-foreground">
              Before processing a video, please upload a 2D floor plan and configure GPS mapping. This aligns extracted
              frames to your site plan.
            </p>
          </div>
          <div className="space-y-3">
            <Button asChild size="lg" className="w-full">
              <Link href="/floor-plan">
                <Upload className="mr-2 h-5 w-5" />
                Upload Floor Plan
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full bg-transparent">
              <Link href="/">
                <Map className="mr-2 h-5 w-5" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <div className="pt-4 border-t text-left space-y-2">
            <p className="text-sm font-semibold text-foreground">What you'll need:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>2D floor plan image (PNG, JPG, or PDF)</li>
              <li>Physical scale (meters per pixel)</li>
              <li>GPS coordinates at the origin point</li>
              <li>Rotation alignment with true north</li>
            </ul>
          </div>
        </Card>
      </div>
    )
  }

  return <VideoUpload floorPlan={floorPlan} />
}
