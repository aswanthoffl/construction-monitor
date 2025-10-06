// Sensor data collection and management

import type { SensorData, GPSCoordinate } from "./types"

export class SensorManager {
  private gpsWatchId: number | null = null
  private orientationListener: ((event: DeviceOrientationEvent) => void) | null = null
  private motionListener: ((event: DeviceMotionEvent) => void) | null = null

  private currentGPS: GPSCoordinate | null = null
  private currentSensors: Partial<SensorData> = {}

  async requestPermissions(): Promise<boolean> {
    try {
      // Request device orientation permission (iOS 13+)
      if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
        const permission = await (DeviceOrientationEvent as any).requestPermission()
        if (permission !== "granted") {
          console.error("[v0] Device orientation permission denied")
          return false
        }
      }

      // Request device motion permission (iOS 13+)
      if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
        const permission = await (DeviceMotionEvent as any).requestPermission()
        if (permission !== "granted") {
          console.error("[v0] Device motion permission denied")
          return false
        }
      }

      return true
    } catch (error) {
      console.error("[v0] Error requesting sensor permissions:", error)
      return false
    }
  }

  startGPSTracking(callback: (gps: GPSCoordinate) => void): void {
    if (!navigator.geolocation) {
      console.error("[v0] Geolocation not supported")
      return
    }

    this.gpsWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const gps: GPSCoordinate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude || undefined,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        }
        this.currentGPS = gps
        callback(gps)
      },
      (error) => {
        console.error("[v0] GPS error:", error)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      },
    )
  }

  stopGPSTracking(): void {
    if (this.gpsWatchId !== null) {
      navigator.geolocation.clearWatch(this.gpsWatchId)
      this.gpsWatchId = null
    }
  }

  startSensorTracking(callback: (sensors: SensorData) => void): void {
    // Device orientation (compass, pitch, roll)
    this.orientationListener = (event: DeviceOrientationEvent) => {
      this.currentSensors.orientation = {
        alpha: event.alpha || 0,
        beta: event.beta || 0,
        gamma: event.gamma || 0,
      }
      this.emitSensorData(callback)
    }
    window.addEventListener("deviceorientation", this.orientationListener)

    // Device motion (accelerometer, gyroscope)
    this.motionListener = (event: DeviceMotionEvent) => {
      if (event.acceleration) {
        this.currentSensors.accelerometer = {
          x: event.acceleration.x || 0,
          y: event.acceleration.y || 0,
          z: event.acceleration.z || 0,
        }
      }
      if (event.rotationRate) {
        this.currentSensors.gyroscope = {
          x: event.rotationRate.alpha || 0,
          y: event.rotationRate.beta || 0,
          z: event.rotationRate.gamma || 0,
        }
      }
      this.emitSensorData(callback)
    }
    window.addEventListener("devicemotion", this.motionListener)
  }

  private emitSensorData(callback: (sensors: SensorData) => void): void {
    if (this.currentSensors.orientation && this.currentSensors.accelerometer && this.currentSensors.gyroscope) {
      callback({
        orientation: this.currentSensors.orientation,
        accelerometer: this.currentSensors.accelerometer,
        gyroscope: this.currentSensors.gyroscope,
        timestamp: Date.now(),
      })
    }
  }

  stopSensorTracking(): void {
    if (this.orientationListener) {
      window.removeEventListener("deviceorientation", this.orientationListener)
      this.orientationListener = null
    }
    if (this.motionListener) {
      window.removeEventListener("devicemotion", this.motionListener)
      this.motionListener = null
    }
  }

  getCurrentGPS(): GPSCoordinate | null {
    return this.currentGPS
  }

  getCurrentSensors(): Partial<SensorData> {
    return this.currentSensors
  }

  stopAll(): void {
    this.stopGPSTracking()
    this.stopSensorTracking()
  }
}
