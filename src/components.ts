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

// Size component (width, height)
export const Size = defineComponent({
  width: Types.f32,
  height: Types.f32
})

// Color component (stored as string)
export const Color = defineComponent({
  value: [Types.ui8, 20] // Array of 20 characters to store color name
})

// Mirror component (to identify our mirror entity)
export const Mirror = defineComponent() as IComponent

// Viewer component (to identify our viewer entity)
export const Viewer = defineComponent() as IComponent 