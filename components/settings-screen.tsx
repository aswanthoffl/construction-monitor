"use client"

import { ChevronLeft, ChevronRight, User, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"

export function SettingsScreen() {
  return (
    <div className="flex min-h-screen flex-col bg-[#3a3a3a]">
      {/* Header */}
      <header className="flex items-center justify-between bg-[#4a4a4a] px-4 py-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-white">Settings</h1>
        <div className="w-8" />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto px-4 py-6 pb-24">
        <div className="space-y-4">
          {/* Account & Profile */}
          <Card className="overflow-hidden">
            <div className="p-4">
              <h3 className="mb-4 font-semibold">Account & Profile</h3>

              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                  <User className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium">John Smith</p>
                  <p className="text-sm text-muted-foreground">john.smith@projectalpha.com</p>
                </div>
              </div>

              <Link href="/settings/password">
                <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-accent">
                  <span className="text-sm">Change Password</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                    <ChevronRight className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              </Link>
            </div>
          </Card>

          {/* App Preferences */}
          <Card className="overflow-hidden">
            <div className="p-4">
              <h3 className="mb-4 font-semibold">App Preferences</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary">
                      <div className="h-4 w-4 rounded-full" />
                    </div>
                    <span className="text-sm">Offline Mode Sync</span>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-primary" />
                    <span className="text-sm">High-Resolution Capture</span>
                  </div>
                  <Switch />
                </div>

                <div className="rounded-lg border border-border px-4 py-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm">Capture Frequency (Time/Distance)</span>
                  </div>
                  <Button className="w-full bg-primary text-primary-foreground">Connect Account</Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Integrations */}
          <Card className="overflow-hidden">
            <div className="p-4">
              <h3 className="mb-4 font-semibold">Integrations</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-[#0696d7]">
                      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 2L3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6l-3-4H6z" />
                      </svg>
                    </div>
                    <span className="text-sm">Autossk Construction Cloud</span>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-[#ff6900]">
                      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                      </svg>
                    </div>
                    <span className="text-sm">Procore</span>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-[#0696d7]">
                      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                      </svg>
                    </div>
                    <span className="text-sm">Revit</span>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </Card>

          {/* About & Support */}
          <Card className="overflow-hidden">
            <div className="p-4">
              <h3 className="mb-4 font-semibold">About & Support</h3>

              <div className="space-y-3">
                <Link href="/help">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Help Center</span>
                  </div>
                </Link>

                <Link href="/privacy">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Privacy Policy</span>
                  </div>
                </Link>

                <Link href="/terms">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Terms of Service</span>
                  </div>
                </Link>

                <div className="mt-4 text-center text-xs text-muted-foreground">Software Version 1.2.5</div>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <BottomNav currentPage="settings" />
    </div>
  )
}
