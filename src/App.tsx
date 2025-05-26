import type { IWorld } from 'bitecs'
import { createWorld } from 'bitecs'
import { useEffect, useRef, useState } from 'react'
import './App.css'
import { Position, Size, Velocity, Angle, Color } from './components'
import { getColor, initialScene, initializeSceneFromDSL } from './scene'
import { createBoundarySystem, createMovementSystem } from './systems'
import type { SceneGraph } from './dsl'
import { SceneConfigModal } from './components/SceneConfigModal'

function App() {
  const gameRef = useRef<HTMLDivElement>(null)
  const mirrorRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const objectRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const viewerRef = useRef<HTMLDivElement>(null)
  const [speed, setSpeed] = useState<number>(0)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [scene, setScene] = useState<SceneGraph>(initialScene)
  const worldRef = useRef<IWorld>(createWorld({ maxEntities: 1000 }))
  const entityMapRef = useRef<Map<string, number>>(new Map())

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
