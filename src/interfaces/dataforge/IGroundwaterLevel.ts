export interface IGroundwaterLevel {
  id: number
}

export interface IGroundwaterLevelForm {
  thing_id: number
  observation_timestamp: string
  depth_to_water: number
  measuring_point_height: number
  release_status: string
}
