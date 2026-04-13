export interface IParameterSummary {
  id: number
  parameter_name: string
  parameter_type: string
  matrix: string
  default_unit: string | null
  cas_number: string | null
  release_status: string
  created_at: string
}

export interface IGroundwaterLevelObservationAttributes {
  value: number
  depth_to_water_bgs: number
  measuring_point_height: number | null
  level_status: string | null
  groundwater_level_reason: string | null
  nma_data_quality: string | null
}

export interface IObservationAttributes {
  id: number
  observation_type: string
  observation_datetime: string
  created_at: Date
  release_status: string
  sample_id: number
  sensor_id: number | null
  observed_property: string
  value: number | null
  unit: string
  parameter?: IParameterSummary
}

export interface IObservation
  extends IObservationAttributes,
    IGroundwaterLevelObservationAttributes {}

export interface IGroundwaterLevelObservation
  extends IObservationAttributes,
    IGroundwaterLevelObservationAttributes {}
