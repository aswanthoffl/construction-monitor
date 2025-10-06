// Computes transform from two anchor constraints:
//  - local (0,0) maps to floorStartPx
//  - local forward vector (e.g., along +X) maps to floorForwardPx - floorStartPx
// Local coordinates are in meters (east, north). Floor plan coords are in pixels.

export type Point = { x: number; y: number }

export type SimilarityTransform = {
  scale: number
  rotationRad: number
  tx: number
  ty: number
}

export function estimateSimilarityFromTwoAnchors(params: {
  // local basis (meters): origin and a point on +X axis (e.g., one meter forward)
  localForwardMeters?: number // default 1 meter
  floorStartPx: Point
  floorForwardPx: Point
}): SimilarityTransform {
  const { floorStartPx, floorForwardPx, localForwardMeters = 1 } = params

  // Vector in floor-plan pixels for "forward"
  const vpx = floorForwardPx.x - floorStartPx.x
  const vpy = floorForwardPx.y - floorStartPx.y
  const vplen = Math.hypot(vpx, vpy) || 1

  // Scale: pixels per meter (how big is 1 local meter in floor-plan pixels)
  const scale = vplen / localForwardMeters

  // Rotation: angle that rotates local +X (1,0) to vpx/vpy direction
  const rotationRad = Math.atan2(vpy, vpx) // angle of forward vector in floor-plan

  // Translation: maps local origin (0,0) to floorStartPx after rotation+scale
  // Since local origin is (0,0), tx,ty are simply the start pixel
  const tx = floorStartPx.x
  const ty = floorStartPx.y

  return { scale, rotationRad, tx, ty }
}

export function applySimilarityTransform(p: Point, t: SimilarityTransform): Point {
  // Rotate then scale then translate: p' = R(p)*scale + T
  const cos = Math.cos(t.rotationRad)
  const sin = Math.sin(t.rotationRad)
  const rx = p.x * cos - p.y * sin
  const ry = p.x * sin + p.y * cos
  return { x: rx * t.scale + t.tx, y: ry * t.scale + t.ty }
}

export function transformPath(localPath: Point[], t: SimilarityTransform): Point[] {
  return localPath.map((pt) => applySimilarityTransform(pt, t))
}

export function computePolylineLengths(path: Point[]): { segLen: number[]; total: number } {
  const n = path.length
  if (n <= 1) return { segLen: [], total: 0 }
  const segLen: number[] = new Array(n - 1)
  let total = 0
  for (let i = 0; i < n - 1; i++) {
    const dx = path[i + 1].x - path[i].x
    const dy = path[i + 1].y - path[i].y
    const d = Math.hypot(dx, dy)
    segLen[i] = d
    total += d
  }
  return { segLen, total }
}

export function pointOnPathAt(path: Point[], segLen: number[], s: number): { x: number; y: number; angle: number } {
  const n = path.length
  if (n === 0) return { x: 0, y: 0, angle: 0 }
  if (n === 1) return { x: path[0].x, y: path[0].y, angle: 0 }

  // Clamp distance along path
  let remaining = Math.max(0, s)
  let i = 0
  while (i < segLen.length && remaining > segLen[i]) {
    remaining -= segLen[i]
    i++
  }

  // If s beyond end, return last point and last segment angle
  if (i >= segLen.length || segLen[i] === 0) {
    const aIdx = Math.max(0, n - 2)
    const dx = path[n - 1].x - path[aIdx].x
    const dy = path[n - 1].y - path[aIdx].y
    const angle = Math.atan2(dy, dx)
    return { x: path[n - 1].x, y: path[n - 1].y, angle }
  }

  const p0 = path[i]
  const p1 = path[i + 1]
  const t = remaining / segLen[i] // 0..1
  const x = p0.x + (p1.x - p0.x) * t
  const y = p0.y + (p1.y - p0.y) * t
  const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x)
  return { x, y, angle }
}
