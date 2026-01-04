import { useState, useEffect } from 'react'
import { getStations, groupStationsByName, LINE_COLORS, LINE_NAMES } from '../utils/api'
import './StationSelector.css'

const ALL_LINES = ['RD', 'OR', 'YL', 'GR', 'BL', 'SV']

export function StationSelector({
  selectedStation,
  selectedLines,
  selectedTrack,
  onStationChange,
  onLinesChange,
  onTrackChange,
  onSaveDefaults,
  demoMode = false,
  mockStations = []
}) {
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (demoMode) {
      // Group mock stations too for consistency
      setStations(groupStationsByName(mockStations))
      return
    }

    async function loadStations() {
      setLoading(true)
      setError(null)
      try {
        const data = await getStations()
        // Group stations by name to combine multi-platform stations
        const grouped = groupStationsByName(data)
        setStations(grouped)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadStations()
  }, [demoMode, mockStations])

  // Get the selected station's data to determine available lines
  const currentStation = stations.find(s => s.Code === selectedStation)

  // Get available lines for the selected station
  const availableLines = currentStation
    ? ALL_LINES.filter(line =>
        currentStation.LineCode1 === line ||
        currentStation.LineCode2 === line ||
        currentStation.LineCode3 === line ||
        currentStation.LineCode4 === line
      )
    : []

  // Clear line filters if they're no longer available at the new station
  useEffect(() => {
    if (selectedLines.length > 0 && availableLines.length > 0) {
      const validLines = selectedLines.filter(line => availableLines.includes(line))
      if (validLines.length !== selectedLines.length) {
        onLinesChange(validLines)
      }
    }
  }, [selectedStation, availableLines, selectedLines, onLinesChange])

  const handleLineToggle = (line) => {
    if (selectedLines.includes(line)) {
      // Remove line
      onLinesChange(selectedLines.filter(l => l !== line))
    } else {
      // Add line
      onLinesChange([...selectedLines, line])
    }
  }

  if (error && !demoMode) {
    return <div className="selector-error">Error loading stations: {error}</div>
  }

  return (
    <div className="station-selector">
      {/* Station dropdown */}
      <div className="station-dropdown">
        <label htmlFor="station-select">Station</label>
        <select
          id="station-select"
          value={selectedStation || ''}
          onChange={(e) => onStationChange(e.target.value || null)}
          disabled={loading}
        >
          <option value="">Select a station</option>
          {stations
            .sort((a, b) => a.Name.localeCompare(b.Name))
            .map(station => (
              <option key={station.Code} value={station.Code}>
                {station.Name}
              </option>
            ))}
        </select>
      </div>

      {/* Track filter */}
      {selectedStation && (
        <div className="track-filter">
          <label>Track</label>
          <div className="track-buttons">
            <button
              className={`track-button ${!selectedTrack ? 'active' : ''}`}
              onClick={() => onTrackChange(null)}
            >
              All
            </button>
            <button
              className={`track-button ${selectedTrack === '1' ? 'active' : ''}`}
              onClick={() => onTrackChange(selectedTrack === '1' ? null : '1')}
            >
              Track 1
            </button>
            <button
              className={`track-button ${selectedTrack === '2' ? 'active' : ''}`}
              onClick={() => onTrackChange(selectedTrack === '2' ? null : '2')}
            >
              Track 2
            </button>
          </div>
        </div>
      )}

      {/* Line filter buttons - multi-select */}
      {selectedStation && availableLines.length > 0 && (
        <div className="line-filter">
          <label>Filter by Line <span className="filter-hint">(multi-select)</span></label>
          <div className="line-buttons">
            <button
              className={`line-button all-button ${selectedLines.length === 0 ? 'active' : ''}`}
              onClick={() => onLinesChange([])}
            >
              All
            </button>
            {availableLines.map(line => (
              <button
                key={line}
                className={`line-button ${selectedLines.includes(line) ? 'active' : ''}`}
                style={{
                  '--line-color': LINE_COLORS[line],
                  backgroundColor: selectedLines.includes(line) ? LINE_COLORS[line] : 'transparent',
                  borderColor: LINE_COLORS[line],
                  color: selectedLines.includes(line) ? '#fff' : LINE_COLORS[line]
                }}
                onClick={() => handleLineToggle(line)}
              >
                {LINE_NAMES[line]}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedStation && (
        <button className="save-defaults-button" onClick={onSaveDefaults}>
          Save as Default
        </button>
      )}
    </div>
  )
}
