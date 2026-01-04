# DC Metro Train Arrival Times Web App

## Overview
A React + Vite PWA that displays real-time train arrivals for Washington DC Metro stations, with filtering by line and direction, and visual alerts for walk-time departure.

## User's Core Use Case
- 15-minute walk to station
- Wants to see next few trains at their station (e.g., McPherson Square)
- Filter by line (e.g., Silver Line) and direction (e.g., to Ashburn)
- Quick glance to know when to leave home

## Tech Stack
- **Frontend**: React 18 + Vite
- **Styling**: CSS Modules or Tailwind CSS
- **State**: React useState/useEffect (simple, no Redux needed)
- **Storage**: localStorage for preferences
- **PWA**: vite-plugin-pwa for service worker + manifest

## WMATA API
- **Endpoint**: `https://api.wmata.com/StationPrediction.svc/json/GetPrediction/{stationCode}`
- **Station List**: `https://api.wmata.com/Rail.svc/json/jStations` (to populate dropdown)
- **Auth**: API key in header `api_key`
- **Key**: User will obtain free key from https://developer.wmata.com

## Project Structure
```
metro_app/
├── index.html
├── vite.config.js
├── package.json
├── .env.example          # Template for API key
├── .env                   # User's API key (gitignored)
├── public/
│   └── icons/            # PWA icons
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── components/
│   │   ├── StationSelector.jsx
│   │   ├── TrainList.jsx
│   │   ├── TrainCard.jsx
│   │   └── Settings.jsx
│   ├── hooks/
│   │   ├── useTrainPredictions.js
│   │   └── useLocalStorage.js
│   └── utils/
│       └── api.js
└── README.md
```

## Key Components

### 1. App.jsx
- Main layout with header and content area
- Manages selected station/line/direction state
- Loads saved preferences on mount

### 2. StationSelector.jsx
- Dropdown to select station (fetches station list from API)
- Line filter buttons (SV, RD, BL, YL, OR, GR)
- Direction toggle (based on available destinations for selected line)
- "Save as default" button

### 3. TrainList.jsx
- Displays filtered list of upcoming trains
- Auto-refreshes every 30 seconds
- Shows loading/error states

### 4. TrainCard.jsx
- Individual train display: Line, Destination, Minutes
- Visual highlight (green/yellow) when train is 13-17 mins away
- Handles "ARR" and "BRD" display

### 5. Settings.jsx
- API key input (stored in localStorage)
- Walk time preference (default 15 mins)
- Clear saved preferences

## Implementation Steps

### Step 1: Project Setup
- Initialize Vite React project
- Install dependencies: `vite-plugin-pwa`
- Create folder structure
- Setup .env for API key

### Step 2: API Integration
- Create `api.js` with functions:
  - `getStations()` - fetch all stations
  - `getPredictions(stationCode)` - fetch train arrivals
- Handle API key from env or localStorage

### Step 3: Core Components
- Build StationSelector with station dropdown
- Build TrainList and TrainCard components
- Implement filtering by line and direction

### Step 4: State & Preferences
- Create useLocalStorage hook
- Save/load default station, line, direction
- Save walk time preference

### Step 5: Auto-Refresh & UX
- Implement 30-second auto-refresh
- Add loading spinners
- Add error handling with retry
- Add "last updated" timestamp

### Step 6: Walk Time Alert
- Highlight trains arriving in ~15 mins (configurable)
- Visual indicator (color, animation, or icon)

### Step 7: PWA Setup
- Configure vite-plugin-pwa
- Add manifest.json with app name, icons
- Setup service worker for offline caching
- Add install prompt

### Step 8: Styling & Polish
- Mobile-first responsive design
- Metro line colors for visual clarity
- Dark mode support (optional)

## API Key Handling
Since this is a client-side app, the API key will be:
1. Stored in localStorage after user enters it once
2. User can get free key from developer.wmata.com
3. Alternative: Could proxy through a simple backend later

## Future Enhancements (Not in initial scope)
- Push notifications for departure alerts
- Multiple saved routes
- Service alerts integration
- React Native mobile app
