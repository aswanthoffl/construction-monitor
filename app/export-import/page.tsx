"use client"

import { useState, useEffect } from "react"
import { TourExportImport } from "@/components/tour-export-import"
import { tourDB } from "@/lib/db"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import type { VirtualTour } from "@/lib/types"

export default function ExportImportPage() {
  const [tours, setTours] = useState<VirtualTour[]>([])
  const [selectedTour, setSelectedTour] = useState<VirtualTour | null>(null)

  useEffect(() => {
    const loadTours = async () => {
      try {
        await tourDB.init()
        const allTours = await tourDB.getAllTours()
        setTours(allTours)
        if (allTours.length > 0) {
          setSelectedTour(allTours[0])
        }
      } catch (error) {
        console.error("[v0] Error loading tours:", error)
      }
    }

    loadTours()
  }, [])

  const handleImportComplete = async (tour: VirtualTour) => {
    // Reload tours list
    const allTours = await tourDB.getAllTours()
    setTours(allTours)
    setSelectedTour(tour)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Export & Import</h1>
          <p className="text-muted-foreground mt-2">Backup and share your construction tours</p>
        </div>

        {tours.length > 0 && (
          <Card className="p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Select Tour to Export</label>
              <Select
                value={selectedTour?.id}
                onValueChange={(value) => {
                  const tour = tours.find((t) => t.id === value)
                  setSelectedTour(tour || null)
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
            </div>
          </Card>
        )}

        <TourExportImport tour={selectedTour || undefined} onImportComplete={handleImportComplete} />
      </div>
    </div>
  )
}
