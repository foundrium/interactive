import { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const gameRef = useRef<HTMLDivElement>(null)
  const rectangleRef = useRef<HTMLDivElement>(null)
  const [speed, setSpeed] = useState(5) // speed in pixels per second

  useEffect(() => {
    const gameElement = gameRef.current
    const rectangleElement = rectangleRef.current
    if (!gameElement || !rectangleElement) return

    let position = 0
    let direction = 1 // 1 for right, -1 for left
    let lastTimestamp = 0

    // Game loop
    const gameLoop = (timestamp: number) => {
      // Calculate delta time in seconds
      const deltaTime = (timestamp - lastTimestamp) / 1000
      lastTimestamp = timestamp

      // Update position based on delta time
      position += speed * direction * deltaTime * 10 // added the * 10 to make it scale better

      // Check boundaries and reverse direction if needed
      const maxPosition = window.innerWidth - 200 // 200 is rectangle width
      if (position >= maxPosition) {
        position = maxPosition
        direction = -1
      } else if (position <= 0) {
        position = 0
        direction = 1
      }

      // Center vertically
      const y = (window.innerHeight - 25) / 2 // 25 is rectangle height

      // Apply transform
      rectangleElement.style.transform = `translate(${position}px, ${y}px)`

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
