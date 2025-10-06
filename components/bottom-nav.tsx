import { Camera } from "lucide-react"
import Link from "next/link"

interface BottomNavProps {
  currentPage: "projects" | "timeline" | "capture" | "reports" | "settings"
}

export function BottomNav({ currentPage }: BottomNavProps) {
  return (
    <nav className="border-t border-border bg-card">
      <div className="flex items-center justify-around px-4 py-3">
        <Link href="/" className="flex flex-col items-center gap-1">
          <div className="flex h-6 w-6 items-center justify-center">
            <svg
              className={`h-5 w-5 ${currentPage === "projects" ? "text-primary" : "text-muted-foreground"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
          <span
            className={`text-xs ${currentPage === "projects" ? "font-medium text-primary" : "text-muted-foreground"}`}
          >
            Projects
          </span>
        </Link>

        <Link href="/timeline" className="flex flex-col items-center gap-1">
          <div className="flex h-6 w-6 items-center justify-center">
            <svg
              className={`h-5 w-5 ${currentPage === "timeline" ? "text-primary" : "text-muted-foreground"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span
            className={`text-xs ${currentPage === "timeline" ? "font-medium text-primary" : "text-muted-foreground"}`}
          >
            Timeline
          </span>
        </Link>

        <Link href="/capture" className="flex flex-col items-center gap-1">
          <div className="flex h-6 w-6 items-center justify-center">
            <Camera className={`h-5 w-5 ${currentPage === "capture" ? "text-primary" : "text-primary"}`} />
          </div>
          <span
            className={`text-xs ${currentPage === "capture" ? "font-medium text-primary" : "font-medium text-primary"}`}
          >
            Repelins
          </span>
        </Link>

        <Link href="/reports" className="flex flex-col items-center gap-1">
          <div className="flex h-6 w-6 items-center justify-center">
            <svg
              className={`h-5 w-5 ${currentPage === "reports" ? "text-primary" : "text-muted-foreground"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <span
            className={`text-xs ${currentPage === "reports" ? "font-medium text-primary" : "text-muted-foreground"}`}
          >
            Reports
          </span>
        </Link>

        <Link href="/settings" className="flex flex-col items-center gap-1">
          <div className="flex h-6 w-6 items-center justify-center">
            <svg
              className={`h-5 w-5 ${currentPage === "settings" ? "text-primary" : "text-muted-foreground"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span
            className={`text-xs ${currentPage === "settings" ? "font-medium text-primary" : "text-muted-foreground"}`}
          >
            Settings
          </span>
        </Link>
      </div>
    </nav>
  )
}
