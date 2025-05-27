import type { IWorld } from 'bitecs'
import { createWorld } from 'bitecs'
import { useEffect, useRef, useState } from 'react'
import './App.css'
import { Angle, Position, Size } from './components'
import { SceneConfigModal } from './components/SceneConfigModal'
import type { SceneGraph } from './dsl'
import { getColor, initialScene, initializeSceneFromDSL } from './scene'
import { createBoundarySystem, createEmitSystem, createMovementSystem, createReflectionSystem } from './systems'

function App() {
  const gameRef = useRef<HTMLDivElement>(null)
  const mirrorRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const objectRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const rayRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const viewerRefs = useRef<Map<string, HTMLDivElement>>(new Map())
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

    // Get viewer position from ECS
    const viewerEntity = entityMapRef.current.get('viewer1')
    const objectEntity = entityMapRef.current.get(objectId)

    if (!viewerEntity || !objectEntity) {
      console.warn('Could not find required entities in ECS')
      return
    }

    // Mark the clicked object in the entity map
    entityMapRef.current.set('clickedObject', objectEntity)

    // Create reflection system
    const reflectionSystem = createReflectionSystem(
      worldRef.current,
      entityMapRef.current,
      ({ viewers: virtualViewers, objects: virtualObjects }) => {
        // Update scene with virtual viewers and objects
        setScene(prev => ({
          ...prev,
          objects: [...updatedObjects, ...virtualObjects],
          viewers: [...prev.viewers, ...virtualViewers]
        }))
      }
    )

    // Create emit system
    const emitSystem = createEmitSystem(
      worldRef.current,
      entityMapRef.current,
      (emittedRays) => {
        // Update scene with emitted rays
        setScene(prev => ({
          ...prev,
          rays: [...prev.rays, ...emittedRays]
        }))
      }
    )

    // Run the systems
    reflectionSystem(worldRef.current)
    emitSystem(worldRef.current)

    // Clear the clicked object from the entity map
    entityMapRef.current.delete('clickedObject')
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
        mirrorElement.style.transform = `translate(${Position.x[mirrorEntity] - Size.width[mirrorEntity]/2}px, ${Position.y[mirrorEntity]}px) rotate(${mirrorAngle}rad)`
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
        if (!viewerEntity) {
          console.log('No entity found for viewer:', viewer.id)
          return
        }

        const viewerElement = viewerRefs.current.get(viewer.id)
        if (!viewerElement) {
          console.log('No DOM element found for viewer:', viewer.id)
          return
        }

        const transform = `translate(${Position.x[viewerEntity]}px, ${Position.y[viewerEntity]}px)`
        viewerElement.style.transform = transform
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
  }, [scene])

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
          data-virtual={object.type === 'virtual-triangle'}
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
