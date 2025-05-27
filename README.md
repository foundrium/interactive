# Foundrium Interactive

An interactive physics simulation that demonstrates light reflection and virtual image formation using mirrors. The application uses a combination of Entity Component System (ECS) architecture and a Domain Specific Language (DSL) to create and manage scene objects.

The combination of DSL and ECS provides a flexible and efficient way to manage complex scene interactions while maintaining clean separation of concerns and good performance. Authors and LLM would use the DSL and then the adapter pattern handles the translation into the ECS for improved performance.

## Overview

This interactive simulation allows users to:
- Place and move mirrors in a 2D space
- Add objects that can be clicked to create virtual images
- Visualize light rays and their reflections
- See how virtual images are formed through mirror reflections

The simulation demonstrates key physics concepts:
- Light ray reflection
- Virtual image formation
- Mirror optics
- Real-time physics calculations

## Installation

1. Clone the repository:
```bash
git clone https://github.com/foundrium/foundrium-interactive.git
cd foundrium-interactive
```

2. Install dependencies:
```bash
pnpm install
```

## Running the Interactive

1. Start the development server:
```bash
pnpm run dev
```

2. Open your browser and navigate to `http://localhost:5173`

3. Use the interface to:
   - Click the "Configure" button to add mirrors and objects. This controls the DSL for changing positions, colors, adding and removing objects from the scene. **Note: there are some bugs in this configuration at the moment. I would configure one object at a time to avoid them**
   - Click on the pulsing objects to see their virtual images and light rays

## Architecture

### Domain Specific Language (DSL)

The application uses a DSL to define scene objects and their properties. The DSL is implemented in `src/dsl.ts` and includes:

- Scene Graph: The root structure containing all scene elements
- Scene Objects: Base objects that can be placed in the scene
- Mirrors: Reflective surfaces that can create virtual images
- Viewers: Objects that can "see" the scene
- Rays: Light paths from the objects to the viewer.

Example DSL structure:
```typescript
interface SceneGraph {
  mirrors: Mirror[];
  objects: SceneObject[];
  viewers: Viewer[];
  rays: Ray[];
}
```

### Entity Component System (ECS)

The application uses an ECS architecture (implemented with `bitecs`) for efficient interactive logic and state management. Currently the systems portion is only lightly used, but it could be expanded to create significantly more complicated scenes that are easy to reason about and memory and CPU performant.

1. **Components** (`src/components.ts`):
   - Position: x, y coordinates
   - Size: width, height
   - Velocity: x, y movement
   - Angle: rotation
   - Mirror: mirror-specific properties

2. **Systems** (`src/systems.ts`):
   - Movement System: Updates positions based on velocities
   - Boundary System: Handles collisions with screen boundaries
   - Reflection System: Calculates virtual images and reflections
   - Emit System: Creates and manages light rays

3. **World Management**:
   - Entities are created and managed through the ECS
   - Components are attached to entities
   - Systems process entities with specific components
   - State is updated through component modifications

### Key Features

1. **Real-time Physics**:
   - Continuous position updates
   - Collision detection
   - Reflection calculations

2. **Interactive Elements**:
   - Clickable objects
   - Movable mirrors
   - Dynamic ray visualization

3. **Visual Feedback**:
   - Virtual image rendering
   - Light ray paths
   - Object highlighting through CSS pulse animation

4. **Configuration**:
   - Scene setup through modal interface
   - Real-time scene updates
   - Persistent configuration

