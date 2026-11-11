// Column definitions shared by page 1 and pages 2-4.
// Moved verbatim out of page.tsx (C2a); no value changed.

export const lastMeasurementsColumns = [
  { key: 'date', label: 'Date', width: '15%' },
  { key: 'dtw', label: 'Depth to Water Below Ground Surface (ft)', width: '24%' },
  { key: 'method', label: 'Method', width: '13%' },
  { key: 'status', label: 'Level Status', width: '13%' },
  // ALIGNMENT A7 + PR#428 item 10/14: Site Notes joins the measurement rows as
  // its own (last) column, showing only the two most recent notes — newest note
  // paired with the newest row. Methods/Level Status keep enough width that
  // their headers do not break mid-word.
  { key: 'siteNotes', label: 'Site Notes', width: '36%' },
] as const

export const equipmentColumns = [
  { key: 'sensor_type', label: 'Equipment Type', width: '20%' },
  { key: 'sensor_model', label: 'Model', width: '16%' },
  { key: 'serial_no', label: 'Serial No', width: '14%' },
  { key: 'hanging_cable_length', label: 'Cable Length', width: '14%' },
  { key: 'recording_interval_display', label: 'Rec Interval', width: '14%' },
  { key: 'datetime_installed', label: 'Installed', width: '14%' },
  // ALIGNMENT A8: notes join the row instead of a second table.
  { key: 'notes', label: 'Notes', width: '8%' },
] as const

export const manualMeasurementColumns = [
  { key: 'date', label: 'Date', width: '22%' },
  { key: 'dtw', label: 'DTW (ft)', width: '26%' },
  { key: 'mpHeight', label: 'MP Ht (ft)', width: '16%' },
  { key: 'status', label: 'Level Status', width: '36%' },
] as const

// Site Notes is now a single field inside Last Measurements (lane 32),
// not a separate table. The label column width is just for alignment.
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
