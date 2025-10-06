"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Camera, Map, GitCompare, Upload, Home, Menu, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/capture", label: "Capture", icon: Camera },
    { href: "/floor-plan", label: "Floor Plan", icon: Map },
    { href: "/comparison", label: "Compare", icon: GitCompare },
    { href: "/export-import", label: "Export/Import", icon: Upload },
    { href: "/video-upload", label: "Video Upload", icon: Video },
  ]

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-card border-b">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Camera className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">Construction Monitor</span>
            </div>

            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={cn("gap-2", isActive && "bg-primary text-primary-foreground")}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Camera className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-base font-bold text-foreground">Construction Monitor</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {mobileMenuOpen && (
            <div className="mt-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={cn("w-full justify-start gap-2", isActive && "bg-primary text-primary-foreground")}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Spacer for fixed navigation */}
      <div className="h-[57px] md:h-[61px]" />
    </>
  )
}
