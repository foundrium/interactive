// The full scene configuration
interface SceneGraph {
  mirrors: Mirror[];
  objects: SceneObject[];
  viewer: Viewer;
  rays?: Ray[]; // Optional; could be auto-generated or overridden based on author's needs
}

// A mirror in the scene
interface Mirror {
  id: string;
  position: Position;
  angleDegrees: number; // Rotation relative to the horizontal in radians
  length?: number;
  label?: string;
  color?: string;
  size?: Size;
}

// A physical object that emits or reflects rays
interface SceneObject {
  id: string;
  type: "triangle" | "virtual-triangle"
  position: Position;
  label?: string;
  color?: string;
  size?: Size;
}

// The observer of the scene
interface Viewer {
  position: Position;
  type: "original" | "virtual"
  color?: string;
  size?: Size;
}

// A light ray (optional if auto-generated)
interface Ray {
  from: Position;
  to: Position;
  label?: string;
  style?: "solid" | "dashed";
  color?: string;
}

// Reusable building blocks
interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}
