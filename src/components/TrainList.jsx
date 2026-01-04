import { TrainCard } from './TrainCard'
import './TrainList.css'

function getTrackLabel(trains) {
  // Get unique destinations for this track to use as label
  const destinations = [...new Set(trains.map(t => t.Destination).filter(Boolean))]
  if (destinations.length === 0) return 'Unknown'
  if (destinations.length <= 2) return destinations.join(' / ')
  return destinations.slice(0, 2).join(' / ') + '...'
}

export function TrainList({
  trains,
  loading,
  error,
  lastUpdated,
  selectedLines,
  selectedTrack,
  walkTime,
  onRefresh
}) {
  // Filter by selected lines (if any selected)
  let filteredTrains = selectedLines.length > 0
    ? trains.filter(train => selectedLines.includes(train.Line))
    : trains

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

  if (!trains.length) {
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
        {lastUpdated && (
          <span className="last-updated">
            Updated: {lastUpdated.toLocaleTimeString()}
            {loading && <span className="updating"> (updating...)</span>}
          </span>
        )}
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
