import { ILocationGeo } from '@/interfaces/ocotillo/ILocation'
import { z } from 'zod'
import {
  zReleaseStatus,
  zWellPurpose,
  zNoteResponse,
} from '@/generated/zod.gen'

export interface IThing {
  id: NonNullable<number>
  name: string
  created_at: string
  release_status: z.infer<typeof zReleaseStatus>
  thing_type: string
  location_id: number
  current_location?: ILocationGeo | null
  first_visit_date?: string | null
  groups?: IGroup[]
  monitoring_status?: string | null
  alternate_ids?: IThingIdLink[]
  water_notes?: z.infer<typeof zNoteResponse>
  measuring_notes?: z.infer<typeof zNoteResponse>
  notes?: z.infer<typeof zNoteResponse>
  general_notes?: z.infer<typeof zNoteResponse>
}

export interface IWell extends IThing {
  first_visit_date?: string | null
  hole_depth?: number | null
  hole_depth_unit?: string | null

  well_depth?: number | null
  well_depth_unit?: string | null

  well_casing_diameter?: number | null
  well_casing_diameter_unit?: string | null

  well_casing_depth?: number | null
  well_casing_depth_unit?: string | null

  well_casing_materials?: string[] | null
  well_construction_notes?: string | null

  well_purposes?: z.infer<typeof zWellPurpose>[] | null
  well_status?: string | null

  measuring_point_height?: number | null
  measuring_point_height_unit?: string | null
  measuring_point_description?: string | null
}

export interface ISpring extends IThing {
  spring_type?: string
}

export interface IThingIdLink {
  id: NonNullable<number>
  created_at: string // API returns ISO string, not Date object
  release_status: string
  thing_id: number
  thing: IThing
  relation: string
  alternate_id: string
  alternate_organization: string
}

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

export interface IEmail {
  id?: number | string
  created_at?: string
  updated_at?: string

  email: string
  email_type: string // e.g., "personal", "work", etc.
}

export interface IPhone {
  id?: number | string
  created_at?: string
  updated_at?: string

  phone_number?: string | null
  phone_type: string // e.g., "mobile", "landline", etc.
  nma_phone_number?: string | null
}

export interface IAddress {
  id?: number | string
  created_at?: string
  updated_at?: string

  address_line_1: string
  address_line_2?: string | null
  city: string
  state: string
  postal_code: string
  country: string
  address_type: string
}

export interface IContact {
  id?: number | string
  created_at?: string
  updated_at?: string

  name?: string | null
  organization?: string | null
  role: string
  contact_type: string

  emails: IEmail[]
  phones: IPhone[]
  addresses: IAddress[]
  things: IThing[]
}
