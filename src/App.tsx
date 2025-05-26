import { useEffect, useRef, useState } from 'react'
import { createWorld, addEntity, addComponent } from 'bitecs'
import type { IWorld } from 'bitecs'
import { Position, Velocity, Mirror } from './components'
import { createMovementSystem, createBoundarySystem } from './systems'
import './App.css'

function App() {
  const gameRef = useRef<HTMLDivElement>(null)
  const rectangleRef = useRef<HTMLDivElement>(null)
  const [speed, setSpeed] = useState(5) // speed in pixels per second
  const worldRef = useRef<IWorld>(createWorld({ maxEntities: 1000 }))
  const mirrorEntityRef = useRef<number | null>(null)

  useEffect(() => {
    const gameElement = gameRef.current
    const rectangleElement = rectangleRef.current
    if (!gameElement || !rectangleElement) return

    // Create mirror entity
    const mirrorEntity = addEntity(worldRef.current)
    mirrorEntityRef.current = mirrorEntity

    // Add components to mirror entity
    addComponent(worldRef.current, Position, mirrorEntity)
    addComponent(worldRef.current, Velocity, mirrorEntity)
    addComponent(worldRef.current, Mirror, mirrorEntity)

    // Initialize position and velocity
    Position.x[mirrorEntity] = 0
    Position.y[mirrorEntity] = (window.innerHeight - 25) / 2
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

      // Update DOM element position
      if (mirrorEntityRef.current) {
        rectangleElement.style.transform = `translate(${Position.x[mirrorEntityRef.current]}px, ${Position.y[mirrorEntityRef.current]}px)`
      }

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
      <div className="controls">
        <button onClick={() => setSpeed(prev => Math.max(1, prev - 1))}>-</button>
        <span>Speed: {speed} px/s</span>
        <button onClick={() => setSpeed(prev => prev + 1)}>+</button>
      </div>
    </div>
  )
}

export default App
