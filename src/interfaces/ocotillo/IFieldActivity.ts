export interface IFieldActivitySampleObservation {
  id: number
  created_at?: string
  release_status?: string
  sample_id?: number
  sensor_id?: number | null
  observation_datetime?: string
  observed_property?: string
  value?: number | null
  unit?: string
  depth_to_water_bgs?: number | null
  measuring_point_height?: number | null
  level_status?: string | null
  groundwater_level_reason?: string | null
  nma_data_quality?: string | null
}

export interface IFieldActivitySample {
  id: number
  created_at?: string
  release_status?: string
  sample_date?: string
  sample_name?: string
  sampler_name?: string | null
  sample_matrix?: string | null
  sample_method?: string | null
  qc_type?: string
  notes?: string | null
  depth_top?: number | null
  depth_bottom?: number | null
  observations?: IFieldActivitySampleObservation[]
  contact?: {
    name?: string | null
  } | null
}

export interface IFieldActivity {
  id: number
  created_at?: string
  release_status?: string
  field_event_id: number
  activity_type?: string
  notes?: string | null
  samples?: IFieldActivitySample[]
}
