"use client"

import { ChevronLeft, AlertCircle, Info, CheckCircle, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export function ReportGeneration() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <Link href="/reports">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">Report Generation</h1>
        <div className="w-8" />
      </header>

      {/* Project Title */}
      <div className="border-b border-border bg-card px-4 py-2">
        <p className="text-sm text-muted-foreground">Project Alpha - New Office Tower</p>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Panorama Preview */}
        <div className="relative">
          <img src="/construction-interior-wide.jpg" alt="Construction site" className="h-48 w-full object-cover" />

          {/* Annotation Markers */}
          <div className="absolute top-1/4 right-1/3">
            <div className="relative">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive shadow-lg">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          <div className="absolute top-1/2 left-1/4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 shadow-lg">
              <Info className="h-5 w-5 text-white" />
            </div>
          </div>

          <div className="absolute bottom-1/3 left-1/2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 shadow-lg">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          </div>

          <div className="absolute bottom-16 right-4">
            <div className="rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground shadow-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Issue: Wall not to spec. Check plans</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="space-y-6 px-4 py-6">
          {/* Report Title */}
          <div>
            <h3 className="mb-3 font-semibold">Report Title</h3>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
              <Input defaultValue="Weekly Inspection - Dec 20, 2023" className="border-0 p-0 focus-visible:ring-0" />
              <X className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          {/* Author */}
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Author</label>
            <Input placeholder="[lesmmn name" className="bg-card" />
          </div>

          {/* Included Walkwarights */}
          <div>
            <h3 className="mb-3 font-semibold">Included Walkwarights</h3>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-sm">Dec 20, 2023</span>
                </div>
                <Button variant="link" size="sm" className="text-primary">
                  + Add another dates
                </Button>
              </div>
            </Card>
          </div>

          {/* Annotations */}
          <div>
            <h3 className="mb-3 font-semibold">Annotations</h3>
            <Link href="/panorama/1">
              <Card className="p-3 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">2 Issues, 1 Note</p>
                      <p className="text-xs text-muted-foreground">View details</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>
            </Link>
          </div>

          {/* Distribution List */}
          <div>
            <h3 className="mb-3 font-semibold">Distribution List</h3>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>NC</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Nanan Opy Cutair</p>
                    <p className="text-xs text-muted-foreground">Cultlure Etr dde Fea)</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          </div>

          {/* Finalize Button */}
          <Button className="w-full bg-primary py-6 text-base font-semibold">Finalize & Share Report</Button>
        </div>
      </main>
    </div>
  )
}
