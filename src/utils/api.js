const BASE_URL = 'https://api.wmata.com'

function getApiKey() {
  return localStorage.getItem('wmata_api_key') || import.meta.env.VITE_WMATA_API_KEY || ''
}

export async function getStations() {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('API key not configured')

  const response = await fetch(`${BASE_URL}/Rail.svc/json/jStations`, {
    headers: { 'api_key': apiKey }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch stations: ${response.status}`)
  }

  const data = await response.json()
  return data.Stations
}

// Group stations by name, combining multi-platform stations like Metro Center
export function groupStationsByName(stations) {
  const grouped = {}

  for (const station of stations) {
    const name = station.Name
    if (!grouped[name]) {
      grouped[name] = {
        Name: name,
        Codes: [station.Code],
        LineCode1: station.LineCode1,
        LineCode2: station.LineCode2,
        LineCode3: station.LineCode3,
        LineCode4: station.LineCode4
      }
    } else {
      // Add this station's code
      grouped[name].Codes.push(station.Code)
      // Merge line codes
      if (station.LineCode1 && !Object.values(grouped[name]).includes(station.LineCode1)) {
        if (!grouped[name].LineCode1) grouped[name].LineCode1 = station.LineCode1
        else if (!grouped[name].LineCode2) grouped[name].LineCode2 = station.LineCode1
        else if (!grouped[name].LineCode3) grouped[name].LineCode3 = station.LineCode1
        else if (!grouped[name].LineCode4) grouped[name].LineCode4 = station.LineCode1
      }
      if (station.LineCode2 && !Object.values(grouped[name]).includes(station.LineCode2)) {
        if (!grouped[name].LineCode2) grouped[name].LineCode2 = station.LineCode2
        else if (!grouped[name].LineCode3) grouped[name].LineCode3 = station.LineCode2
        else if (!grouped[name].LineCode4) grouped[name].LineCode4 = station.LineCode2
      }
      if (station.LineCode3 && !Object.values(grouped[name]).includes(station.LineCode3)) {
        if (!grouped[name].LineCode3) grouped[name].LineCode3 = station.LineCode3
        else if (!grouped[name].LineCode4) grouped[name].LineCode4 = station.LineCode3
      }
      if (station.LineCode4 && !Object.values(grouped[name]).includes(station.LineCode4)) {
        if (!grouped[name].LineCode4) grouped[name].LineCode4 = station.LineCode4
      }
    }
  }

  // Convert to array and create a combined Code string
  return Object.values(grouped).map(station => ({
    ...station,
    Code: station.Codes.join(',') // Comma-separated codes for API call
  }))
}

export async function getPredictions(stationCodes) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('API key not configured')

  // WMATA API accepts comma-separated station codes
  const response = await fetch(`${BASE_URL}/StationPrediction.svc/json/GetPrediction/${stationCodes}`, {
    headers: { 'api_key': apiKey }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch predictions: ${response.status}`)
  }

  const data = await response.json()
  return data.Trains
}

export const LINE_COLORS = {
  RD: '#BF0D3E',
  OR: '#ED8B00',
  YL: '#FFD100',
  GR: '#00B140',
  BL: '#009CDE',
  SV: '#919D9D'
}

export const LINE_NAMES = {
  RD: 'Red',
  OR: 'Orange',
  YL: 'Yellow',
  GR: 'Green',
  BL: 'Blue',
  SV: 'Silver'
}
