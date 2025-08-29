export interface IGroundwaterLevelObservationAttributes {
  value: number
}

export interface IObservationAttributes {
  id: number
  observation_type: string
  observation_datetime: string
  created_at: Date
}

export interface IObservation
  extends IObservationAttributes,
    IGroundwaterLevelObservationAttributes {}

export interface IGroundwaterLevelObservation
  extends IObservationAttributes,
    IGroundwaterLevelObservationAttributes {}
