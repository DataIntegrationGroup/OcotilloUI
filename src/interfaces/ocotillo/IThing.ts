import { number, object } from 'yup'
import { ILocation } from '@/interfaces/ocotillo/ILocation'

export interface IThing {
  id: number
  name: string
  created_at: string
  release_status: string
  thing_type: string
  location_id: number
  active_location: ILocation
  // geometry?: {
  //   type: string
  //   coordinates: number[][]
  // }
}

export interface IWell extends IThing {
  well_depth?: number | null
  hole_depth?: number | null
  well_type?: string | null
  well_construction_notes?: string | null
  group_id?: number | null
}

export interface ISpring extends IThing {
  spring_type?: string
}

export interface IThingIdLink {
  thing_id: number
  thing: IThing
  relation: string
  alternate_id: string
  alternate_organization: string
}
