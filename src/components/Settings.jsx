import { useState } from 'react'
import { LINE_NAMES } from '../utils/api'
import './Settings.css'

export function Settings({
  walkTime,
  onWalkTimeChange,
  onClearDefaults,
  savedDefaults,
  stations,
  onClose
}) {
  const [apiKey, setApiKey] = useState(localStorage.getItem('wmata_api_key') || '')
  const [saved, setSaved] = useState(false)

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

        {/* Saved Defaults Section */}
        <div className="settings-section">
          <h3>Saved Defaults</h3>
          <p className="settings-help">
            These settings are loaded when you open the app
          </p>
          <div className="defaults-display">
            <div className="default-item">
              <span className="default-label">Station</span>
              <span className="default-value">{getStationName(savedDefaults?.station)}</span>
            </div>
            <div className="default-item">
              <span className="default-label">Track</span>
              <span className="default-value">{formatTrack(savedDefaults?.track)}</span>
            </div>
            <div className="default-item">
              <span className="default-label">Lines</span>
              <span className="default-value">{formatLines(savedDefaults?.lines)}</span>
            </div>
          </div>
          <button className="clear-defaults-button" onClick={onClearDefaults}>
            Clear All Defaults
          </button>
        </div>
      </div>
    </div>
  )
}
