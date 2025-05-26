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

  // Get the main viewer (type === 'viewer')
  const mainViewer = scene.viewers.find(v => v.type === 'viewer')

  const handleMirrorPositionChange = (index: number, x: number, y: number) => {
    const newMirrors = [...tempScene.mirrors]
    newMirrors[index] = {
      ...newMirrors[index],
      position: { x, y }
    }
    setTempScene({
      ...tempScene,
      mirrors: newMirrors
    })
  }

  const handleMirrorAngleChange = (index: number, angleDegrees: number) => {
    const newMirrors = [...tempScene.mirrors]
    newMirrors[index] = {
      ...newMirrors[index],
      angleDegrees
    }
    setTempScene({
      ...tempScene,
      mirrors: newMirrors
    })
  }

  const handleMirrorColorChange = (index: number, color: string) => {
    const newMirrors = [...tempScene.mirrors]
    newMirrors[index] = {
      ...newMirrors[index],
      color
    }
    setTempScene({
      ...tempScene,
      mirrors: newMirrors
    })
  }

  const handleAddMirror = () => {
    const newMirror = {
      id: `mirror-${tempScene.mirrors.length + 1}`,
      position: { x: 400, y: 400 },
      angleDegrees: 90,
      color: 'blue',
      size: { width: 200, height: 15 }
    }
    setTempScene({
      ...tempScene,
      mirrors: [...tempScene.mirrors, newMirror]
    })
  }

  const handleRemoveMirror = (index: number) => {
    const newMirrors = tempScene.mirrors.filter((_, i) => i !== index)
    setTempScene({
      ...tempScene,
      mirrors: newMirrors
    })
  }

  const handleViewerPositionChange = (x: number, y: number) => {
    onUpdate({
      ...scene,
      viewers: scene.viewers.map(viewer => 
        viewer.type === 'viewer' ? { ...viewer, position: { x, y } } : viewer
      )
    })
  }

  const handleViewerColorChange = (color: string) => {
    onUpdate({
      ...scene,
      viewers: scene.viewers.map(viewer => 
        viewer.type === 'viewer' ? { ...viewer, color } : viewer
      )
    })
  }

  const handleObjectPositionChange = (index: number, x: number, y: number) => {
    const newObjects = [...tempScene.objects]
    newObjects[index] = {
      ...newObjects[index],
      position: { x, y }
    }
    setTempScene({
      ...tempScene,
      objects: newObjects
    })
  }

  const handleObjectColorChange = (index: number, color: string) => {
    const newObjects = [...tempScene.objects]
    newObjects[index] = {
      ...newObjects[index],
      color
    }
    setTempScene({
      ...tempScene,
      objects: newObjects
    })
  }

  const handleAddObject = () => {
    const newObject = {
      id: `object-${tempScene.objects.length + 1}`,
      position: { x: 400, y: 350 },
      type: 'triangle' as const,
      color: 'red',
      size: { width: 30, height: 30 },
      isPulsing: true
    }
    setTempScene({
      ...tempScene,
      objects: [...tempScene.objects, newObject]
    })
  }

  const handleRemoveObject = (index: number) => {
    const newObjects = tempScene.objects.filter((_, i) => i !== index)
    setTempScene({
      ...tempScene,
      objects: newObjects
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
          <div className="section-header">
            <h3>Mirrors</h3>
            <button className="add-button" onClick={handleAddMirror}>Add Mirror</button>
          </div>
          
          {tempScene.mirrors.map((mirror, index) => (
            <div key={mirror.id} className="mirror-config">
              <div className="subsection-header">
                <h4>Mirror {index + 1}</h4>
                <button 
                  className="remove-button"
                  onClick={() => handleRemoveMirror(index)}
                  disabled={tempScene.mirrors.length === 1}
                >
                  Remove
                </button>
              </div>
              
              <div className="subsection">
                <h5>Position</h5>
                <div className="input-group">
                  <label>
                    X:
                    <input 
                      type="number" 
                      value={mirror.position.x} 
                      onChange={(e) => handleMirrorPositionChange(index, Number(e.target.value), mirror.position.y)}
                    />
                  </label>
                  <label>
                    Y:
                    <input 
                      type="number" 
                      value={mirror.position.y} 
                      onChange={(e) => handleMirrorPositionChange(index, mirror.position.x, Number(e.target.value))}
                    />
                  </label>
                </div>
              </div>

              <div className="subsection">
                <h5>Angle (degrees)</h5>
                <input 
                  type="number" 
                  value={mirror.angleDegrees} 
                  onChange={(e) => handleMirrorAngleChange(index, Number(e.target.value))}
                />
              </div>

              <div className="subsection">
                <h5>Color</h5>
                <input 
                  type="text" 
                  value={mirror.color} 
                  onChange={(e) => handleMirrorColorChange(index, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="config-section">
          <div className="section-header">
            <h3>Objects</h3>
            <button className="add-button" onClick={handleAddObject}>Add Object</button>
          </div>

          {tempScene.objects.map((object, index) => (
            <div key={object.id} className="object-config">
              <div className="subsection-header">
                <h4>Object {index + 1}</h4>
                <button 
                  className="remove-button"
                  onClick={() => handleRemoveObject(index)}
                >
                  Remove
                </button>
              </div>

              <div className="subsection">
                <h5>Position</h5>
                <div className="input-group">
                  <label>
                    X:
                    <input 
                      type="number" 
                      value={object.position.x} 
                      onChange={(e) => handleObjectPositionChange(index, Number(e.target.value), object.position.y)}
                    />
                  </label>
                  <label>
                    Y:
                    <input 
                      type="number" 
                      value={object.position.y} 
                      onChange={(e) => handleObjectPositionChange(index, object.position.x, Number(e.target.value))}
                    />
                  </label>
                </div>
              </div>

              <div className="subsection">
                <h5>Color</h5>
                <input 
                  type="text" 
                  value={object.color} 
                  onChange={(e) => handleObjectColorChange(index, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="config-section">
          <h3>Viewer Configuration</h3>
          <div className="subsection">
            <h4>Viewer</h4>
            <div className="input-group">
              <label>
                X:
                <input
                  type="number"
                  value={mainViewer?.position.x ?? 0}
                  onChange={e => handleViewerPositionChange(Number(e.target.value), mainViewer?.position.y ?? 0)}
                />
              </label>
              <label>
                Y:
                <input
                  type="number"
                  value={mainViewer?.position.y ?? 0}
                  onChange={e => handleViewerPositionChange(mainViewer?.position.x ?? 0, Number(e.target.value))}
                />
              </label>
            </div>
            <div className="input-group">
              <label>
                Color:
                <input
                  type="color"
                  value={mainViewer?.color ?? '#ffffff'}
                  onChange={e => handleViewerColorChange(e.target.value)}
                />
              </label>
            </div>
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