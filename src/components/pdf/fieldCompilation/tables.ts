// Column definitions shared by page 1 and pages 2-4.
// Moved verbatim out of page.tsx (C2a); no value changed.

export const lastMeasurementsColumns = [
  { key: 'date', label: 'Date' },
  { key: 'dtw', label: 'Depth to Water Below Ground Surface (ft)' },
  { key: 'method', label: 'Method' },
  { key: 'status', label: 'Level Status' },
] as const

export const equipmentColumns = [
  { key: 'sensor_type', label: 'Equipment Type' },
  { key: 'sensor_model', label: 'Model' },
  { key: 'serial_no', label: 'Serial No' },
  { key: 'hanging_cable_length', label: 'Cable Length' },
  { key: 'recording_interval_display', label: 'Rec Interval' },
  { key: 'datetime_installed', label: 'Installed' },
  // ALIGNMENT A8: notes join the row instead of a second table.
  { key: 'notes', label: 'Notes' },
] as const

export const manualMeasurementColumns = [
  { key: 'date', label: 'Date' },
  { key: 'dtw', label: 'DTW (ft)' },
  { key: 'mpHeight', label: 'MP Ht (ft)' },
  { key: 'status', label: 'Level Status' },
] as const

// Site Notes is the previous-visit notes (same content as the retired
// Pre-visit Notes pad), rendered as a single field below the measurement rows.
export const siteNotesFieldLabel = 'Site Notes:' as const

export const cutMethodColumns = ['M1', 'M2', 'M3', 'M4', 'M5'] as const
export const cutMethodRows = [
  'Time',
  'Hold',
  'Cut',
  'Tape Correction',
  'WL below MP',
  'MP Correction',
] as const

export const newMeasurementGridRows = ['Hold', 'Cut', 'Depth to Water Below Ground Surface (ft)', 'DTW BGS (ft)'] as const
