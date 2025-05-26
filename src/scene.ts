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
  mirrors: [{
    id: 'main-mirror',
    position: { x: 0, y: 300 },
    angleDegrees: 0,
    length: 200,
    color: 'blue',
    size: { width: 200, height: 25 }
  }],
  objects: [],
  viewer: {
    position: { x: 400, y: 200 },
    type: 'original',
    color: 'white',
    size: { width: 30, height: 30 }
  }
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

  // Initialize viewer
  const viewerEntity = addEntity(world)
  entityMap.set('viewer', viewerEntity)

  // Add components
  addComponent(world, Position, viewerEntity)
  addComponent(world, Viewer, viewerEntity)
  addComponent(world, Size, viewerEntity)
  addComponent(world, Color, viewerEntity)

  // Set initial values
  Position.x[viewerEntity] = scene.viewer.position.x
  Position.y[viewerEntity] = scene.viewer.position.y
  Size.width[viewerEntity] = scene.viewer.size?.width ?? 20
  Size.height[viewerEntity] = scene.viewer.size?.height ?? 20
  setColor(viewerEntity, scene.viewer.color)

  return entityMap
} 