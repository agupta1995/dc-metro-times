import { useState, useEffect } from 'react'
import './SavePresetModal.css'

export function SavePresetModal({
  isOpen,
  onClose,
  onSave,
  initialName = '',
  initialWalkTime = 15,
  isEditing = false
}) {
  const [name, setName] = useState(initialName)
  const [walkTime, setWalkTime] = useState(initialWalkTime)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(initialName)
      setWalkTime(initialWalkTime)
    }
  }, [isOpen, initialName, initialWalkTime])

  if (!isOpen) {
    return null
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      return
    }
    onSave({
      name: name.trim(),
      walkTime: parseInt(walkTime, 10) || 15
    })
    onClose()
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <h3>{isEditing ? 'Edit Preset' : 'Save as Preset'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label htmlFor="preset-name">Preset Name</label>
            <input
              id="preset-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Commute"
              autoFocus
              maxLength={30}
            />
          </div>
          <div className="modal-field">
            <label htmlFor="preset-walktime">Walk Time (minutes)</label>
            <input
              id="preset-walktime"
              type="number"
              value={walkTime}
              onChange={(e) => setWalkTime(e.target.value)}
              min="1"
              max="60"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-save" disabled={!name.trim()}>
              {isEditing ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
