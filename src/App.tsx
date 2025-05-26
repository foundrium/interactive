import type { IWorld } from 'bitecs'
import { createWorld } from 'bitecs'
import { useEffect, useRef, useState } from 'react'
import './App.css'
import { Position, Size, Velocity, Angle } from './components'
import { getColor, initialScene, initializeSceneFromDSL } from './scene'
import { createBoundarySystem, createMovementSystem } from './systems'
import type { SceneGraph, Ray } from './dsl'
import { SceneConfigModal } from './components/SceneConfigModal'

function App() {
  const gameRef = useRef<HTMLDivElement>(null)
  const mirrorRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const objectRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const rayRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const viewerRef = useRef<HTMLDivElement>(null)
  const [speed, setSpeed] = useState<number>(0)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [scene, setScene] = useState<SceneGraph>(initialScene)
  const worldRef = useRef<IWorld>(createWorld({ maxEntities: 1000 }))
  const entityMapRef = useRef<Map<string, number>>(new Map())

  type Point = { x: number; y: number }

  // Main function
  const calculateReflectionPoint = (
    objectPos: Point,
    viewerPos: Point,
    mirrorPos: Point,
    mirrorAngle: number
  ): Point | null => {
    const theta = mirrorAngle

    // Step 2: Reflect viewer across the mirror line to get virtual viewer
    const reflectAcrossMirror = (P: Point, origin: Point, angle: number): Point => {
      const dx = P.x - origin.x
      const dy = P.y - origin.y

      // Rotate to align mirror with x-axis
      const x1 = dx * Math.cos(angle) + dy * Math.sin(angle)
      const y1 = -dx * Math.sin(angle) + dy * Math.cos(angle)

      // Reflect across x-axis
      const x2 = x1
      const y2 = -y1

      // Rotate back to original angle
      const rx = x2 * Math.cos(angle) - y2 * Math.sin(angle) + origin.x
      const ry = x2 * Math.sin(angle) + y2 * Math.cos(angle) + origin.y

      return { x: rx, y: ry }
    }

    const virtualViewer = reflectAcrossMirror(viewerPos, mirrorPos, theta)

    // Step 3: Compute intersection of line (object → virtual viewer) with the mirror line
    const getIntersection = (A: Point, B: Point, C: Point, D: Point): Point | null => {
      const a1 = B.y - A.y
      const b1 = A.x - B.x
      const c1 = a1 * A.x + b1 * A.y

      const a2 = D.y - C.y
      const b2 = C.x - D.x
      const c2 = a2 * C.x + b2 * C.y

      const det = a1 * b2 - a2 * b1
      if (det === 0) return null // lines are parallel

      const x = (b2 * c1 - b1 * c2) / det
      const y = (a1 * c2 - a2 * c1) / det

      return { x, y }
    }

    // Step 4: Define a second point along the mirror direction to form the mirror line
    const mirrorDir: Point = {
      x: mirrorPos.x + Math.cos(theta),
      y: mirrorPos.y + Math.sin(theta),
    }

    return getIntersection(objectPos, virtualViewer, mirrorPos, mirrorDir)
  }


  // Handle object click
  const handleObjectClick = (objectId: string) => {
    const object = scene.objects.find(obj => obj.id === objectId)
    if (!object) return

    // Stop pulsing
    const updatedObjects = scene.objects.map(obj =>
      obj.id === objectId ? { ...obj, isPulsing: false } : obj
    )

    // Get mirror and viewer positions from ECS
    const mirrorEntity = entityMapRef.current.get(scene.mirrors[0].id)
    const viewerEntity = entityMapRef.current.get('viewer')
    const objectEntity = entityMapRef.current.get(objectId)

    if (!mirrorEntity || !viewerEntity || !objectEntity) {
      console.warn('Could not find required entities in ECS')
      return
    }

    console.log(`calling calculateReflectionPoint with positions:
      object: ${Position.x[objectEntity]}, ${Position.y[objectEntity]}
      viewer: ${Position.x[viewerEntity]}, ${Position.y[viewerEntity]}
      mirror: ${Position.x[mirrorEntity] + Size.width[mirrorEntity] / 2}, ${Position.y[mirrorEntity] + Size.height[mirrorEntity] / 2}
      mirrorAngle: ${Angle.value[mirrorEntity]}
    `)

    // Calculate reflection point using ECS positions
    const reflectionPoint = calculateReflectionPoint(
      { x: Position.x[objectEntity] + Size.width[objectEntity] / 2, y: Position.y[objectEntity] + Size.height[objectEntity] / 2 },
      { x: Position.x[viewerEntity] + Size.width[viewerEntity] / 2, y: Position.y[viewerEntity] + Size.height[viewerEntity] / 2 },
      { x: Position.x[mirrorEntity] + Size.width[mirrorEntity] / 2, y: Position.y[mirrorEntity] + Size.height[mirrorEntity] / 2 },
      Angle.value[mirrorEntity]
    )

    if (!reflectionPoint) {
      console.warn('No reflection point found')
      return
    }

    // Create rays
    const incidentRay: Ray = {
      id: `ray-${objectId}-incident`,
      from: { x: Position.x[objectEntity] + Size.width[objectEntity] / 2, y: Position.y[objectEntity] + Size.height[objectEntity] / 2 },
      to: { x: reflectionPoint.x, y: reflectionPoint.y },
      color: 'yellow',
      width: 2
    }

    const reflectedRay: Ray = {
      id: `ray-${objectId}-reflected`,
      from: { x: reflectionPoint.x, y: reflectionPoint.y },
      to: { x: Position.x[viewerEntity] + Size.width[viewerEntity] / 2, y: Position.y[viewerEntity] + Size.height[viewerEntity] / 2 },
      color: 'yellow',
      width: 2
    }

    console.log(incidentRay, reflectedRay)

    // Update scene with new rays and object state
    setScene(prev => ({
      ...prev,
      objects: updatedObjects,
      rays: [...prev.rays, incidentRay, reflectedRay]
    }))
  }

  // Reinitialize ECS when scene changes
  useEffect(() => {
    // Create a new world to ensure clean state
    worldRef.current = createWorld({ maxEntities: 1000 })
    entityMapRef.current = initializeSceneFromDSL(worldRef.current, scene)
  }, [scene])

  useEffect(() => {
    const gameElement = gameRef.current
    const viewerElement = viewerRef.current
    if (!gameElement || !viewerElement) return

    const viewerEntity = entityMapRef.current.get('viewer')
    if (!viewerEntity) return

    // Set initial velocity for all mirrors
    scene.mirrors.forEach(mirror => {
      const mirrorEntity = entityMapRef.current.get(mirror.id)
      if (mirrorEntity) {
        Velocity.x[mirrorEntity] = speed * 10 // Scale up the speed
        Velocity.y[mirrorEntity] = 0
      }
    })

    let lastTimestamp = 0

    // Game loop
    const gameLoop = (timestamp: number) => {
      // Calculate delta time in seconds
      const deltaTime = (timestamp - lastTimestamp) / 1000
      lastTimestamp = timestamp

      // Create systems
      const movementSystem = createMovementSystem(deltaTime)
      const boundarySystem = createBoundarySystem(window.innerWidth, window.innerHeight)

      // Run systems
      movementSystem(worldRef.current)
      boundarySystem(worldRef.current)

      // Update DOM element positions, sizes, and colors
      scene.mirrors.forEach(mirror => {
        const mirrorEntity = entityMapRef.current.get(mirror.id)
        if (!mirrorEntity) return

        const mirrorElement = mirrorRefs.current.get(mirror.id)
        if (!mirrorElement) return

        const mirrorAngle = Angle.value[mirrorEntity]
        mirrorElement.style.transform = `translate(${Position.x[mirrorEntity]}px, ${Position.y[mirrorEntity]}px) rotate(${mirrorAngle}rad)`
        mirrorElement.style.backgroundColor = getColor(mirrorEntity)
        mirrorElement.style.width = `${Size.width[mirrorEntity]}px`
        mirrorElement.style.height = `${Size.height[mirrorEntity]}px`
      })

      scene.objects.forEach(object => {
        const objectEntity = entityMapRef.current.get(object.id)
        if (!objectEntity) return

        const objectElement = objectRefs.current.get(object.id)
        if (!objectElement) return

        objectElement.style.transform = `translate(${Position.x[objectEntity]}px, ${Position.y[objectEntity]}px)`
        objectElement.style.color = getColor(objectEntity)
        objectElement.style.width = `${Size.width[objectEntity]}px`
        objectElement.style.height = `${Size.height[objectEntity]}px`
        objectElement.style.animation = object.isPulsing ? 'pulse 2s infinite' : 'none'
      })

      scene.rays.forEach(ray => {
        const rayEntity = entityMapRef.current.get(ray.id)
        if (!rayEntity) return

        const rayElement = rayRefs.current.get(ray.id)
        if (!rayElement) return

        const dx = ray.to.x - ray.from.x
        const dy = ray.to.y - ray.from.y
        const angle = Math.atan2(dy, dx)
        const length = Math.sqrt(dx * dx + dy * dy)

        rayElement.style.transform = `translate(${Position.x[rayEntity]}px, ${Position.y[rayEntity]}px) rotate(${angle}rad)`
        rayElement.style.width = `${length}px`
        rayElement.style.height = `${Size.width[rayEntity]}px`
        rayElement.style.backgroundColor = getColor(rayEntity)
      })

      viewerElement.style.transform = `translate(${Position.x[viewerEntity]}px, ${Position.y[viewerEntity]}px)`
      viewerElement.style.width = `${Size.width[viewerEntity]}px`
      viewerElement.style.height = `${Size.height[viewerEntity]}px`
      viewerElement.style.backgroundColor = getColor(viewerEntity)

      // Continue the game loop
      requestAnimationFrame(gameLoop)
    }

    // Start the game loop
    const animationFrameId = requestAnimationFrame(gameLoop)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [speed, scene])

  return (
    <div ref={gameRef} className="game-container">
      {scene.mirrors.map(mirror => (
        <div
          key={mirror.id}
          ref={el => {
            if (el) mirrorRefs.current.set(mirror.id, el)
            else mirrorRefs.current.delete(mirror.id)
          }}
          className="rectangle"
        />
      ))}
      {scene.objects.map(object => (
        <div
          key={object.id}
          ref={el => {
            if (el) objectRefs.current.set(object.id, el)
            else objectRefs.current.delete(object.id)
          }}
          className="triangle"
          onClick={() => handleObjectClick(object.id)}
          style={{ cursor: 'pointer' }}
        />
      ))}
      {scene.rays.map(ray => (
        <div
          key={ray.id}
          ref={el => {
            if (el) rayRefs.current.set(ray.id, el)
            else rayRefs.current.delete(ray.id)
          }}
          className="ray"
        />
      ))}
      <div ref={viewerRef} className="viewer" />
      <button className="config-button" onClick={() => setIsConfigOpen(true)}>
        Configure
      </button>
      <SceneConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        scene={scene}
        onUpdate={setScene}
      />
    </div>
  )
}

export default App
