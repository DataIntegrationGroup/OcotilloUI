import { ILocation } from '@/interfaces/ocotillo/ILocation'

export interface IThing {
  id: number
  name: string
  created_at: string
  release_status: string
  thing_type: string
  location_id: number
}

export interface IWell extends IThing {
  current_location?: ILocation | null
  first_visit_date?: string | null
  hole_depth?: number | null
  hole_depth_unit?: string | null
  well_depth?: number | null
  well_depth_unit?: string | null
  well_type?: string | null
  well_casing_depth?: number | null
  well_casing_depth_unit?: string | null
  well_casing_diameter?: number | null
  well_casing_diameter_unit?: string | null
  well_casing_material?: string | null
  well_construction_notes?: string | null
  well_purpose?: string | null
  group_id?: number | null
}

export interface ISpring extends IThing {
  spring_type?: string
}

export interface IThingIdLink {
  id: number
  created_at: Date
  release_status: string
  thing_id: number
  thing: IThing
  relation: string
  alternate_id: string
  alternate_organization: string
}

export interface IGroup {
  id: number
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
}
