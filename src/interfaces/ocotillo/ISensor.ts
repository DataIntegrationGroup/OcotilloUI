export interface ISensor {
  id: number
  name: string
  model?: string | null
  serial_no?: string | null
  datetime_installed?: string | null
  datetime_removed?: string | null
  recording_interval?: number | null
  notes?: string | null
  created_at: Date
  release_status: string
}
