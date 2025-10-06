// Utility functions for panorama processing and management

import type { CapturePoint, PanoramaHotspot } from "./types"

/**
 * Calculate the optimal viewing angle between two capture points
 */
export function calculateViewingAngle(from: CapturePoint, to: CapturePoint): { pitch: number; yaw: number } {
  const dx = to.gps.longitude - from.gps.longitude
  const dy = to.gps.latitude - from.gps.latitude
  const dz = (to.gps.altitude || 0) - (from.gps.altitude || 0)

  // Calculate horizontal angle (yaw)
  let yaw = (Math.atan2(dx, dy) * 180) / Math.PI
  yaw = (yaw + 360) % 360

  // Calculate vertical angle (pitch)
  const horizontalDistance = Math.sqrt(dx * dx + dy * dy)
  const pitch = (Math.atan2(dz, horizontalDistance) * 180) / Math.PI

  return { pitch, yaw }
}

/**
 * Generate navigation hotspots between adjacent capture points
 */
export function generateNavigationHotspots(capturePoints: CapturePoint[], currentIndex: number): PanoramaHotspot[] {
  const hotspots: PanoramaHotspot[] = []
  const currentPoint = capturePoints[currentIndex]

  // Previous point hotspot
  if (currentIndex > 0) {
    const prevPoint = capturePoints[currentIndex - 1]
    const angle = calculateViewingAngle(currentPoint, prevPoint)
    hotspots.push({
      id: `nav-prev-${currentIndex}`,
      capturePointId: currentPoint.id,
      pitch: angle.pitch,
      yaw: angle.yaw + 180, // Look backwards
      type: "navigation",
      text: "← Previous",
      targetIndex: currentIndex - 1,
    })
  }

  // Next point hotspot
  if (currentIndex < capturePoints.length - 1) {
    const nextPoint = capturePoints[currentIndex + 1]
    const angle = calculateViewingAngle(currentPoint, nextPoint)
    hotspots.push({
      id: `nav-next-${currentIndex}`,
      capturePointId: currentPoint.id,
      pitch: angle.pitch,
      yaw: angle.yaw,
      type: "navigation",
      text: "Next →",
      targetIndex: currentIndex + 1,
    })
  }

  return hotspots
}

/**
 * Calculate distance between two capture points in meters
 */
export function calculateDistance(point1: CapturePoint, point2: CapturePoint): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (point1.gps.latitude * Math.PI) / 180
  const φ2 = (point2.gps.latitude * Math.PI) / 180
  const Δφ = ((point2.gps.latitude - point1.gps.latitude) * Math.PI) / 180
  const Δλ = ((point2.gps.longitude - point1.gps.longitude) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Find nearest capture points within a radius
 */
export function findNearbyPoints(
  currentPoint: CapturePoint,
  allPoints: CapturePoint[],
  radiusMeters = 10,
): CapturePoint[] {
  return allPoints
    .filter((point) => point.id !== currentPoint.id)
    .map((point) => ({
      point,
      distance: calculateDistance(currentPoint, point),
    }))
    .filter(({ distance }) => distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance)
    .map(({ point }) => point)
}

/**
 * Generate smart navigation hotspots including nearby points
 */
export function generateSmartHotspots(
  capturePoints: CapturePoint[],
  currentIndex: number,
  customLabels: PanoramaHotspot[] = [],
): PanoramaHotspot[] {
  const hotspots: PanoramaHotspot[] = []
  const currentPoint = capturePoints[currentIndex]

  // Add sequential navigation
  const navHotspots = generateNavigationHotspots(capturePoints, currentIndex)
  hotspots.push(...navHotspots)

  // Add nearby points (for rooms/areas with multiple entry points)
  const nearbyPoints = findNearbyPoints(currentPoint, capturePoints, 5)
  nearbyPoints.forEach((nearbyPoint, idx) => {
    const pointIndex = capturePoints.findIndex((p) => p.id === nearbyPoint.id)
    if (pointIndex !== -1 && pointIndex !== currentIndex - 1 && pointIndex !== currentIndex + 1) {
      const angle = calculateViewingAngle(currentPoint, nearbyPoint)
      hotspots.push({
        id: `nearby-${idx}-${currentIndex}`,
        capturePointId: currentPoint.id,
        pitch: angle.pitch,
        yaw: angle.yaw,
        type: "navigation",
        text: `Point ${pointIndex + 1}`,
        targetIndex: pointIndex,
      })
    }
  })

  // Add custom labels
  hotspots.push(...customLabels.filter((label) => label.capturePointId === currentPoint.id))

  return hotspots
}

/**
 * Convert equirectangular image to cubemap faces for better performance
 */
export function convertToCubemap(imageUrl: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }

      // This is a simplified version - full cubemap conversion is complex
      // In production, you'd use a library or server-side processing
      const faceSize = Math.min(img.width / 4, img.height / 3)
      canvas.width = faceSize
      canvas.height = faceSize

      const faces = ["px", "nx", "py", "ny", "pz", "nz"]
      const faceUrls: string[] = []

      faces.forEach((face, index) => {
        // Extract face from equirectangular image
        // This is a placeholder - actual implementation would be more complex
        ctx.drawImage(img, 0, 0, faceSize, faceSize)
        faceUrls.push(canvas.toDataURL())
      })

      resolve(faceUrls)
    }
    img.onerror = reject
    img.src = imageUrl
  })
}

/**
 * Optimize panorama image for web viewing
 */
export async function optimizePanorama(imageUrl: string, maxWidth = 4096): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      if (img.width <= maxWidth) {
        resolve(imageUrl)
        return
      }

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }

      const scale = maxWidth / img.width
      canvas.width = maxWidth
      canvas.height = img.height * scale

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL("image/jpeg", 0.85))
    }
    img.onerror = reject
    img.src = imageUrl
  })
}

/**
 * Calculate field of view based on zoom level
 */
export function calculateFOV(zoomLevel: number): number {
  // Map zoom level (50-120) to FOV (30-120 degrees)
  return Math.max(30, Math.min(120, zoomLevel))
}

/**
 * Smooth transition between two viewing angles
 */
export function interpolateViewAngle(
  from: { pitch: number; yaw: number },
  to: { pitch: number; yaw: number },
  progress: number,
): { pitch: number; yaw: number } {
  // Handle yaw wrapping (0-360)
  let yawDiff = to.yaw - from.yaw
  if (yawDiff > 180) yawDiff -= 360
  if (yawDiff < -180) yawDiff += 360

  return {
    pitch: from.pitch + (to.pitch - from.pitch) * progress,
    yaw: (from.yaw + yawDiff * progress + 360) % 360,
  }
}

/**
 * Export tour data with panorama metadata
 */
export function exportPanoramaTour(tour: any, hotspots: PanoramaHotspot[]): string {
  const exportData = {
    version: "1.0",
    tour: {
      ...tour,
      panoramaHotspots: hotspots,
    },
    exportDate: new Date().toISOString(),
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Import tour data with panorama metadata
 */
export function importPanoramaTour(jsonData: string): { tour: any; hotspots: PanoramaHotspot[] } {
  const data = JSON.parse(jsonData)

  return {
    tour: data.tour,
    hotspots: data.tour.panoramaHotspots || [],
  }
}
