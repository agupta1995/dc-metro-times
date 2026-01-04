import { LINE_COLORS } from '../utils/api'
import './TrainCard.css'

export function TrainCard({ train, walkTime = 15 }) {
  const minutes = train.Min
  const isNumber = !isNaN(parseInt(minutes))
  const minValue = isNumber ? parseInt(minutes) : 0

  const isInWalkWindow = isNumber && minValue >= walkTime - 2 && minValue <= walkTime + 2
  const isArriving = minutes === 'ARR' || minutes === 'BRD'
  const isLeaving = isNumber && minValue < walkTime - 2

  let cardClass = 'train-card'
  if (isInWalkWindow) cardClass += ' walk-now'
  if (isArriving) cardClass += ' arriving'
  if (isLeaving && minValue < 5) cardClass += ' leaving-soon'

  return (
    <div className={cardClass}>
      <div
        className="train-line-indicator"
        style={{ backgroundColor: LINE_COLORS[train.Line] || '#666' }}
      >
        {train.Line || '—'}
      </div>
      <div className="train-info">
        <div className="train-destination">{train.Destination || 'Unknown'}</div>
        <div className="train-cars">{train.Car ? `${train.Car} cars` : ''}</div>
      </div>
      <div className="train-time">
        {isArriving ? (
          <span className="arriving-text">{minutes}</span>
        ) : isNumber ? (
          <>
            <span className="minutes-value">{minutes}</span>
            <span className="minutes-label">min</span>
          </>
        ) : (
          <span className="minutes-value">{minutes || '—'}</span>
        )}
      </div>
      {isInWalkWindow && (
        <div className="walk-indicator">Leave now!</div>
      )}
    </div>
  )
}
