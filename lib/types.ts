// Core type definitions for the construction monitoring system

export interface GPSCoordinate {
  latitude: number
  longitude: number
  altitude?: number
  accuracy: number
  timestamp: number
}

export interface SensorData {
  accelerometer: {
    x: number
    y: number
    z: number
  }
  gyroscope: {
    x: number
    y: number
    z: number
  }
  magnetometer?: {
    x: number
    y: number
    z: number
  }
  orientation: {
    alpha: number // compass heading (0-360)
    beta: number // pitch
    gamma: number // roll
  }
  timestamp: number
}

export interface CapturePoint {
  id: string
  timestamp: number
  gps: GPSCoordinate
  sensors: SensorData
  imageUrl: string
  thumbnailUrl?: string
  floorPlanPosition?: {
    x: number
    y: number
  }
  direction: number // compass heading
}

export interface PathSegment {
  start: CapturePoint
  end: CapturePoint
  distance: number
  duration: number
}

export interface FloorPlan {
  id: string
  name: string
  imageUrl: string
  scale: number // meters per pixel
  origin: GPSCoordinate // GPS coordinate of floor plan origin (top-left)
  rotation: number // rotation angle in degrees
  bounds: {
    width: number
    height: number
  }
}

export interface VirtualTour {
  id: string
  projectId: string
  projectName: string
  date: Date
  capturePoints: CapturePoint[]
  pathSegments: PathSegment[]
  floorPlan?: FloorPlan
  metadata: {
    duration: number
    totalDistance: number
    captureCount: number
    captureMode: "time" | "distance" | "video"
    captureInterval: number
    alignment?: {
      // Floor plan pixel anchors the user picked in the video upload UI
      // startPx = entrance; forwardPx = a pixel indicating the initial walking direction
      startPx?: { x: number; y: number }
      forwardPx?: { x: number; y: number }
      // Cached transform parameters (optional)
      transform?: {
        scale: number
        rotationRad: number
        tx: number
        ty: number
      }
      pathPx?: { x: number; y: number }[]
    }
  }
  status: "capturing" | "processing" | "completed" | "failed"
}

export interface CaptureSettings {
  mode: "time" | "distance"
  interval: number // seconds for time mode, meters for distance mode
  resolution: "low" | "medium" | "high" | "ultra"
  autoCapture: boolean
  gpsEnabled: boolean
  sensorEnabled: boolean
}

export interface Annotation {
  id: string
  capturePointId: string
  type: "issue" | "note" | "checkpoint" | "measurement"
  position: {
    x: number
    y: number
  }
  title: string
  description: string
  severity?: "low" | "medium" | "high" | "critical"
  timestamp: number
  author: string
}

export interface PanoramaHotspot {
  id: string
  capturePointId: string
  pitch: number
  yaw: number
  type: "navigation" | "info" | "label"
  text: string
  targetIndex?: number
  icon?: string
}

export interface ComparisonView {
  tourA: VirtualTour
  tourB: VirtualTour
  mode: "side-by-side" | "overlay" | "slider"
}
