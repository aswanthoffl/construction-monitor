"use client"

import { Bell, Search, User, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"

const projects = [
  {
    id: 1,
    title: "Project Alpha - New Office Tower",
    progress: 60,
    lastUpdate: "Yesterday, 3:43 PM",
    image: "/office-building-construction.jpg",
  },
  {
    id: 2,
    title: "Project Beta - Residential Complex",
    progress: 25,
    lastUpdate: "2 Days Ago, 10:10 PM",
    image: "/residential-construction-site.jpg",
  },
  {
    id: 3,
    title: "Project Gamma - Residential Complex",
    progress: 25,
    lastUpdate: "2 Days Ago, 10:10 PM",
    image: "/bridge-construction.jpg",
  },
  {
    id: 4,
    title: "Bridge Expansion",
    progress: 88,
    lastUpdate: "Last Week, 9:00 PM",
    image: "/bridge-expansion-project.jpg",
  },
]

export function ProjectsDashboard() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <div className="h-6 w-6 rounded-full bg-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">BUILD SCAN</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Project Dashboard" className="pl-10 bg-background" />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto px-4 py-6">
        <h2 className="mb-4 text-lg font-semibold">Ongoing Projects</h2>

        <div className="space-y-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="overflow-hidden transition-shadow hover:shadow-md">
                <div className="flex gap-4 p-4">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={project.image || "/placeholder.svg"}
                      alt={project.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold leading-tight">{project.title}</h3>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-1.5" />
                    </div>
                    <p className="text-xs text-muted-foreground">{project.lastUpdate}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6">
        <Link href="/capture">
          <Button size="lg" className="h-32 w-32 rounded-full bg-primary shadow-lg hover:bg-primary/90">
            <div className="flex flex-col items-center gap-2">
              <Camera className="h-10 w-10" />
              <span className="text-sm font-semibold">NEW CAPTURE</span>
            </div>
          </Button>
        </Link>
      </div>

      {/* Bottom Navigation */}
      <BottomNav currentPage="projects" />
    </div>
  )
}
