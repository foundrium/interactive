import type { IWorld } from 'bitecs'
import { createWorld } from 'bitecs'
import { useEffect, useRef, useState } from 'react'
import './App.css'
import { Position, Size, Velocity } from './components'
import { getColor, initialScene, initializeSceneFromDSL } from './scene'
import { createBoundarySystem, createMovementSystem } from './systems'

function App() {
  const gameRef = useRef<HTMLDivElement>(null)
  const rectangleRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  const [speed, setSpeed] = useState(5) // speed in pixels per second
  const worldRef = useRef<IWorld>(createWorld({ maxEntities: 1000 }))
  const entityMapRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    const gameElement = gameRef.current
    const rectangleElement = rectangleRef.current
    const viewerElement = viewerRef.current
    if (!gameElement || !rectangleElement || !viewerElement) return

    // Initialize scene from DSL
    entityMapRef.current = initializeSceneFromDSL(worldRef.current, initialScene)
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
      movementSystem(worldRef.current)
      boundarySystem(worldRef.current)

      // Update DOM element positions, sizes, and colors
      rectangleElement.style.transform = `translate(${Position.x[mirrorEntity]}px, ${Position.y[mirrorEntity]}px)`
      rectangleElement.style.backgroundColor = getColor(mirrorEntity)
      
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
  }, [speed]) // Add speed to dependencies

  return (
    <div ref={gameRef} className="game-container">
      <div ref={rectangleRef} className="rectangle" />
      <div ref={viewerRef} className="viewer" />
      <div className="controls">
        <button onClick={() => setSpeed(prev => Math.max(1, prev - 1))}>-</button>
        <span>Speed: {speed} px/s</span>
        <button onClick={() => setSpeed(prev => prev + 1)}>+</button>
      </div>
    </div>
  )
}

export default App
