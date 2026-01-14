// Generate a unique ID for presets
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

// Create a new preset object
export function createPreset(name, station, track, lines, walkTime) {
  return {
    id: generateId(),
    name,
    station,
    track,
    lines: lines || [],
    walkTime: walkTime || 15
  }
}

// Migrate from old localStorage format to new presets format
export function migrateFromOldFormat() {
  // Check if already migrated
  const existingPresets = localStorage.getItem('metro_presets')
  if (existingPresets) {
    return JSON.parse(existingPresets)
  }

  // Check for old format
  const oldDefaults = localStorage.getItem('metro_defaults')
  if (!oldDefaults) {
    return []
  }

  try {
    const parsed = JSON.parse(oldDefaults)
    // Only migrate if there's actual data
    if (!parsed.station) {
      return []
    }

    const oldWalkTime = localStorage.getItem('metro_walk_time')
    const walkTime = oldWalkTime ? parseInt(oldWalkTime, 10) : 15

    const preset = createPreset(
      'My Default',
      parsed.station,
      parsed.track,
      parsed.lines,
      walkTime
    )

    // Save in new format
    const presets = [preset]
    localStorage.setItem('metro_presets', JSON.stringify(presets))
    localStorage.setItem('metro_active_preset', preset.id)

    // Remove old keys
    localStorage.removeItem('metro_defaults')

    return presets
  } catch (e) {
    console.error('Migration failed:', e)
    return []
  }
}

// Load presets from localStorage
export function loadPresets() {
  // First try migration
  const migrated = migrateFromOldFormat()
  if (migrated.length > 0) {
    return migrated
  }

  const stored = localStorage.getItem('metro_presets')
  if (!stored) {
    return []
  }

  try {
    return JSON.parse(stored)
  } catch (e) {
    console.error('Failed to parse presets:', e)
    return []
  }
}

// Save presets to localStorage
export function savePresets(presets) {
  localStorage.setItem('metro_presets', JSON.stringify(presets))
}

// Load active preset ID
export function loadActivePresetId() {
  return localStorage.getItem('metro_active_preset')
}

// Save active preset ID
export function saveActivePresetId(id) {
  if (id) {
    localStorage.setItem('metro_active_preset', id)
  } else {
    localStorage.removeItem('metro_active_preset')
  }
}

// Get a preset by ID
export function getPresetById(presets, id) {
  return presets.find(p => p.id === id) || null
}
