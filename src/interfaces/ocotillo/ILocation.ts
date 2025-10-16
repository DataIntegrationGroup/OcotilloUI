export interface ILocation {
  id: number
  county: string
  state: string
  quad_name: string
  elevation: number
  elevation_accuracy: number | null
  elevation_method: string | null
  horizontal_datum: string | null
  vertical_datum: string | null
  coordinate_accuracy: number | null
  coordinate_method: string | null
  notes: string | null
  point: string
  release_status: string
  created_at: string
}
