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
  const rectangleRef = useRef<HTMLDivElement>(null)
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
    const rectangleElement = rectangleRef.current
    const viewerElement = viewerRef.current
    if (!gameElement || !rectangleElement || !viewerElement) return

    const mirrorEntity = entityMapRef.current.get('main-mirror')
    const viewerEntity = entityMapRef.current.get('viewer')
    if (!mirrorEntity || !viewerEntity) return

    // Set initial velocity for mirror
    Velocity.x[mirrorEntity] = speed * 10 // Scale up the speed
    Velocity.y[mirrorEntity] = 0

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
      movementSystem(worldRef.current) // for now I've set the movement speed to 0
      boundarySystem(worldRef.current) // this will run but not used since mirrors are static atm

      // Update DOM element positions, sizes, and colors
      const mirrorAngle = Angle.value[mirrorEntity]
      rectangleElement.style.transform = `translate(${Position.x[mirrorEntity]}px, ${Position.y[mirrorEntity]}px) rotate(${mirrorAngle}rad)`
      rectangleElement.style.backgroundColor = getColor(mirrorEntity)
      rectangleElement.style.width = `${Size.width[mirrorEntity]}px`
      rectangleElement.style.height = `${Size.height[mirrorEntity]}px`

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
      <div ref={rectangleRef} className="rectangle" />
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
