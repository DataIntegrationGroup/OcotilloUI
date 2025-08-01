export interface IGroundwaterLevel {
  id: number
}

export interface IGroundwaterLevelForm {
  thing_id: number
  sensor_id: number
  sample_id: number
  observed_property: string

  observation_timestamp: Date
  depth_to_water: number
  measuring_point_height: number
  release_status: string
  level_status: string
}
