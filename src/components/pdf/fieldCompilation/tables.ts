// Column definitions shared by page 1 and pages 2-4.
// Moved verbatim out of page.tsx (C2a); no value changed.

export const lastMeasurementsColumns = [
  { key: 'date', label: 'Date', width: '16.67%' },
  { key: 'dtw', label: 'DTW Below MP (ft)', width: '16.67%' },
  { key: 'mpHeight', label: 'MP Ht (ft)', width: '16.67%' },
  { key: 'method', label: 'Method', width: '16.67%' },
  { key: 'status', label: 'Level Status', width: '16.67%' },
  // ALIGNMENT A7: the mock-up carries STAFF. No per-reading staff field
  // exists in the data model, so it prints the empty placeholder until one
  // does — the column is the argument for collecting it.
  { key: 'staff', label: 'Staff', width: '16.67%' },
] as const

export const equipmentColumns = [
  { key: 'sensor_type', label: 'Equipment Type', width: '14.29%' },
  { key: 'sensor_model', label: 'Model', width: '14.29%' },
  { key: 'serial_no', label: 'Serial No', width: '14.29%' },
  { key: 'hanging_cable_length', label: 'Cable Length', width: '14.29%' },
  { key: 'recording_interval_display', label: 'Rec Interval', width: '14.29%' },
  { key: 'datetime_installed', label: 'Installed', width: '14.29%' },
  // ALIGNMENT A8: notes join the row instead of a second table.
  { key: 'notes', label: 'Notes', width: '14.29%' },
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

export const newMeasurementGridRows = ['Hold', 'Cut', 'DTW Below MP (ft)', 'DTW BGS (ft)'] as const
