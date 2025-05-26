import { defineComponent, Types } from 'bitecs'
import type { IComponent } from 'bitecs'

// Position component (x, y coordinates)
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32
})

// Angle component (rotation in radians)
export const Angle = defineComponent({
  value: Types.f32
})

// Velocity component (x, y velocity)
export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32
})

// Mirror component (to identify our mirror entity)
export const Mirror = defineComponent() as IComponent 