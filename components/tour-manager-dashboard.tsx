"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  MapPin,
  Camera,
  Trash2,
  Eye,
  Download,
  Upload,
  Plus,
  Search,
  Filter,
  MoreVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { tourDB } from "@/lib/db"
import type { VirtualTour } from "@/lib/types"
import Link from "next/link"

export function TourManagerDashboard() {
  const [tours, setTours] = useState<VirtualTour[]>([])
  const [filteredTours, setFilteredTours] = useState<VirtualTour[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "processing" | "capturing">("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTours()
  }, [])

  useEffect(() => {
    filterTours()
  }, [tours, searchQuery, filterStatus])

  const loadTours = async () => {
    try {
      await tourDB.init()
      const allTours = await tourDB.getAllTours()
      setTours(allTours.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    } catch (error) {
      console.error("[v0] Error loading tours:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterTours = () => {
    let filtered = tours

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((tour) => tour.status === filterStatus)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (tour) =>
          tour.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tour.projectId.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredTours(filtered)
  }

  const handleDelete = async (tourId: string) => {
    if (!confirm("Are you sure you want to delete this tour? This action cannot be undone.")) {
      return
    }

    try {
      await tourDB.deleteTour(tourId)
      setTours(tours.filter((t) => t.id !== tourId))
      console.log("[v0] Tour deleted:", tourId)
    } catch (error) {
      console.error("[v0] Error deleting tour:", error)
      alert("Failed to delete tour")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "processing":
        return "bg-yellow-500"
      case "capturing":
        return "bg-blue-500"
      case "failed":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTotalStats = () => {
    return {
      total: tours.length,
      completed: tours.filter((t) => t.status === "completed").length,
      processing: tours.filter((t) => t.status === "processing").length,
      capturing: tours.filter((t) => t.status === "capturing").length,
      totalCaptures: tours.reduce((sum, t) => sum + t.capturePoints.length, 0),
      totalDistance: tours.reduce((sum, t) => sum + (t.metadata?.totalDistance || 0), 0),
    }
  }

  const stats = getTotalStats()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading tours...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Tour Manager</h1>
              <p className="text-muted-foreground mt-1">Manage and organize your construction site tours</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/export-import">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Link>
              </Button>
              <Button asChild>
                <Link href="/capture">
                  <Plus className="h-4 w-4 mr-2" />
                  New Capture
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tours</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Eye className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Captures</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalCaptures}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Camera className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Distance</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalDistance.toFixed(0)}m</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tours by project name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter: {filterStatus === "all" ? "All" : filterStatus}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterStatus("all")}>All Tours</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("completed")}>Completed</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("processing")}>Processing</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("capturing")}>Capturing</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tours Grid */}
        {filteredTours.length === 0 ? (
          <Card className="p-12">
            <div className="text-center text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No tours found</p>
              <p className="text-sm mt-1">
                {searchQuery || filterStatus !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start by creating a new capture"}
              </p>
              {!searchQuery && filterStatus === "all" && (
                <Button className="mt-4" asChild>
                  <Link href="/capture">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Tour
                  </Link>
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTours.map((tour) => (
              <Card key={tour.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Thumbnail */}
                <div className="relative h-48 bg-muted">
                  {tour.capturePoints[0]?.imageUrl ? (
                    <img
                      src={tour.capturePoints[0].imageUrl || "/placeholder.svg"}
                      alt={tour.projectName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="h-12 w-12 text-muted-foreground opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className={getStatusColor(tour.status)}>{tour.status}</Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg line-clamp-1">{tour.projectName}</h3>
                    <p className="text-sm text-muted-foreground">{tour.projectId}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(tour.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Camera className="h-3 w-3" />
                      {tour.capturePoints.length} points
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {tour.metadata?.totalDistance?.toFixed(0) || 0}m
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{Math.round((tour.metadata?.duration || 0) / 60)}min</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button size="sm" className="flex-1" asChild>
                      <Link href={`/panorama/${tour.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        360° View
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/tour/${tour.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Standard View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/export-import?tour=${tour.id}`}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(tour.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
