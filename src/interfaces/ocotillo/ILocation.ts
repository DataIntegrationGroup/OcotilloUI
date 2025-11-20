export interface ILocation {
  id: NonNullable<number>
  elevation?: number | null
  elevation_accuracy?: number | null
  elevation_method?: string | null
  elevation_unit?: string | null

  horizontal_datum?: string | null
  vertical_datum?: string | null

  created_at?: string | null
  release_status: 'public'
  notes: string | null

  point: string | null
  coordinate_accuracy: number | null
  coordinate_method: string | null

  state: null
  county: null
  quad_name: null
}
