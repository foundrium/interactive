// The full scene configuration
export interface SceneGraph {
  mirrors: Mirror[];
  objects: SceneObject[];
  viewer: Viewer;
  rays?: Ray[]; // Optional; could be auto-generated or overridden based on author's needs
}

// A mirror in the scene
export interface Mirror {
  id: string;
  position: Position;
  angleDegrees: number; // Rotation relative to the horizontal in radians
  label?: string;
  color?: string;
  size?: Size;
}

// A physical object that emits or reflects rays
export interface SceneObject {
  id: string;
  type: "triangle" | "virtual-triangle"
  position: Position;
  label?: string;
  color?: string;
  size?: Size;
}

// The observer of the scene
export interface Viewer {
  position: Position;
  type: "original" | "virtual"
  color?: string;
  size?: Size;
}

// A light ray (optional if auto-generated)
export interface Ray {
  from: Position;
  to: Position;
  label?: string;
  style?: "solid" | "dashed";
  color?: string;
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
