import type { IContact, IThing } from '@/interfaces/ocotillo'
import { z } from 'zod'
import { zWellPurpose } from '@/generated/zod.gen'

export interface IWell extends IThing {
  hole_depth?: number | null
  hole_depth_unit?: string | null

  well_depth?: number | null
  well_depth_unit?: string | null
  well_depth_source?: string | null

  well_casing_diameter?: number | null
  well_casing_diameter_unit?: string | null

  well_casing_depth?: number | null
  well_casing_depth_unit?: string | null

  well_casing_materials?: string[] | null

  well_completion_date?: string | null
  well_completion_date_source?: string | null

  well_driller_name?: string | null

  well_construction_method?: string | null
  well_construction_method_source?: string | null

  well_pump_type?: string | null

  well_pump_depth?: number | null
  well_pump_depth_unit?: string | null

  formation_completion_code?: string | null

  is_suitable_for_datalogger?: boolean | null

  well_purposes?: z.infer<typeof zWellPurpose>[] | null
  well_status?: string | null

  monitoring_frequencies?: {
    monitoring_frequency: string
    start_date: string
    end_date: string | null
  }[]

  measuring_point_height?: number | null
  measuring_point_height_unit?: string | null
  measuring_point_description?: string | null

  aquifers?: {
    aquifer_system: string
    aquifer_types: string[]
  }[]

  permissions?: {
    permission_type: string
    permission_allowed: boolean | null
    start_date: string | null
    end_date: string | null
  }[]

  contacts?: Partial<IContact>[] | null

  site_name?: string | null

  historic_depth_to_water?: string[] | null
}
