import type { IWorld, System } from 'bitecs'
import { Position, Velocity, Mirror, Size, Angle } from './components'
import { defineQuery } from 'bitecs'
import { calculateReflectionPoint, reflectAcrossMirror } from './utils/rayUtils'
import { getColor } from './scene'

// Create queries for entities with specific components
const mirrorQuery = defineQuery([Mirror])
const objectQuery = defineQuery([Position, Size])

// Movement system that updates position based on velocity
export const createMovementSystem = (deltaTime: number): System => {
  return (world: IWorld): IWorld => {
    const entities = mirrorQuery(world)
    for (const entity of entities) {
      Position.x[entity] += Velocity.x[entity] * deltaTime
      Position.y[entity] += Velocity.y[entity] * deltaTime
    }
    return world
  }
}

// System to handle mirror bouncing at screen boundaries
export const createBoundarySystem = (screenWidth: number, _screenHeight: number): System => {
  return (world: IWorld): IWorld => {
    const entities = mirrorQuery(world)
    for (const entity of entities) {
      // Check horizontal boundaries
      if (Position.x[entity] <= 0) {
        Position.x[entity] = 0
        Velocity.x[entity] = Math.abs(Velocity.x[entity])
      } else if (Position.x[entity] >= screenWidth - 200) { // 200 is mirror width
        Position.x[entity] = screenWidth - 200
        Velocity.x[entity] = -Math.abs(Velocity.x[entity])
      }
    }
    return world
  }
}

// System to handle reflections when an object is clicked
export const createReflectionSystem = (
  _world: IWorld,
  entityMap: Map<string, number>,
  onReflection: (virtualObjects: { viewers: any[], objects: any[] }) => void
): System => {
  return (world: IWorld): IWorld => {
    const mirrors = mirrorQuery(world)
    const objects = objectQuery(world)

    // Find the clicked object (assuming it's marked in some way)
    const clickedObject = objects.find(obj => {
      // You'll need to add a way to mark clicked objects
      // For now, we'll assume it's passed in through the entityMap
      return entityMap.get('clickedObject') === obj
    })

    if (!clickedObject) return world

    const virtualViewers: any[] = []
    const virtualObjects: any[] = []

    // Get the main viewer entity
    const mainViewer = entityMap.get('viewer1')
    if (!mainViewer) return world

    // For each mirror, calculate reflections
    for (const mirror of mirrors) {
      const reflectionPoint = calculateReflectionPoint(
        { x: Position.x[clickedObject], y: Position.y[clickedObject] },
        { x: Position.x[mainViewer], y: Position.y[mainViewer] },
        { x: Position.x[mirror], y: Position.y[mirror] },
        Angle.value[mirror],
        Size.width[mirror]
      )

      if (!reflectionPoint) continue

      // Create virtual viewer
      const reflectedViewerPosition = reflectAcrossMirror(
        { x: Position.x[mainViewer], y: Position.y[mainViewer] },
        { x: Position.x[mirror], y: Position.y[mirror] },
        Angle.value[mirror]
      )

      virtualViewers.push({
        id: `virtual-viewer-${clickedObject}-${mirror}`,
        position: reflectedViewerPosition,
        type: 'virtual',
        size: {
          width: Size.width[mainViewer],
          height: Size.height[mainViewer]
        },
        color: getColor(mainViewer)
      })

      // Create virtual object
      const reflectedObjectPosition = reflectAcrossMirror(
        { x: Position.x[clickedObject], y: Position.y[clickedObject] },
        { x: Position.x[mirror], y: Position.y[mirror] },
        Angle.value[mirror]
      )

      virtualObjects.push({
        id: `virtual-${clickedObject}-${mirror}`,
        position: reflectedObjectPosition,
        type: 'virtual-triangle',
        size: {
          width: Size.width[clickedObject],
          height: Size.height[clickedObject]
        },
        color: getColor(clickedObject),
        isPulsing: false
      })
    }

    // Call the callback with the virtual objects
    onReflection({ viewers: virtualViewers, objects: virtualObjects })

    return world
  }
}

// System to handle ray emission when an object is clicked
export const createEmitSystem = (
  _world: IWorld,
  entityMap: Map<string, number>,
  onEmit: (rays: any[]) => void
): System => {
  return (world: IWorld): IWorld => {
    const mirrors = mirrorQuery(world)
    const objects = objectQuery(world)

    // Find the clicked object
    const clickedObject = objects.find(obj => {
      return entityMap.get('clickedObject') === obj
    })

    if (!clickedObject) return world

    const mainViewer = entityMap.get('viewer1')
    if (!mainViewer) return world

    const emittedRays: any[] = []

    // For each mirror, calculate and emit rays
    for (const mirror of mirrors) {
      const reflectionPoint = calculateReflectionPoint(
        { x: Position.x[clickedObject], y: Position.y[clickedObject] },
        { x: Position.x[mainViewer], y: Position.y[mainViewer] },
        { x: Position.x[mirror], y: Position.y[mirror] },
        Angle.value[mirror],
        Size.width[mirror]
      )

      if (!reflectionPoint) continue

      // Create incident ray
      emittedRays.push({
        id: `ray-${clickedObject}-${mirror}-incident`,
        from: {
          x: Position.x[clickedObject] + Size.width[clickedObject] / 2,
          y: Position.y[clickedObject] + Size.height[clickedObject] / 2
        },
        to: { x: reflectionPoint.x, y: reflectionPoint.y },
        color: 'yellow',
        width: 2
      })

      // Create reflected ray
      emittedRays.push({
        id: `ray-${clickedObject}-${mirror}-reflected`,
        from: { x: reflectionPoint.x, y: reflectionPoint.y },
        to: {
          x: Position.x[mainViewer] + Size.width[mainViewer] / 2,
          y: Position.y[mainViewer] + Size.height[mainViewer] / 2
        },
        color: 'yellow',
        width: 2
      })
    }

    // Call the callback with the emitted rays
    onEmit(emittedRays)

    return world
  }
} 