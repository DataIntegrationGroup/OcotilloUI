import {
  IThing,
  IContact,
  IFieldActivity,
  IFieldEvent,
} from '@/interfaces/ocotillo'

export interface ISample {
  id: number
  created_at?: string
  release_status?: string

  thing_id: number
  thing?: IThing

  field_event?: IFieldEvent
  field_activity?: IFieldActivity
  contact?: IContact

  sample_type?: string
  sample_name?: string
  field_sample_id?: string

  sample_date?: string
  sampler_name?: string

  sample_matrix?: string | null
  sample_method?: string | null

  qc_sample?: string
  qc_type?: string

  sensor_id?: number | null

  duplicate_sample_number?: number | null

  sample_top?: number | null
  sample_bottom?: number | null

  depth_top?: number | null
  depth_bottom?: number | null

  notes?: string | null
}
