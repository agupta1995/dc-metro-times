import { useState, useEffect } from 'react'
import { LINE_NAMES } from '../utils/api'
import { clearGTFSCache, getGTFSLastUpdated, loadGTFSData } from '../utils/gtfs'
import './Settings.css'

export function Settings({
  walkTime,
  onWalkTimeChange,
  timeWindow,
  onTimeWindowChange,
  presets,
  onUpdatePreset,
  onDeletePreset,
  onClearAllData,
  stations,
  onClose
}) {
  const [apiKey, setApiKey] = useState(localStorage.getItem('wmata_api_key') || '')
  const [saved, setSaved] = useState(false)
  const [gtfsLastUpdated, setGtfsLastUpdated] = useState(null)
  const [gtfsReloading, setGtfsReloading] = useState(false)
  const [editingPresetId, setEditingPresetId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editWalkTime, setEditWalkTime] = useState(15)

  // Load GTFS last updated timestamp on mount
  useEffect(() => {
    getGTFSLastUpdated().then(setGtfsLastUpdated)
  }, [])

  const handleReloadSchedule = async () => {
    setGtfsReloading(true)
    try {
      await clearGTFSCache()
      await loadGTFSData()
      const updated = await getGTFSLastUpdated()
      setGtfsLastUpdated(updated)
    } catch (err) {
      console.error('Failed to reload GTFS:', err)
    } finally {
      setGtfsReloading(false)
    }
  }

  const formatLastUpdated = (date) => {
    if (!date) return 'Never'
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleSaveApiKey = () => {
    localStorage.setItem('wmata_api_key', apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClearApiKey = () => {
    localStorage.removeItem('wmata_api_key')
    setApiKey('')
  }

  // Find station name from code
  const getStationName = (code) => {
    if (!code || !stations || stations.length === 0) return 'Not set'
    const station = stations.find(s => s.Code === code)
    return station ? station.Name : code
  }

  // Format lines array
  const formatLines = (lines) => {
    if (!lines || lines.length === 0) return 'All'
    return lines.map(l => LINE_NAMES[l] || l).join(', ')
  }

  // Format track
  const formatTrack = (track) => {
    if (!track) return 'All'
    return `Track ${track}`
  }

  // Start editing a preset
  const startEditingPreset = (preset) => {
    setEditingPresetId(preset.id)
    setEditName(preset.name)
    setEditWalkTime(preset.walkTime || 15)
  }

  // Save preset edits
  const savePresetEdit = () => {
    if (editingPresetId && editName.trim()) {
      onUpdatePreset(editingPresetId, {
        name: editName.trim(),
        walkTime: parseInt(editWalkTime, 10) || 15
      })
      setEditingPresetId(null)
    }
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingPresetId(null)
  }

  // Confirm delete
  const confirmDelete = (presetId, presetName) => {
    if (window.confirm(`Delete "${presetName}"?`)) {
      onDeletePreset(presetId)
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>Settings</h2>
        <button className="back-button" onClick={onClose}>
          &larr; Back
        </button>
      </div>

      <div className="settings-content">
        {/* API Key Section */}
        <div className="settings-section">
          <h3>WMATA API Key</h3>
          <p className="settings-help">
            Get your free key from{' '}
            <a href="https://developer.wmata.com" target="_blank" rel="noopener noreferrer">
              developer.wmata.com
            </a>
          </p>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
          />
          <div className="button-row">
            <button className="save-button" onClick={handleSaveApiKey}>
              {saved ? 'Saved!' : 'Save Key'}
            </button>
            {apiKey && (
              <button className="clear-button" onClick={handleClearApiKey}>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Walk Time Section */}
        <div className="settings-section">
          <h3>Walk Time</h3>
          <p className="settings-help">
            Highlight trains arriving around this many minutes away
          </p>
          <div className="walk-time-input">
            <input
              type="number"
              value={walkTime}
              onChange={(e) => onWalkTimeChange(parseInt(e.target.value) || 15)}
              min="1"
              max="60"
            />
            <span className="walk-time-unit">minutes</span>
          </div>
        </div>

        {/* Time Window Section */}
        <div className="settings-section">
          <h3>Schedule Window</h3>
          <p className="settings-help">
            Show trains up to this many minutes ahead (includes scheduled trains)
          </p>
          <div className="time-window-buttons">
            {[30, 60, 90].map(mins => (
              <button
                key={mins}
                className={`time-window-button ${timeWindow === mins ? 'active' : ''}`}
                onClick={() => onTimeWindowChange(mins)}
              >
                {mins} min
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Data Section */}
        <div className="settings-section">
          <h3>Schedule Data</h3>
          <p className="settings-help">
            GTFS schedule data for showing trains beyond live predictions
          </p>
          <div className="schedule-info">
            <div className="schedule-timestamp">
              <span className="schedule-label">Last updated:</span>
              <span className="schedule-value">{formatLastUpdated(gtfsLastUpdated)}</span>
            </div>
          </div>
          <button
            className="reload-schedule-button"
            onClick={handleReloadSchedule}
            disabled={gtfsReloading}
          >
            {gtfsReloading ? 'Reloading...' : 'Reload Schedule Data'}
          </button>
        </div>

        {/* Saved Presets Section */}
        <div className="settings-section">
          <h3>Saved Presets</h3>
          <p className="settings-help">
            Switch between presets on the home screen
          </p>
          {presets.length === 0 ? (
            <p className="no-presets">No presets saved yet. Select a station and tap "Save as Preset".</p>
          ) : (
            <div className="presets-list">
              {presets.map(preset => (
                <div key={preset.id} className="preset-card">
                  {editingPresetId === preset.id ? (
                    <div className="preset-edit-form">
                      <div className="edit-field">
                        <label>Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          maxLength={30}
                        />
                      </div>
                      <div className="edit-field">
                        <label>Walk Time</label>
                        <div className="walk-time-edit">
                          <input
                            type="number"
                            value={editWalkTime}
                            onChange={(e) => setEditWalkTime(e.target.value)}
                            min="1"
                            max="60"
                          />
                          <span>min</span>
                        </div>
                      </div>
                      <div className="edit-actions">
                        <button className="edit-save-btn" onClick={savePresetEdit}>Save</button>
                        <button className="edit-cancel-btn" onClick={cancelEdit}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="preset-info">
                        <div className="preset-name">{preset.name}</div>
                        <div className="preset-details">
                          {getStationName(preset.station)} &bull; {formatTrack(preset.track)} &bull; {formatLines(preset.lines)}
                        </div>
                        <div className="preset-walk-time">Walk time: {preset.walkTime || 15} min</div>
                      </div>
                      <div className="preset-actions">
                        <button className="preset-edit-btn" onClick={() => startEditingPreset(preset)}>Edit</button>
                        <button className="preset-delete-btn" onClick={() => confirmDelete(preset.id, preset.name)}>Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          {presets.length > 0 && (
            <button className="clear-defaults-button" onClick={onClearAllData}>
              Clear All Data
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
