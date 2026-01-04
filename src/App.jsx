import { useState, useEffect, useCallback } from 'react'
import { StationSelector } from './components/StationSelector'
import { TrainList } from './components/TrainList'
import { Settings } from './components/Settings'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useTrainPredictions } from './hooks/useTrainPredictions'
import { getStations, groupStationsByName } from './utils/api'
import './App.css'

// Mock data for testing UI without API key
// Includes duplicate entries for multi-platform stations like Metro Center
const MOCK_STATIONS = [
  { Code: 'C02', Name: 'McPherson Square', LineCode1: 'BL', LineCode2: 'OR', LineCode3: 'SV' },
  // Metro Center has 2 platforms - Red Line and Blue/Orange/Silver
  { Code: 'C01', Name: 'Metro Center', LineCode1: 'BL', LineCode2: 'OR', LineCode3: 'SV' },
  { Code: 'A01', Name: 'Metro Center', LineCode1: 'RD' },
  { Code: 'B01', Name: 'Farragut North', LineCode1: 'RD' },
  { Code: 'C03', Name: 'Farragut West', LineCode1: 'BL', LineCode2: 'OR', LineCode3: 'SV' },
  // L'Enfant Plaza has 2 platforms
  { Code: 'D03', Name: "L'Enfant Plaza", LineCode1: 'BL', LineCode2: 'OR', LineCode3: 'SV' },
  { Code: 'F03', Name: "L'Enfant Plaza", LineCode1: 'GR', LineCode2: 'YL' },
  { Code: 'N12', Name: 'Ashburn', LineCode1: 'SV' },
  { Code: 'K01', Name: 'Court House', LineCode1: 'SV', LineCode2: 'OR' },
  { Code: 'D02', Name: 'Smithsonian', LineCode1: 'BL', LineCode2: 'OR', LineCode3: 'SV' },
  // Gallery Place also has 2 platforms
  { Code: 'B01', Name: 'Gallery Pl-Chinatown', LineCode1: 'RD' },
  { Code: 'F01', Name: 'Gallery Pl-Chinatown', LineCode1: 'GR', LineCode2: 'YL' },
]

const MOCK_TRAINS = [
  // Track 1 - Westbound (to Virginia)
  { Line: 'SV', Destination: 'Ashburn', Min: '3', Car: '8', Group: '1' },
  { Line: 'OR', Destination: 'Vienna', Min: '7', Car: '6', Group: '1' },
  { Line: 'SV', Destination: 'Ashburn', Min: '15', Car: '8', Group: '1' },
  { Line: 'BL', Destination: 'Franconia', Min: '18', Car: '8', Group: '1' },
  // Track 2 - Eastbound (to Maryland)
  { Line: 'SV', Destination: 'Downtown Largo', Min: '2', Car: '6', Group: '2' },
  { Line: 'BL', Destination: 'New Carrollton', Min: '8', Car: '8', Group: '2' },
  { Line: 'OR', Destination: 'New Carrollton', Min: 'ARR', Car: '6', Group: '2' },
]

function App() {
  const [demoMode, setDemoMode] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [stations, setStations] = useState([])
  const [defaults, setDefaults] = useLocalStorage('metro_defaults', {
    station: null,
    lines: [],
    track: null
  })
  const [walkTime, setWalkTime] = useLocalStorage('metro_walk_time', 15)

  const [selectedStation, setSelectedStation] = useState(defaults.station)
  const [selectedLines, setSelectedLines] = useState(defaults.lines || [])
  const [selectedTrack, setSelectedTrack] = useState(defaults.track)

  // Load stations for Settings page display
  useEffect(() => {
    if (demoMode) {
      setStations(groupStationsByName(MOCK_STATIONS))
    } else {
      getStations()
        .then(data => setStations(groupStationsByName(data)))
        .catch(() => setStations([]))
    }
  }, [demoMode])

  // Real API hook (disabled in demo mode)
  const {
    trains: realTrains,
    loading,
    error,
    lastUpdated,
    refresh
  } = useTrainPredictions(demoMode ? null : selectedStation)

  // Use mock or real data
  const trains = demoMode ? MOCK_TRAINS : realTrains
  const displayLoading = demoMode ? false : loading
  const displayError = demoMode ? null : error
  const displayLastUpdated = demoMode ? new Date() : lastUpdated

  const handleSaveDefaults = () => {
    setDefaults({
      station: selectedStation,
      lines: selectedLines,
      track: selectedTrack
    })
  }

  const handleClearDefaults = () => {
    setDefaults({ station: null, lines: [], track: null })
    setSelectedStation(null)
    setSelectedLines([])
    setSelectedTrack(null)
    localStorage.removeItem('wmata_api_key')
  }

  // Memoize the lines change handler to prevent infinite loops
  const handleLinesChange = useCallback((newLines) => {
    setSelectedLines(newLines)
  }, [])

  // Check if API key exists to auto-disable demo mode
  useEffect(() => {
    const apiKey = localStorage.getItem('wmata_api_key') || import.meta.env.VITE_WMATA_API_KEY
    if (apiKey) {
      setDemoMode(false)
    }
  }, [])

  // Show Settings page
  if (showSettings) {
    return (
      <div className="app">
        <Settings
          walkTime={walkTime}
          onWalkTimeChange={setWalkTime}
          onClearDefaults={handleClearDefaults}
          savedDefaults={defaults}
          stations={stations}
          onClose={() => setShowSettings(false)}
        />
      </div>
    )
  }

  // Show main app
  return (
    <div className="app">
      <header className="app-header">
        <h1>DC Metro Times</h1>
        <div className="header-actions">
          <button
            className={`demo-toggle ${demoMode ? 'active' : ''}`}
            onClick={() => setDemoMode(!demoMode)}
          >
            {demoMode ? 'Demo Mode' : 'Live Mode'}
          </button>
          <button
            className="settings-button"
            onClick={() => setShowSettings(true)}
          >
            Settings
          </button>
        </div>
      </header>

      {demoMode && (
        <div className="demo-banner">
          Demo Mode - Showing sample data. Add your WMATA API key in Settings for live data.
        </div>
      )}

      <main className="app-main">
        <StationSelector
          selectedStation={selectedStation}
          selectedLines={selectedLines}
          selectedTrack={selectedTrack}
          onStationChange={setSelectedStation}
          onLinesChange={handleLinesChange}
          onTrackChange={setSelectedTrack}
          onSaveDefaults={handleSaveDefaults}
          demoMode={demoMode}
          mockStations={MOCK_STATIONS}
        />

        <TrainList
          trains={trains}
          loading={displayLoading}
          error={displayError}
          lastUpdated={displayLastUpdated}
          selectedLines={selectedLines}
          selectedTrack={selectedTrack}
          walkTime={walkTime}
          onRefresh={refresh}
        />
      </main>
    </div>
  )
}

export default App
