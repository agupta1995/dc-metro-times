import JSZip from 'jszip'
import Papa from 'papaparse'
import { openDB } from 'idb'

const GTFS_URL = 'https://api.wmata.com/gtfs/rail-gtfs-static.zip'
const DB_NAME = 'metro-gtfs'
const DB_VERSION = 1
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Get API key for GTFS download
function getApiKey() {
  return localStorage.getItem('wmata_api_key') || import.meta.env.VITE_WMATA_API_KEY || ''
}

// Initialize IndexedDB
async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store for parsed GTFS data
      if (!db.objectStoreNames.contains('gtfs')) {
        db.createObjectStore('gtfs')
      }
      // Store for metadata (timestamp, etc.)
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta')
      }
    }
  })
}

// Check if GTFS data is cached and fresh
export async function isGTFSCached() {
  try {
    const db = await getDB()
    const timestamp = await db.get('meta', 'lastUpdated')
    if (!timestamp) return false
    return Date.now() - timestamp < CACHE_DURATION
  } catch {
    return false
  }
}

// Clear GTFS cache
export async function clearGTFSCache() {
  const db = await getDB()
  await db.clear('gtfs')
  await db.clear('meta')
}

// Parse a CSV file from the zip
function parseCSV(csvText) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error)
    })
  })
}

// Download and parse GTFS zip file
async function downloadAndParseGTFS() {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('API key not configured')

  const response = await fetch(GTFS_URL, {
    headers: { 'api_key': apiKey }
  })

  if (!response.ok) {
    throw new Error(`Failed to download GTFS: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)

  // Parse required files
  const [stopsText, stopTimesText, tripsText, routesText, calendarText, calendarDatesText] = await Promise.all([
    zip.file('stops.txt')?.async('string'),
    zip.file('stop_times.txt')?.async('string'),
    zip.file('trips.txt')?.async('string'),
    zip.file('routes.txt')?.async('string'),
    zip.file('calendar.txt')?.async('string'),
    zip.file('calendar_dates.txt')?.async('string')
  ])

  if (!stopsText || !stopTimesText || !tripsText) {
    throw new Error('Missing required GTFS files')
  }

  const [stops, stopTimes, trips, routes, calendar, calendarDates] = await Promise.all([
    parseCSV(stopsText),
    parseCSV(stopTimesText),
    parseCSV(tripsText),
    parseCSV(routesText),
    calendarText ? parseCSV(calendarText) : [],
    calendarDatesText ? parseCSV(calendarDatesText) : []
  ])

  return { stops, stopTimes, trips, routes, calendar, calendarDates }
}

// Build optimized lookup tables from GTFS data
function buildLookupTables(data) {
  const { stops, stopTimes, trips, routes, calendar, calendarDates } = data


  // Map stop_id to station info (parent_station or self)
  // WMATA uses platform-specific stop IDs, we need to map to station codes
  const stopToStation = {}
  const stationStops = {} // station_code -> [stop_ids]

  for (const stop of stops) {
    // Parent station has location_type = 1, platforms have parent_station
    const stationId = stop.parent_station || stop.stop_id
    stopToStation[stop.stop_id] = stationId

    if (!stationStops[stationId]) {
      stationStops[stationId] = []
    }
    if (!stationStops[stationId].includes(stop.stop_id)) {
      stationStops[stationId].push(stop.stop_id)
    }
  }

  // Map route_id to line code (e.g., "BLUE" -> "BL")
  // WMATA GTFS uses route_id like "BLUE", "RED", "ORANGE", etc.
  const lineMap = {
    'RED': 'RD',
    'ORANGE': 'OR',
    'YELLOW': 'YL',
    'GREEN': 'GR',
    'BLUE': 'BL',
    'SILVER': 'SV'
  }

  const routeToLine = {}
  for (const route of routes) {
    // Try route_id first (WMATA uses "BLUE", "RED", etc.)
    const routeIdUpper = route.route_id.toUpperCase()
    if (lineMap[routeIdUpper]) {
      routeToLine[route.route_id] = lineMap[routeIdUpper]
    } else {
      // Fallback to route_short_name or route_long_name
      const name = (route.route_short_name || route.route_long_name || '').toUpperCase()
      routeToLine[route.route_id] = lineMap[name] || 'XX'
    }
  }

  // Map trip_id to trip info
  const tripInfo = {}
  for (const trip of trips) {
    tripInfo[trip.trip_id] = {
      routeId: trip.route_id,
      serviceId: trip.service_id,
      directionId: trip.direction_id,
      headsign: trip.trip_headsign || ''
    }
  }

  // Build service calendar (which service_ids run on which days)
  const serviceCalendar = {}
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

  for (const cal of calendar) {
    serviceCalendar[cal.service_id] = {
      days: dayNames.map((day, i) => cal[day] === '1' ? i : -1).filter(d => d >= 0),
      startDate: cal.start_date,
      endDate: cal.end_date
    }
  }

  // Calendar exceptions (additions and removals)
  const calendarExceptions = {}
  for (const ex of calendarDates) {
    if (!calendarExceptions[ex.service_id]) {
      calendarExceptions[ex.service_id] = { added: [], removed: [] }
    }
    if (ex.exception_type === '1') {
      calendarExceptions[ex.service_id].added.push(ex.date)
    } else if (ex.exception_type === '2') {
      calendarExceptions[ex.service_id].removed.push(ex.date)
    }
  }

  // Group stop_times by stop_id for faster lookup
  const stopTimesByStop = {}
  for (const st of stopTimes) {
    const stationId = stopToStation[st.stop_id]
    if (!stopTimesByStop[stationId]) {
      stopTimesByStop[stationId] = []
    }
    stopTimesByStop[stationId].push({
      tripId: st.trip_id,
      arrivalTime: st.arrival_time,
      departureTime: st.departure_time,
      stopId: st.stop_id,
      stopSequence: parseInt(st.stop_sequence, 10)
    })
  }

  return {
    stopToStation,
    stationStops,
    routeToLine,
    tripInfo,
    serviceCalendar,
    calendarExceptions,
    stopTimesByStop
  }
}

// Load GTFS data (from cache or download)
export async function loadGTFSData() {
  const db = await getDB()

  // Check cache first
  if (await isGTFSCached()) {
    const cached = await db.get('gtfs', 'lookupTables')
    if (cached) return cached
  }

  // Download and parse fresh data
  const rawData = await downloadAndParseGTFS()
  const lookupTables = buildLookupTables(rawData)

  // Cache the lookup tables
  await db.put('gtfs', lookupTables, 'lookupTables')
  await db.put('meta', Date.now(), 'lastUpdated')

  return lookupTables
}

// Parse time string (HH:MM:SS) to minutes since midnight
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

// Get today's date as YYYYMMDD
function getTodayString() {
  const now = new Date()
  return now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0')
}

// Check if a service runs today
function serviceRunsToday(serviceId, lookupTables) {
  const { serviceCalendar, calendarExceptions } = lookupTables
  const today = getTodayString()
  const dayOfWeek = new Date().getDay()

  const service = serviceCalendar[serviceId]
  const exceptions = calendarExceptions[serviceId] || { added: [], removed: [] }

  // Check exceptions first
  if (exceptions.removed.includes(today)) return false
  if (exceptions.added.includes(today)) return true

  // If no base calendar exists (WMATA uses only calendar_dates.txt),
  // the service doesn't run today unless it was in the "added" exceptions above
  if (!service) return false

  // Check date range
  if (today < service.startDate || today > service.endDate) return false

  // Check day of week
  return service.days.includes(dayOfWeek)
}

// Get scheduled trains for a station
export async function getScheduledTrains(stationCode, minutesAhead = 90) {
  const lookupTables = await loadGTFSData()
  const { stopTimesByStop, tripInfo, routeToLine, stationStops, stopToStation, serviceCalendar, calendarExceptions } = lookupTables

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const maxMinutes = currentMinutes + minutesAhead

  // Find all stop_ids for this station (including platforms)
  // stationCode might be comma-separated for multi-platform stations (e.g., "A01,C01" for Metro Center)
  const stationCodes = stationCode.split(',')
  const allStopTimes = []

  // For transfer stations, WMATA GTFS uses combined IDs like "STN_A01_C01"
  // So we need to try both individual codes AND the combined format
  const gtfsIdsToTry = []

  // Add individual station codes
  for (const code of stationCodes) {
    gtfsIdsToTry.push(`STN_${code.trim()}`)
  }

  // If multiple codes, also try combined format (e.g., "A01,C01" -> "STN_A01_C01")
  if (stationCodes.length > 1) {
    const combinedId = `STN_${stationCodes.map(c => c.trim()).join('_')}`
    gtfsIdsToTry.push(combinedId)
    // Also try reverse order (e.g., "STN_C01_A01")
    const reversedId = `STN_${stationCodes.map(c => c.trim()).reverse().join('_')}`
    gtfsIdsToTry.push(reversedId)
  }

  for (const gtfsStopId of gtfsIdsToTry) {
    // Try the GTFS stop ID format
    const stopTimes = stopTimesByStop[gtfsStopId] || []
    allStopTimes.push(...stopTimes)

    // Also check if this code maps to stops
    const relatedStops = stationStops[gtfsStopId] || []
    for (const stopId of relatedStops) {
      const times = stopTimesByStop[stopId] || []
      allStopTimes.push(...times)
    }
  }

  // Filter and transform stop times
  const scheduledTrains = []
  const seenTrips = new Set()

  for (const st of allStopTimes) {
    // Skip if we've already processed this trip
    if (seenTrips.has(st.tripId)) continue

    const trip = tripInfo[st.tripId]
    if (!trip) continue

    // Check if service runs today
    if (!serviceRunsToday(trip.serviceId, lookupTables)) continue

    const arrivalMinutes = parseTimeToMinutes(st.arrivalTime)
    if (arrivalMinutes === null) continue

    // Handle times past midnight (e.g., 25:30 means 1:30 AM next day)
    let adjustedArrival = arrivalMinutes
    if (arrivalMinutes >= 24 * 60) {
      // This is for the next day, skip if we're not close to midnight
      if (currentMinutes > 120) continue // Only show if it's before 2 AM
      adjustedArrival = arrivalMinutes - 24 * 60
    }

    const minutesAway = adjustedArrival - currentMinutes

    // Filter by time window
    if (minutesAway < -5 || minutesAway > minutesAhead) continue

    seenTrips.add(st.tripId)

    // Format scheduled time
    const arrivalDate = new Date()
    arrivalDate.setHours(Math.floor(adjustedArrival / 60))
    arrivalDate.setMinutes(adjustedArrival % 60)
    const scheduledTime = arrivalDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    // Normalize destination to match live train format
    // GTFS uses "FRANCONIA-SPRINGFIELD" but live uses "Franconia"
    let destination = trip.headsign || 'Unknown'
    destination = destination
      .replace(/-SPRINGFIELD/i, '')
      .replace(/-GMU/i, '')
      .replace(/FAIRFAX-/i, '')
      .replace(/DOWNTOWN /i, '')
      .split('-')[0] // Take first part before any remaining hyphen
      .trim()
    // Title case
    destination = destination.charAt(0).toUpperCase() + destination.slice(1).toLowerCase()

    scheduledTrains.push({
      Line: routeToLine[trip.routeId] || 'XX',
      Destination: destination,
      Min: minutesAway <= 0 ? 'ARR' : Math.round(minutesAway).toString(),
      scheduledTime,
      minutesAway: Math.round(minutesAway),
      Group: trip.directionId === '0' ? '1' : '2', // Map direction to track
      Car: null, // Not available in schedule
      type: 'scheduled'
    })
  }

  // Sort by arrival time
  scheduledTrains.sort((a, b) => a.minutesAway - b.minutesAway)

  return scheduledTrains
}

// Get the last time GTFS was updated
export async function getGTFSLastUpdated() {
  try {
    const db = await getDB()
    const timestamp = await db.get('meta', 'lastUpdated')
    return timestamp ? new Date(timestamp) : null
  } catch {
    return null
  }
}
