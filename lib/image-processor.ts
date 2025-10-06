export interface ProcessedImage {
  original: string
  thumbnail: string
  width: number
  height: number
}

/**
 * Process captured image for optimal Street View experience
 * Creates thumbnails and optimizes for web viewing
 */
export async function processImageForTour(imageUrl: string): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      // Create thumbnail
      const thumbnailCanvas = document.createElement("canvas")
      const thumbnailSize = 200
      const aspectRatio = img.width / img.height

      if (aspectRatio > 1) {
        thumbnailCanvas.width = thumbnailSize
        thumbnailCanvas.height = thumbnailSize / aspectRatio
      } else {
        thumbnailCanvas.width = thumbnailSize * aspectRatio
        thumbnailCanvas.height = thumbnailSize
      }

      const ctx = thumbnailCanvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Failed to get canvas context"))
        return
      }

      ctx.drawImage(img, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height)
      const thumbnail = thumbnailCanvas.toDataURL("image/jpeg", 0.7)

      resolve({
        original: imageUrl,
        thumbnail,
        width: img.width,
        height: img.height,
      })
    }

    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = imageUrl
  })
}

/**
 * Calculate optimal transition between two capture points
 * Returns interpolation parameters for smooth Street View navigation
 */
export function calculateTransition(
  fromPoint: { gps: { latitude: number; longitude: number }; direction: number },
  toPoint: { gps: { latitude: number; longitude: number }; direction: number },
) {
  // Calculate bearing between points
  const lat1 = (fromPoint.gps.latitude * Math.PI) / 180
  const lat2 = (toPoint.gps.latitude * Math.PI) / 180
  const dLon = ((toPoint.gps.longitude - fromPoint.gps.longitude) * Math.PI) / 180

  const y = Math.sin(dLon) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
  const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360

  // Calculate rotation difference
  const rotationDiff = ((toPoint.direction - fromPoint.direction + 540) % 360) - 180

  return {
    bearing,
    rotationDiff,
    shouldRotate: Math.abs(rotationDiff) > 30, // Only rotate if difference is significant
  }
}

/**
 * Batch process multiple images for tour creation
 */
export async function batchProcessImages(imageUrls: string[]): Promise<ProcessedImage[]> {
  const processed: ProcessedImage[] = []

  for (const url of imageUrls) {
    try {
      const result = await processImageForTour(url)
      processed.push(result)
    } catch (error) {
      console.error("[v0] Error processing image:", error)
      // Use original if processing fails
      processed.push({
        original: url,
        thumbnail: url,
        width: 1920,
        height: 1080,
      })
    }
  }

  return processed
}
