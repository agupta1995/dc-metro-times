# DC Metro Times

A React + Vite PWA for real-time Washington DC Metro train arrival times.

## Quick Reference

```bash
pnpm dev          # Start dev server at http://localhost:5173
pnpm build        # Production build to dist/
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
pnpm dlx vercel   # Deploy to Vercel
```

## Project Structure

```
src/
├── App.jsx                    # Main app, routing between main view and Settings
├── components/
│   ├── StationSelector.jsx    # Station dropdown, track filter, line multi-select
│   ├── TrainList.jsx          # Trains grouped by Track 1/Track 2
│   ├── TrainCard.jsx          # Individual train display with line color
│   └── Settings.jsx           # Full-page settings (API key, walk time, defaults)
├── hooks/
│   ├── useLocalStorage.js     # Persist state to localStorage
│   └── useTrainPredictions.js # Fetch train arrivals, auto-refresh 30s
└── utils/
    └── api.js                 # WMATA API calls, station grouping logic
```

## Key Concepts

### Multi-Platform Stations
Stations like Metro Center and L'Enfant Plaza have multiple platforms with different station codes. The `groupStationsByName()` function in `api.js` combines them into a single entry with comma-separated codes for API calls.

### WMATA API
- Predictions: `https://api.wmata.com/StationPrediction.svc/json/GetPrediction/{stationCodes}`
- Stations: `https://api.wmata.com/Rail.svc/json/jStations`
- Auth: `api_key` header with subscription key from developer.wmata.com
- API key stored in localStorage (`wmata_api_key`)

### Demo Mode
App starts in demo mode with mock data if no API key is configured. Toggle via header button.

### Line Codes
`RD` (Red), `OR` (Orange), `YL` (Yellow), `GR` (Green), `BL` (Blue), `SV` (Silver)

## Deployment

Deployed to Vercel at: https://metroapp-pied.vercel.app

To redeploy after changes:
```bash
pnpm dlx vercel --prod
```

## localStorage Keys

- `wmata_api_key` - WMATA API subscription key
- `metro_defaults` - Saved station/track/lines preferences
- `metro_walk_time` - Walk time in minutes (default 15)
