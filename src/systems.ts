import type { IWorld, System } from 'bitecs'
import { Position, Velocity, Mirror } from './components'
import { defineQuery } from 'bitecs'

// Create a query for entities with Mirror component
const mirrorQuery = defineQuery([Mirror])

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
export const createBoundarySystem = (screenWidth: number, screenHeight: number): System => {
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