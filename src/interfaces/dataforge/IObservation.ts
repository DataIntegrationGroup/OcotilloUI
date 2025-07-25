export interface IGroundwaterLevelObservationAttributes {
  depth_to_water: number
}

export interface IObservationAttributes {
  id: number
  observation_type: string
  observation_timestamp: string
  created_at: string
}

export interface IObservation
  extends IObservationAttributes,
    IGroundwaterLevelObservationAttributes {}

export interface IGroundwaterLevelObservation
  extends IObservationAttributes,
    IGroundwaterLevelObservationAttributes {}
