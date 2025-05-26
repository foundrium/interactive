import type { IWorld } from 'bitecs'
import { addEntity, addComponent } from 'bitecs'
import { Position, Velocity, Mirror, Angle, Viewer, Size, Color } from './components'
import type { SceneGraph } from './dsl'

// Helper function to store color string in Color component
function setColor(entity: number, color: string | undefined) {
  const defaultColor = 'black'
  const colorToUse = color || defaultColor
  for (let i = 0; i < colorToUse.length && i < 20; i++) {
    Color.value[entity][i] = colorToUse.charCodeAt(i)
  }
  // Null terminate the string
  Color.value[entity][Math.min(colorToUse.length, 19)] = 0
}

// Helper function to read color string from Color component
export function getColor(entity: number): string {
  let color = ''
  for (let i = 0; i < 20; i++) {
    const char = Color.value[entity][i]
    if (char === 0) break // Stop at null terminator
    color += String.fromCharCode(char)
  }
  return color
}

// Initial scene configuration
export const initialScene: SceneGraph = {
  mirrors: [
    {
      id: 'mirror1',
      position: { x: 400, y: 300 },
      angleDegrees: 90,
      size: { width: 200, height: 20 },
      color: 'blue'
    },
    {
      id: 'mirror2',
      position: { x: 225, y: 300 },
      angleDegrees: 90,
      size: { width: 200, height: 20 },
      color: 'green'
    }
  ],
  objects: [
    {
      id: 'object1',
      position: { x: 300, y: 250 },
      type: 'triangle',
      size: { width: 30, height: 30 },
      color: 'red',
      isPulsing: true
    }
  ],
  rays: [],
  viewers: [
    {
      id: 'viewer1',
      position: { x: 300, y: 350 },
      type: 'viewer',
      size: { width: 30, height: 30 },
      color: 'white'
    }
  ]
}

// Convert DSL scene graph to ECS entities
export function initializeSceneFromDSL(world: IWorld, scene: SceneGraph): Map<string, number> {
  const entityMap = new Map<string, number>()

  // Initialize mirrors
  for (const mirror of scene.mirrors) {
    const entity = addEntity(world)
    entityMap.set(mirror.id, entity)

    // Add components
    addComponent(world, Position, entity)
    addComponent(world, Velocity, entity)
    addComponent(world, Mirror, entity)
    addComponent(world, Angle, entity)
    addComponent(world, Size, entity)
    addComponent(world, Color, entity)

    // Set initial values
    Position.x[entity] = mirror.position.x
    Position.y[entity] = mirror.position.y
    Angle.value[entity] = (mirror.angleDegrees * Math.PI) / 180 // Convert to radians
    Velocity.x[entity] = 0 // Will be set by game systems
    Velocity.y[entity] = 0
    if (mirror.size) {
      Size.width[entity] = mirror.size.width
      Size.height[entity] = mirror.size.height
    }
    setColor(entity, mirror.color)
  }

  // Initialize objects
  for (const object of scene.objects) {
    const entity = addEntity(world)
    entityMap.set(object.id, entity)

    // Add components
    addComponent(world, Position, entity)
    addComponent(world, Size, entity)
    addComponent(world, Color, entity)

    // Set initial values
    Position.x[entity] = object.position.x
    Position.y[entity] = object.position.y
    if (object.size) {
      Size.width[entity] = object.size.width
      Size.height[entity] = object.size.height
    }
    setColor(entity, object.color)
  }

  // Initialize rays
  for (const ray of scene.rays) {
    const entity = addEntity(world)
    entityMap.set(ray.id, entity)

    // Add components
    addComponent(world, Position, entity)
    addComponent(world, Size, entity)
    addComponent(world, Color, entity)

    // Set initial values
    Position.x[entity] = ray.from.x
    Position.y[entity] = ray.from.y
    Size.width[entity] = ray.width || 2
    Size.height[entity] = Math.sqrt(
      Math.pow(ray.to.x - ray.from.x, 2) + 
      Math.pow(ray.to.y - ray.from.y, 2)
    )
    setColor(entity, ray.color || 'yellow')
  }

  // Initialize viewers
  for (const viewer of scene.viewers) {
    const entity = addEntity(world)
    entityMap.set(viewer.id, entity)

    // Add components
    addComponent(world, Position, entity)
    addComponent(world, Viewer, entity)
    addComponent(world, Size, entity)
    addComponent(world, Color, entity)

    // Set initial values
    Position.x[entity] = viewer.position.x
    Position.y[entity] = viewer.position.y
    Size.width[entity] = viewer.size?.width ?? 20
    Size.height[entity] = viewer.size?.height ?? 20
    setColor(entity, viewer.color)
  }

  return entityMap
} 