// The full scene configuration
export interface SceneGraph {
  mirrors: Mirror[];
  objects: SceneObject[];
  viewers: Viewer[];
  rays: Ray[];
}

// A mirror in the scene
export interface Mirror {
  id: string;
  position: Position;
  angleDegrees: number;
  size: Size;
  color?: string;
}

// A physical object that emits or reflects rays
export interface SceneObject {
  id: string;
  position: Position;
  type: 'triangle' | 'virtual-triangle';
  size: Size;
  color: string;
  isPulsing?: boolean;
}

// The observer of the scene
export interface Viewer {
  id: string;
  position: Position;
  type: 'viewer' | 'virtual';
  size: Size;
  color: string;
}

// A light ray (optional if auto-generated)
export interface Ray {
  id: string;
  from: Position;
  to: Position;
  label?: string;
  style?: "solid" | "dashed";
  color?: string;
  width?: number;
}

// Reusable building blocks
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}
