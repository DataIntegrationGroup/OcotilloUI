export interface IGroundwaterLevel {
  id: number
}

export interface IGroundwaterLevelForm {
  thing_id: number
  sample: {
    field_sample_id: string
    sample_date: Date
    sample_type: string
    qc_sample: string
    sample_top: number
    sample_bottom: number
    duplicate_sample_number: number
    sensor_id: number
    notes: string
    release_status: string
  }
  observation: {
    sensor_id: number
    observed_property: string
    observation_datetime: Date
    value: number
    depth_to_water_bgs: number
    measuring_point_height: number
    release_status: string
    level_status: string
  }
}
