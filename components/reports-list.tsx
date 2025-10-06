"use client"

import { ChevronLeft, Plus, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"

const reports = [
  {
    id: 1,
    title: "Project Aspection - Level 4 Complex",
    progress: 6011.25,
    date: "Bned ded, 2021",
    image: "/residential-construction-site.jpg",
    completed: true,
  },
  {
    id: 2,
    title: "Weekly Inspection - Level 4 Level 4",
    progress: 203.7,
    date: "Broierday, 2023",
    image: "/construction-interior-2.jpg",
    completed: true,
  },
  {
    id: 3,
    title: "MEP Rouh-in Check Creek",
    progress: 202.3,
    date: "Bnexl ded, 2023",
    time: "Datl 105 PM",
    image: "/construction-interior-wide.jpg",
  },
  {
    id: 4,
    title: "MEP Rouh-in Check Complex",
    progress: 23316.1,
    date: "Braxlf al qiet, 2020",
    image: "/construction-interior-3.jpg",
  },
  {
    id: 5,
    title: "Bridge Expansion Complex",
    progress: 2021.1,
    image: "/bridge-expansion-project.jpg",
  },
]

export function ReportsList() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Reports</h1>
        </div>
        <Link href="/reports/new">
          <Button size="icon" className="h-12 w-12 rounded-full bg-primary shadow-lg">
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto px-4 py-6 pb-24">
        <h2 className="mb-4 text-lg font-semibold">Ongoing Projects</h2>

        <div className="space-y-4">
          {reports.map((report) => (
            <Link key={report.id} href={`/reports/${report.id}`}>
              <Card className="overflow-hidden transition-shadow hover:shadow-md">
                <div className="flex gap-4 p-4">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={report.image || "/placeholder.svg"}
                      alt={report.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold leading-tight">{report.title}</h3>
                      {report.completed && <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-xs text-muted-foreground">{report.date}</span>
                        <span className="font-medium">{report.progress}%</span>
                      </div>
                      <Progress value={Math.min(report.progress, 100)} className="h-1.5" />
                    </div>
                    {report.time && <p className="text-xs text-muted-foreground">{report.time}</p>}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>

      <BottomNav currentPage="reports" />
    </div>
  )
}
