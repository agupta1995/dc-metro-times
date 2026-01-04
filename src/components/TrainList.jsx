import { TrainCard } from './TrainCard'
import './TrainList.css'

function getTrackLabel(trains) {
  // Get unique destinations for this track to use as label
  const destinations = [...new Set(trains.map(t => t.Destination).filter(Boolean))]
  if (destinations.length === 0) return 'Unknown'
  if (destinations.length <= 2) return destinations.join(' / ')
  return destinations.slice(0, 2).join(' / ') + '...'
}

// Convert Min field to numeric minutes for sorting
function getMinutesValue(train) {
  if (train.minutesAway !== undefined) return train.minutesAway
  if (train.Min === 'ARR' || train.Min === 'BRD') return 0
  if (train.Min === '' || train.Min === '---') return 999
  return parseInt(train.Min, 10) || 999
}

// Normalize destination name for comparison
function normalizeDestination(dest) {
  if (!dest) return ''
  return dest
    .toUpperCase()
    .replace(/-/g, ' ')
    .replace(/SPRINGFIELD/g, '')
    .replace(/FAIRFAX/g, '')
    .replace(/GMU/g, '')
    .replace(/DOWNTOWN/g, '')
    .replace(/NEW/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')[0] // Just take first word: FRANCONIA, VIENNA, ASHBURN, etc.
}

// Remove scheduled duplicates that have live predictions
function mergeTrains(liveTrains, scheduledTrains) {
  // If we have live trains, filter out scheduled trains in the live window (0-25 min)
  // Live data is typically accurate for ~20-25 minutes out
  const liveWindowMinutes = 25

  // Create a set of live train identifiers (line + normalized destination + approximate time)
  const liveTimes = new Set()
  for (const train of liveTrains) {
    const mins = getMinutesValue(train)
    const normDest = normalizeDestination(train.Destination)
    // Create windows around live train times to match scheduled
    for (let offset = -5; offset <= 5; offset++) {
      liveTimes.add(`${train.Line}-${normDest}-${mins + offset}`)
    }
  }

  // Filter out scheduled trains that:
  // 1. Fall within the live data window (< 25 min) when we have live data
  // 2. Match a live train by line + destination + time
  const filteredScheduled = scheduledTrains.filter(train => {
    const mins = getMinutesValue(train)
    const normDest = normalizeDestination(train.Destination)

    // If within live window and we have live trains, skip scheduled
    if (liveTrains.length > 0 && mins < liveWindowMinutes) {
      return false
    }

    // Check for duplicates by line + normalized destination + time
    const key = `${train.Line}-${normDest}-${mins}`
    return !liveTimes.has(key)
  })

  // Combine and sort by time
  const combined = [...liveTrains, ...filteredScheduled]
  combined.sort((a, b) => getMinutesValue(a) - getMinutesValue(b))

  return combined
}

export function TrainList({
  trains,
  scheduledTrains = [],
  loading,
  scheduledLoading,
  error,
  lastUpdated,
  selectedLines,
  selectedTrack,
  walkTime,
  timeWindow,
  onRefresh
}) {
  // Merge live and scheduled trains
  const allTrains = mergeTrains(trains, scheduledTrains)

  // Filter by selected lines (if any selected)
  let filteredTrains = selectedLines.length > 0
    ? allTrains.filter(train => selectedLines.includes(train.Line))
    : allTrains

  // Filter by track if selected
  if (selectedTrack) {
    filteredTrains = filteredTrains.filter(train => train.Group === selectedTrack)
  }

  // Group trains by track
  const track1Trains = filteredTrains.filter(t => t.Group === '1')
  const track2Trains = filteredTrains.filter(t => t.Group === '2')

  // Show single track or both based on filter
  const showTrack1 = !selectedTrack || selectedTrack === '1'
  const showTrack2 = !selectedTrack || selectedTrack === '2'

  if (error) {
    return (
      <div className="train-list-error">
        <p>Error loading trains: {error}</p>
        <button onClick={onRefresh}>Retry</button>
      </div>
    )
  }

  if (loading && trains.length === 0) {
    return (
      <div className="train-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading train times...</p>
      </div>
    )
  }

  if (scheduledLoading && trains.length === 0 && scheduledTrains.length === 0) {
    return (
      <div className="train-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading schedule data...</p>
      </div>
    )
  }

  if (!allTrains.length) {
    return (
      <div className="train-list-empty">
        <p>Select a station to see train times</p>
      </div>
    )
  }

  if (!filteredTrains.length) {
    return (
      <div className="train-list-empty">
        <p>No trains matching your filters</p>
      </div>
    )
  }

  return (
    <div className="train-list">
      <div className="train-list-header">
        <h2>Upcoming Trains</h2>
        <div className="status-info">
          {lastUpdated && (
            <span className="last-updated">
              Updated: {lastUpdated.toLocaleTimeString()}
              {loading && <span className="updating"> (updating...)</span>}
            </span>
          )}
          <span className="schedule-status">
            {scheduledLoading ? '⏳ Loading schedule...' :
             scheduledTrains.length > 0 ? `📅 ${scheduledTrains.length} scheduled` :
             '📅 No scheduled trains'}
          </span>
        </div>
      </div>

      <div className="track-groups">
        {showTrack1 && track1Trains.length > 0 && (
          <div className="track-group">
            <div className="track-header">
              <span className="track-label">Track 1</span>
              <span className="track-destinations">{getTrackLabel(track1Trains)}</span>
            </div>
            <div className="trains">
              {track1Trains.map((train, index) => (
                <TrainCard key={`t1-${index}`} train={train} walkTime={walkTime} />
              ))}
            </div>
          </div>
        )}

        {showTrack2 && track2Trains.length > 0 && (
          <div className="track-group">
            <div className="track-header">
              <span className="track-label">Track 2</span>
              <span className="track-destinations">{getTrackLabel(track2Trains)}</span>
            </div>
            <div className="trains">
              {track2Trains.map((train, index) => (
                <TrainCard key={`t2-${index}`} train={train} walkTime={walkTime} />
              ))}
            </div>
          </div>
        )}

        {showTrack1 && track1Trains.length === 0 && selectedTrack === '1' && (
          <div className="train-list-empty">
            <p>No trains on Track 1 matching your filters</p>
          </div>
        )}

        {showTrack2 && track2Trains.length === 0 && selectedTrack === '2' && (
          <div className="train-list-empty">
            <p>No trains on Track 2 matching your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
