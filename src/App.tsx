import type { IWorld } from 'bitecs'
import { createWorld } from 'bitecs'
import { useEffect, useRef, useState } from 'react'
import './App.css'
import { Position, Size, Velocity, Angle } from './components'
import { getColor, initialScene, initializeSceneFromDSL } from './scene'
import { createBoundarySystem, createMovementSystem } from './systems'
import type { SceneGraph, Ray, Viewer } from './dsl'
import { SceneConfigModal } from './components/SceneConfigModal'
import { calculateReflectionPoint } from './utils/rayUtils'

function App() {
  const gameRef = useRef<HTMLDivElement>(null)
  const mirrorRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const objectRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const rayRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const viewerRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [speed, setSpeed] = useState<number>(0)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [scene, setScene] = useState<SceneGraph>(initialScene)
  const worldRef = useRef<IWorld>(createWorld({ maxEntities: 1000 }))
  const entityMapRef = useRef<Map<string, number>>(new Map())

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
    const viewerEntity = entityMapRef.current.get('viewer1')
    const objectEntity = entityMapRef.current.get(objectId)

    if (!mirrorEntity || !viewerEntity || !objectEntity) {
      console.warn('Could not find required entities in ECS')
      return
    }

    // Calculate reflection point using ECS positions
    const reflectionPoint = calculateReflectionPoint(
      { x: Position.x[objectEntity] + Size.width[objectEntity] / 2, y: Position.y[objectEntity] + Size.height[objectEntity] / 2 },
      { x: Position.x[viewerEntity] + Size.width[viewerEntity] / 2, y: Position.y[viewerEntity] + Size.height[viewerEntity] / 2 },
      { x: Position.x[mirrorEntity] + Size.width[mirrorEntity] / 2, y: Position.y[mirrorEntity] + Size.height[mirrorEntity] / 2 },
      Angle.value[mirrorEntity],
      Size.width[mirrorEntity]
    )

    if (!reflectionPoint) {
      console.warn('No reflection point found')
      return
    }

    // Create virtual viewer
    const virtualViewer: Viewer = {
      id: `virtual-viewer-${objectId}`,
      position: {
        x: Position.x[mirrorEntity] + Size.width[mirrorEntity] + Size.width[viewerEntity] + (Position.x[mirrorEntity] - Position.x[viewerEntity]),
        y: Position.y[viewerEntity]
      },
      type: 'virtual',
      size: {
        width: Size.width[viewerEntity],
        height: Size.height[viewerEntity]
      },
      color: getColor(viewerEntity)
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

    // Update scene with new rays and virtual viewer
    setScene(prev => ({
      ...prev,
      objects: updatedObjects,
      rays: [...prev.rays, incidentRay, reflectedRay],
      viewers: [...prev.viewers, virtualViewer]
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
    const viewerElements = Array.from(viewerRefs.current.values())
    if (!gameElement || viewerElements.length === 0) return

    const viewerEntities = Array.from(entityMapRef.current.values()).filter(id => id !== 0)
    if (viewerEntities.length === 0) return

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

      scene.viewers.forEach(viewer => {
        const viewerEntity = entityMapRef.current.get(viewer.id)
        if (!viewerEntity) return

        const viewerElement = viewerRefs.current.get(viewer.id)
        if (!viewerElement) return

        viewerElement.style.transform = `translate(${Position.x[viewerEntity]}px, ${Position.y[viewerEntity]}px)`
        viewerElement.style.width = `${Size.width[viewerEntity]}px`
        viewerElement.style.height = `${Size.height[viewerEntity]}px`
        viewerElement.style.backgroundColor = viewer.color
      })

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
      {scene.viewers.map(viewer => (
        <div
          key={viewer.id}
          ref={el => {
            if (el) viewerRefs.current.set(viewer.id, el)
            else viewerRefs.current.delete(viewer.id)
          }}
          className="viewer"
          data-virtual={viewer.type === 'virtual'}
        />
      ))}
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
