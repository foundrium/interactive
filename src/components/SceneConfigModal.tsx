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

  const handleMirrorPositionChange = (x: number, y: number) => {
    if (!tempScene.mirrors[0]) return
    setTempScene({
      ...tempScene,
      mirrors: [{
        ...tempScene.mirrors[0],
        position: { x, y }
      }]
    })
  }

  const handleMirrorAngleChange = (angleDegrees: number) => {
    if (!tempScene.mirrors[0]) return
    setTempScene({
      ...tempScene,
      mirrors: [{
        ...tempScene.mirrors[0],
        angleDegrees
      }]
    })
  }

  const handleMirrorColorChange = (color: string) => {
    if (!tempScene.mirrors[0]) return
    setTempScene({
      ...tempScene,
      mirrors: [{
        ...tempScene.mirrors[0],
        color
      }]
    })
  }

  const handleViewerPositionChange = (x: number, y: number) => {
    setTempScene({
      ...tempScene,
      viewer: {
        ...tempScene.viewer,
        position: { x, y }
      }
    })
  }

  const handleViewerColorChange = (color: string) => {
    setTempScene({
      ...tempScene,
      viewer: {
        ...tempScene.viewer,
        color
      }
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
          <h3>Mirror Configuration</h3>
          <div className="subsection">
            <h4>Position</h4>
            <div className="input-group">
              <label>
                X:
                <input 
                  type="number" 
                  value={tempScene.mirrors[0]?.position.x ?? 0} 
                  onChange={(e) => handleMirrorPositionChange(Number(e.target.value), tempScene.mirrors[0]?.position.y ?? 0)}
                />
              </label>
              <label>
                Y:
                <input 
                  type="number" 
                  value={tempScene.mirrors[0]?.position.y ?? 0} 
                  onChange={(e) => handleMirrorPositionChange(tempScene.mirrors[0]?.position.x ?? 0, Number(e.target.value))}
                />
              </label>
            </div>
          </div>

          <div className="subsection">
            <h4>Angle (degrees)</h4>
            <input 
              type="number" 
              value={tempScene.mirrors[0]?.angleDegrees ?? 0} 
              onChange={(e) => handleMirrorAngleChange(Number(e.target.value))}
            />
          </div>

          <div className="subsection">
            <h4>Color</h4>
            <input 
              type="text" 
              value={tempScene.mirrors[0]?.color ?? 'blue'} 
              onChange={(e) => handleMirrorColorChange(e.target.value)}
            />
          </div>
        </div>

        <div className="config-section">
          <h3>Viewer Configuration</h3>
          <div className="subsection">
            <h4>Position</h4>
            <div className="input-group">
              <label>
                X:
                <input 
                  type="number" 
                  value={tempScene.viewer.position.x} 
                  onChange={(e) => handleViewerPositionChange(Number(e.target.value), tempScene.viewer.position.y)}
                />
              </label>
              <label>
                Y:
                <input 
                  type="number" 
                  value={tempScene.viewer.position.y} 
                  onChange={(e) => handleViewerPositionChange(tempScene.viewer.position.x, Number(e.target.value))}
                />
              </label>
            </div>
          </div>

          <div className="subsection">
            <h4>Color</h4>
            <input 
              type="text" 
              value={tempScene.viewer.color} 
              onChange={(e) => handleViewerColorChange(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={handleCancel}>Cancel</button>
          <button onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
} 