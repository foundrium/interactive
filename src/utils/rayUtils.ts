export type Point = { x: number; y: number }

export const reflectAcrossMirror = (P: Point, origin: Point, angle: number): Point => {
  const dx = P.x - origin.x
  const dy = P.y - origin.y

  // Rotate to align mirror with x-axis
  const x1 = dx * Math.cos(angle) + dy * Math.sin(angle)
  const y1 = -dx * Math.sin(angle) + dy * Math.cos(angle)

  // Reflect across x-axis
  const x2 = x1
  const y2 = -y1

  // Rotate back to original angle
  const rx = x2 * Math.cos(angle) - y2 * Math.sin(angle) + origin.x
  const ry = x2 * Math.sin(angle) + y2 * Math.cos(angle) + origin.y

  return { x: rx, y: ry }
}

export const getIntersection = (A: Point, B: Point, C: Point, D: Point): Point | null => {
  const a1 = B.y - A.y
  const b1 = A.x - B.x
  const c1 = a1 * A.x + b1 * A.y

  const a2 = D.y - C.y
  const b2 = C.x - D.x
  const c2 = a2 * C.x + b2 * C.y

  const det = a1 * b2 - a2 * b1
  if (det === 0) return null // lines are parallel

  const x = (b2 * c1 - b1 * c2) / det
  const y = (a1 * c2 - a2 * c1) / det

  return { x, y }
}

export const calculateReflectionPoint = (
  objectPos: Point,
  viewerPos: Point,
  mirrorPos: Point,
  mirrorAngle: number,
  mirrorWidth: number = 200
): Point | null => {
  const theta = mirrorAngle

  // Get virtual viewer position
  const virtualViewer = reflectAcrossMirror(viewerPos, mirrorPos, theta)

  // Define a second point along the mirror direction to form the mirror line
  const mirrorDir: Point = {
    x: mirrorPos.x + mirrorWidth * Math.cos(theta),
    y: mirrorPos.y + mirrorWidth * Math.sin(theta),
  }

  return getIntersection(objectPos, virtualViewer, mirrorPos, mirrorDir)
} 