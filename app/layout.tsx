import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Construction Monitor App",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <head>
        <title>Construction Monitor App</title>  {/* Your custom title here */}
      </head>
      <body>
        <Suspense fallback={<div>Loading...</div>}>
          <Navigation />
          {children}
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
