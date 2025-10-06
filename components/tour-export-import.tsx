"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Download, Upload, FileJson, Share2, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { tourDB } from "@/lib/db"
import type { VirtualTour } from "@/lib/types"

interface TourExportImportProps {
  tour?: VirtualTour
  onImportComplete?: (tour: VirtualTour) => void
}

export function TourExportImport({ tour, onImportComplete }: TourExportImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle")
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")

  const handleExport = async () => {
    if (!tour) return

    setIsExporting(true)
    setExportStatus("idle")

    try {
      // Create export data
      const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        tour: {
          ...tour,
          // Convert blob URLs to base64 for portability
          capturePoints: await Promise.all(
            tour.capturePoints.map(async (point) => {
              try {
                const response = await fetch(point.imageUrl)
                const blob = await response.blob()
                const base64 = await blobToBase64(blob)
                return {
                  ...point,
                  imageUrl: base64,
                }
              } catch (error) {
                console.error("[v0] Error converting image:", error)
                return point
              }
            }),
          ),
        },
      }

      // Convert to JSON
      const jsonString = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonString], { type: "application/json" })

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `tour-${tour.projectName.replace(/\s+/g, "-")}-${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setExportStatus("success")
      setStatusMessage("Tour exported successfully!")
      console.log("[v0] Tour exported:", tour.id)
    } catch (error) {
      console.error("[v0] Export error:", error)
      setExportStatus("error")
      setStatusMessage("Failed to export tour. Please try again.")
    } finally {
      setIsExporting(false)
      setTimeout(() => setExportStatus("idle"), 3000)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportStatus("idle")

    try {
      const text = await file.text()
      const importData = JSON.parse(text)

      // Validate import data
      if (!importData.tour || !importData.version) {
        throw new Error("Invalid tour file format")
      }

      const importedTour: VirtualTour = importData.tour

      // Convert base64 images back to blob URLs
      const processedCapturePoints = await Promise.all(
        importedTour.capturePoints.map(async (point) => {
          try {
            if (point.imageUrl.startsWith("data:")) {
              const blob = await base64ToBlob(point.imageUrl)
              const blobUrl = URL.createObjectURL(blob)
              return {
                ...point,
                imageUrl: blobUrl,
              }
            }
            return point
          } catch (error) {
            console.error("[v0] Error converting image:", error)
            return point
          }
        }),
      )

      // Create new tour with updated ID
      const newTour: VirtualTour = {
        ...importedTour,
        id: `tour-${Date.now()}`,
        capturePoints: processedCapturePoints,
      }

      // Save to IndexedDB
      await tourDB.init()
      await tourDB.saveTour(newTour)

      // Save capture points
      for (const point of newTour.capturePoints) {
        await tourDB.saveCapturePoint({ ...point, tourId: newTour.id })
      }

      setImportStatus("success")
      setStatusMessage(`Tour "${newTour.projectName}" imported successfully!`)
      console.log("[v0] Tour imported:", newTour.id)

      if (onImportComplete) {
        onImportComplete(newTour)
      }
    } catch (error) {
      console.error("[v0] Import error:", error)
      setImportStatus("error")
      setStatusMessage("Failed to import tour. Please check the file format.")
    } finally {
      setIsImporting(false)
      setTimeout(() => setImportStatus("idle"), 3000)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleShare = async () => {
    if (!tour) return

    try {
      // Create shareable data
      const shareData = {
        title: `Construction Tour: ${tour.projectName}`,
        text: `View construction progress from ${new Date(tour.date).toLocaleDateString()}`,
        url: window.location.href,
      }

      if (navigator.share) {
        await navigator.share(shareData)
        console.log("[v0] Tour shared successfully")
      } else {
        // Fallback: copy link to clipboard
        await navigator.clipboard.writeText(window.location.href)
        setStatusMessage("Link copied to clipboard!")
        setTimeout(() => setStatusMessage(""), 3000)
      }
    } catch (error) {
      console.error("[v0] Share error:", error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Export Section */}
      {tour && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Export Tour</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Download tour data as JSON file for backup or sharing
                </p>
              </div>
              <Badge variant="secondary">
                <FileJson className="h-3 w-3 mr-1" />
                JSON
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleExport} disabled={isExporting} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export Tour"}
              </Button>
              <Button onClick={handleShare} variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            {exportStatus === "success" && (
              <Alert className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{statusMessage}</AlertDescription>
              </Alert>
            )}

            {exportStatus === "error" && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{statusMessage}</AlertDescription>
              </Alert>
            )}
          </div>
        </Card>
      )}

      {/* Import Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Import Tour</h3>
            <p className="text-sm text-muted-foreground mt-1">Load a previously exported tour from JSON file</p>
          </div>

          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            variant="outline"
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? "Importing..." : "Import Tour"}
          </Button>

          {importStatus === "success" && (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{statusMessage}</AlertDescription>
            </Alert>
          )}

          {importStatus === "error" && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{statusMessage}</AlertDescription>
            </Alert>
          )}
        </div>
      </Card>

      {/* Storage Info */}
      <Card className="p-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Local Storage</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Tours are automatically saved to your browser's local storage (IndexedDB)</p>
            <p>Export tours regularly to prevent data loss if browser data is cleared</p>
            <p>Imported tours are added to your local collection</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Helper functions
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string): Promise<Blob> {
  return fetch(base64).then((res) => res.blob())
}
