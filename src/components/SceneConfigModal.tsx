import { useState, useEffect } from 'react'
import type { SceneGraph } from '../dsl'

interface SceneConfigModalProps {
  isOpen: boolean
  onClose: () => void
  scene: SceneGraph
  onUpdate: (newScene: SceneGraph) => void
}

export function SceneConfigModal({ 
  isOpen, 
  onClose, 
  scene,
  onUpdate 
}: SceneConfigModalProps) {
  const [tempScene, setTempScene] = useState<SceneGraph>(scene)

  // Update temp scene when scene prop changes
  useEffect(() => {
    setTempScene(scene)
  }, [scene])

  if (!isOpen) return null

  const handlePositionChange = (x: number, y: number) => {
    if (!tempScene.mirrors[0]) return
    setTempScene({
      ...tempScene,
      mirrors: [{
        ...tempScene.mirrors[0],
        position: { x, y }
      }]
    })
  }

  const handleAngleChange = (angleDegrees: number) => {
    if (!tempScene.mirrors[0]) return
    setTempScene({
      ...tempScene,
      mirrors: [{
        ...tempScene.mirrors[0],
        angleDegrees
      }]
    })
  }

  const handleColorChange = (color: string) => {
    if (!tempScene.mirrors[0]) return
    setTempScene({
      ...tempScene,
      mirrors: [{
        ...tempScene.mirrors[0],
        color
      }]
    })
  }

  const handleSave = () => {
    onUpdate(tempScene)
    onClose()
  }

  const handleCancel = () => {
    setTempScene(scene) // Reset to original scene
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Scene Configuration</h2>
        <div className="config-section">
          <h3>Mirror Position</h3>
          <div className="input-group">
            <label>
              X:
              <input 
                type="number" 
                value={tempScene.mirrors[0]?.position.x ?? 0} 
                onChange={(e) => handlePositionChange(Number(e.target.value), tempScene.mirrors[0]?.position.y ?? 0)}
              />
            </label>
            <label>
              Y:
              <input 
                type="number" 
                value={tempScene.mirrors[0]?.position.y ?? 0} 
                onChange={(e) => handlePositionChange(tempScene.mirrors[0]?.position.x ?? 0, Number(e.target.value))}
              />
            </label>
          </div>
        </div>

        <div className="config-section">
          <h3>Mirror Angle (degrees)</h3>
          <input 
            type="number" 
            value={tempScene.mirrors[0]?.angleDegrees ?? 0} 
            onChange={(e) => handleAngleChange(Number(e.target.value))}
          />
        </div>

        <div className="config-section">
          <h3>Mirror Color</h3>
          <input 
            type="text" 
            value={tempScene.mirrors[0]?.color ?? 'blue'} 
            onChange={(e) => handleColorChange(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button onClick={handleCancel}>Cancel</button>
          <button onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
} 