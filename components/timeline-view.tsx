"use client"

import { ChevronLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"

const capturePoints = [
  { date: "Nov 15, 2023", image: "/construction-interior-1.jpg" },
  { date: "Dec 15, 2023", image: "/construction-interior-2.jpg" },
  { date: "Nov 20, 2023", image: "/construction-interior-3.jpg" },
]

const walkthroughs = [
  {
    id: 1,
    title: "Latest Walkthrough",
    syncTime: "Synced 5 minutes ago",
    duration: "25 minutes (1,245 panoramas)",
    image: "/construction-interior-1.jpg",
  },
  {
    id: 2,
    title: "Weekly Inspection",
    syncTime: "Synced Dec 15, 2023",
    duration: "28 minutes (1,302 panoramas)",
    image: "/construction-interior-2.jpg",
    highlighted: true,
  },
  {
    id: 3,
    title: "Foundation Check",
    syncTime: "Synced Dec 15, 2023",
    duration: "12 minutes (1,580 panoramas)",
    image: "/construction-interior-3.jpg",
  },
]

export function TimelineView() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-5 w-5 text-primary" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Timeline</h1>
        </div>
      </header>

      {/* Project Title */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <h2 className="text-base font-medium">Project Alpha - New Office Tower</h2>
        <Link href="/capture">
          <Button variant="ghost" size="sm" className="text-sm text-muted-foreground">
            New Capture
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Timeline Captures */}
        <div className="px-4 py-6">
          <div className="flex items-start justify-between gap-4">
            {capturePoints.map((point, index) => (
              <div key={index} className="flex flex-col items-center">
                <Card className="mb-3 h-20 w-20 overflow-hidden">
                  <img
                    src={point.image || "/placeholder.svg"}
                    alt={point.date}
                    className="h-full w-full object-cover"
                  />
                </Card>
                <p className="text-xs font-medium">{point.date}</p>
              </div>
            ))}
          </div>

          {/* Timeline Connector */}
          <div className="relative mt-4 mb-8">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-border" />
            <div className="relative flex items-center justify-between px-10">
              <div className="h-3 w-3 rounded-full border-2 border-primary bg-primary" />
              <div className="h-3 w-3 rounded-full border-2 border-primary bg-primary" />
              <div className="absolute right-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-primary bg-card">
                <div className="h-6 w-6 rounded-full bg-primary" />
              </div>
            </div>
            <div className="absolute right-10 top-1/2 h-0.5 w-20 -translate-y-1/2 border-t-2 border-dashed border-border" />
          </div>
        </div>

        {/* All Captured Walkthroughs */}
        <div className="px-4 pb-24">
          <h3 className="mb-4 text-lg font-semibold">All Captured Walkthroughs</h3>

          <div className="space-y-3">
            {walkthroughs.map((walkthrough) => (
              <Link key={walkthrough.id} href={`/panorama/${walkthrough.id}`}>
                <Card
                  className={`overflow-hidden transition-all ${
                    walkthrough.highlighted ? "border-2 border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex gap-3 p-3">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={walkthrough.image || "/placeholder.svg"}
                        alt={walkthrough.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold">{walkthrough.title}</h4>
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">{walkthrough.syncTime}</p>
                        <p className="text-xs text-muted-foreground">{walkthrough.duration}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <BottomNav currentPage="timeline" />
    </div>
  )
}
