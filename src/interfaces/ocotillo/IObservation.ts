export interface IGroundwaterLevelObservationAttributes {
  value: number
  depth_to_water_bgs: number
  measuring_point_height: number | null
  level_status: string | null
}

export interface IObservationAttributes {
  id: number
  observation_type: string
  observation_datetime: string
  created_at: Date
  release_status: string
  sample_id: number
  sensor_id: number
  observed_property: string
  value: number | null
  unit: string
}

export interface IObservation
  extends IObservationAttributes,
    IGroundwaterLevelObservationAttributes {}

export interface IGroundwaterLevelObservation
  extends IObservationAttributes,
    IGroundwaterLevelObservationAttributes {}
