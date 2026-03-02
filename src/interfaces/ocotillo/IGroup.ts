export interface IGroup {
  id: NonNullable<number>
  name: string
  description?: string | null
  project_area?: GeoJSON.MultiPolygon | string | null
  parent_group_id?: number | null
  created_at: string // ISO 8601 string
  created_by_name?: string | null
  created_by_id?: string | null
  updated_by_name?: string | null
  updated_by_id?: string | null
  release_status?: string | null
  parent_group?: IGroup | null
  monitoring_frequency?: string | null
  group_type?: string | null
}
