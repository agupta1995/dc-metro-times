import { LINE_COLORS } from '../utils/api'
import './TrainCard.css'

// Calculate arrival time from minutes
function getArrivalTime(minutes, scheduledTime) {
  // If we have a scheduled time, use it
  if (scheduledTime) return scheduledTime

  // Calculate from current time + minutes
  const minValue = parseInt(minutes)
  if (isNaN(minValue)) return null

  const arrival = new Date()
  arrival.setMinutes(arrival.getMinutes() + minValue)
  return arrival.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export function TrainCard({ train, walkTime = 15 }) {
  const minutes = train.Min
  const isNumber = !isNaN(parseInt(minutes))
  const minValue = isNumber ? parseInt(minutes) : 0
  const isScheduled = train.type === 'scheduled'
  const arrivalTime = getArrivalTime(minutes, train.scheduledTime)

  // Only apply walk window highlighting to live trains
  const isInWalkWindow = !isScheduled && isNumber && minValue >= walkTime - 2 && minValue <= walkTime + 2
  const isArriving = minutes === 'ARR' || minutes === 'BRD'
  const isLeaving = isNumber && minValue < walkTime - 2

  let cardClass = 'train-card'
  if (isScheduled) cardClass += ' scheduled'
  if (isInWalkWindow) cardClass += ' walk-now'
  if (isArriving) cardClass += ' arriving'
  if (isLeaving && minValue < 5) cardClass += ' leaving-soon'

  return (
    <div className={cardClass}>
      <div
        className="train-line-indicator"
        style={{
          backgroundColor: LINE_COLORS[train.Line] || '#666',
          opacity: isScheduled ? 0.7 : 1
        }}
      >
        {train.Line || '—'}
      </div>
      <div className="train-info">
        <div className="train-destination">{train.Destination || 'Unknown'}</div>
        <div className="train-cars">
          {train.Car ? `${train.Car} cars` : ''}
        </div>
      </div>
      <div className="train-time">
        {isArriving ? (
          <span className="arriving-text">{minutes}</span>
        ) : isNumber ? (
          <>
            <span className="minutes-value">{isScheduled ? '~' : ''}{minutes}</span>
            <span className="minutes-label">min</span>
            {arrivalTime && <span className="arrival-time">{arrivalTime}</span>}
          </>
        ) : (
          <span className="minutes-value">{minutes || '—'}</span>
        )}
      </div>
      {isInWalkWindow && (
        <div className="walk-indicator">Leave now!</div>
      )}
      {isScheduled && (
        <div className="scheduled-badge">SCHED</div>
      )}
      {!isScheduled && train.type === 'live' && (
        <div className="live-badge">LIVE</div>
      )}
    </div>
  )
}
