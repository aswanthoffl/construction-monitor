// Geospatial utility functions

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

export function gpsToFloorPlanCoordinates(
  gps: { latitude: number; longitude: number },
  floorPlan: {
    origin: { latitude: number; longitude: number }
    scale: number
    rotation: number
  },
): { x: number; y: number } {
  // Calculate offset from floor plan origin
  const dx = calculateDistance(
    floorPlan.origin.latitude,
    floorPlan.origin.longitude,
    floorPlan.origin.latitude,
    gps.longitude,
  )
  const dy = calculateDistance(
    floorPlan.origin.latitude,
    floorPlan.origin.longitude,
    gps.latitude,
    floorPlan.origin.longitude,
  )

  // Adjust for longitude sign
  const x = gps.longitude > floorPlan.origin.longitude ? dx : -dx
  const y = gps.latitude < floorPlan.origin.latitude ? dy : -dy

  // Convert meters to pixels
  const pixelX = x / floorPlan.scale
  const pixelY = y / floorPlan.scale

  // Apply rotation if needed
  if (floorPlan.rotation !== 0) {
    const angle = (floorPlan.rotation * Math.PI) / 180
    const rotatedX = pixelX * Math.cos(angle) - pixelY * Math.sin(angle)
    const rotatedY = pixelX * Math.sin(angle) + pixelY * Math.cos(angle)
    return { x: rotatedX, y: rotatedY }
  }

  return { x: pixelX, y: pixelY }
}

export function normalizeHeading(heading: number): number {
  // Normalize heading to 0-360 range
  let normalized = heading % 360
  if (normalized < 0) normalized += 360
  return normalized
}

export function getCardinalDirection(heading: number): string {
  const normalized = normalizeHeading(heading)
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  const index = Math.round(normalized / 45) % 8
  return directions[index]
}

export function smoothPath(points: Array<{ x: number; y: number }>, tension = 0.5): Array<{ x: number; y: number }> {
  if (points.length < 3) return points

  const smoothed: Array<{ x: number; y: number }> = []

  for (let i = 0; i < points.length; i++) {
    if (i === 0 || i === points.length - 1) {
      smoothed.push(points[i])
      continue
    }

    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]

    const smoothX = curr.x + tension * (prev.x + next.x - 2 * curr.x)
    const smoothY = curr.y + tension * (prev.y + next.y - 2 * curr.y)

    smoothed.push({ x: smoothX, y: smoothY })
  }

  return smoothed
}
