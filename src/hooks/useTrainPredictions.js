import { useState, useEffect, useCallback } from 'react'
import { getPredictions } from '../utils/api'

export function useTrainPredictions(stationCode, refreshInterval = 30000) {
  const [trains, setTrains] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchPredictions = useCallback(async () => {
    if (!stationCode) {
      setTrains([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getPredictions(stationCode)
      // Add type: 'live' to distinguish from scheduled trains
      setTrains(data.map(train => ({ ...train, type: 'live' })))
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [stationCode])

  useEffect(() => {
    fetchPredictions()

    if (stationCode && refreshInterval > 0) {
      const interval = setInterval(fetchPredictions, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [stationCode, refreshInterval, fetchPredictions])

  return { trains, loading, error, lastUpdated, refresh: fetchPredictions }
}
