import { useState, useEffect, useCallback } from 'react'
import { getScheduledTrains, loadGTFSData, getGTFSLastUpdated, isGTFSCached } from '../utils/gtfs'

export function useScheduledTrains(stationCode, minutesAhead = 90) {
  const [scheduledTrains, setScheduledTrains] = useState([])
  const [loading, setLoading] = useState(false)
  const [gtfsLoading, setGtfsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Load GTFS data in background on mount
  useEffect(() => {
    async function preloadGTFS() {
      const cached = await isGTFSCached()
      if (!cached) {
        setGtfsLoading(true)
        try {
          await loadGTFSData()
          const updated = await getGTFSLastUpdated()
          setLastUpdated(updated)
        } catch (err) {
          console.error('Failed to load GTFS:', err)
          setError(err.message)
        } finally {
          setGtfsLoading(false)
        }
      } else {
        const updated = await getGTFSLastUpdated()
        setLastUpdated(updated)
      }
    }
    preloadGTFS()
  }, [])

  const fetchScheduledTrains = useCallback(async () => {
    if (!stationCode) {
      setScheduledTrains([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getScheduledTrains(stationCode, minutesAhead)
      setScheduledTrains(data)
    } catch (err) {
      console.error('Error fetching scheduled trains:', err)
      setError(err.message)
      setScheduledTrains([])
    } finally {
      setLoading(false)
    }
  }, [stationCode, minutesAhead])

  // Fetch scheduled trains when station or time window changes
  useEffect(() => {
    fetchScheduledTrains()
  }, [fetchScheduledTrains])

  // Recalculate every minute (since minutesAway changes)
  useEffect(() => {
    if (!stationCode) return

    const interval = setInterval(fetchScheduledTrains, 60000)
    return () => clearInterval(interval)
  }, [stationCode, fetchScheduledTrains])

  return {
    scheduledTrains,
    loading: loading || gtfsLoading,
    gtfsLoading,
    error,
    lastUpdated,
    refresh: fetchScheduledTrains
  }
}
