// IndexedDB wrapper for local storage of tours and captures

const DB_NAME = "construction-monitor-db"
const DB_VERSION = 1

export class TourDatabase {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Tours store
        if (!db.objectStoreNames.contains("tours")) {
          const tourStore = db.createObjectStore("tours", { keyPath: "id" })
          tourStore.createIndex("projectId", "projectId", { unique: false })
          tourStore.createIndex("date", "date", { unique: false })
        }

        // Capture points store
        if (!db.objectStoreNames.contains("capturePoints")) {
          const captureStore = db.createObjectStore("capturePoints", { keyPath: "id" })
          captureStore.createIndex("tourId", "tourId", { unique: false })
          captureStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        // Floor plans store
        if (!db.objectStoreNames.contains("floorPlans")) {
          db.createObjectStore("floorPlans", { keyPath: "id" })
        }

        // Annotations store
        if (!db.objectStoreNames.contains("annotations")) {
          const annotationStore = db.createObjectStore("annotations", { keyPath: "id" })
          annotationStore.createIndex("capturePointId", "capturePointId", { unique: false })
        }
      }
    })
  }

  async saveTour(tour: any): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["tours"], "readwrite")
      const store = transaction.objectStore("tours")
      const request = store.put(tour)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getTour(id: string): Promise<any> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["tours"], "readonly")
      const store = transaction.objectStore("tours")
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllTours(): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["tours"], "readonly")
      const store = transaction.objectStore("tours")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteTour(id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["tours"], "readwrite")
      const store = transaction.objectStore("tours")
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async saveCapturePoint(capturePoint: any): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["capturePoints"], "readwrite")
      const store = transaction.objectStore("capturePoints")
      const request = store.put(capturePoint)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getCapturePointsByTour(tourId: string): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["capturePoints"], "readonly")
      const store = transaction.objectStore("capturePoints")
      const index = store.index("tourId")
      const request = index.getAll(tourId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async saveFloorPlan(floorPlan: any): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["floorPlans"], "readwrite")
      const store = transaction.objectStore("floorPlans")
      const request = store.put(floorPlan)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getFloorPlan(id: string): Promise<any> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["floorPlans"], "readonly")
      const store = transaction.objectStore("floorPlans")
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllFloorPlans(): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["floorPlans"], "readonly")
      const store = transaction.objectStore("floorPlans")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getLatestFloorPlan(): Promise<any> {
    const floorPlans = await this.getAllFloorPlans()
    if (floorPlans.length === 0) return null
    return floorPlans[floorPlans.length - 1]
  }
}

export const tourDB = new TourDatabase()
