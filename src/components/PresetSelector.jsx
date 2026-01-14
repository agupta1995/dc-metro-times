import './PresetSelector.css'

export function PresetSelector({
  presets,
  activePresetId,
  onSelectPreset
}) {
  if (presets.length === 0) {
    return null
  }

  return (
    <div className="preset-selector">
      <div className="preset-chips">
        {presets.map(preset => (
          <button
            key={preset.id}
            className={`preset-chip ${activePresetId === preset.id ? 'active' : ''}`}
            onClick={() => onSelectPreset(preset.id)}
          >
            {activePresetId === preset.id && (
              <span className="preset-check">&#10003;</span>
            )}
            <span className="preset-name">{preset.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
