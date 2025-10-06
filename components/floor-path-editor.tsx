"use client"

import type React from "react"

import { useMemo, useRef, useState } from "react"

type Point = { x: number; y: number } // normalized [0..1]

export function FloorPathEditor({
  floorPlanImageUrl,
  onComplete,
  onCancel,
  initialPath,
}: {
  floorPlanImageUrl: string
  onComplete: (path: { start: Point; polyline: Point[] }) => void
  onCancel: () => void
  initialPath?: { start: Point; polyline: Point[] } | null
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [start, setStart] = useState<Point | null>(initialPath?.start ?? null)
  const [points, setPoints] = useState<Point[]>(initialPath?.polyline ?? [])
  const [mode, setMode] = useState<"start" | "path">(start ? "path" : "start")

  const pathD = useMemo(() => {
    if (!points.length) return ""
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x * 100} ${p.y * 100}`).join(" ")
  }, [points])

  const clickToPoint = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const p: Point = { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) }
    if (mode === "start") {
      setStart(p)
      setMode("path")
    } else {
      setPoints((prev) => [...prev, p])
    }
  }

  const undo = () => setPoints((p) => p.slice(0, -1))
  const reset = () => {
    setStart(null)
    setPoints([])
    setMode("start")
  }

  const finish = () => {
    if (!start || points.length < 2) return
    onComplete({ start, polyline: points })
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-foreground/80">
        {mode === "start" ? "Click to set Start (entrance)." : "Click to add path points along your walk."}
      </div>
      <div
        ref={containerRef}
        className="relative w-full max-w-[720px] aspect-video rounded-md overflow-hidden ring-1 ring-border cursor-crosshair"
        onClick={clickToPoint}
      >
        <img
          src={floorPlanImageUrl || "/placeholder.svg"}
          alt="Floor plan"
          className="absolute inset-0 h-full w-full object-contain"
        />
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full pointer-events-none">
          {start ? (
            <circle cx={start.x * 100} cy={start.y * 100} r={2} className="fill-green-500 stroke-white" />
          ) : null}
          <path d={pathD} className="stroke-primary fill-none" strokeWidth={0.6} />
          {points.map((p, i) => (
            <circle key={i} cx={p.x * 100} cy={p.y * 100} r={0.9} className="fill-primary" />
          ))}
        </svg>
      </div>
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 rounded-md bg-muted text-foreground" onClick={undo} disabled={!points.length}>
          Undo
        </button>
        <button className="px-3 py-1.5 rounded-md bg-muted text-foreground" onClick={reset}>
          Reset
        </button>
        <div className="flex-1" />
        <button className="px-3 py-1.5 rounded-md bg-background ring-1 ring-border" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground"
          onClick={finish}
          disabled={!start || points.length < 2}
        >
          Save Path
        </button>
      </div>
    </div>
  )
}
