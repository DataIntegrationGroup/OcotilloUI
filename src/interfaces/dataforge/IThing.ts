export interface IThing {
  id: number
  name: string
  created_at: Date
  thing_type: string
  location_id: number
  location?: object
  geometry?: {
    type: string
    coordinates: number[][]
  }
}

export interface IWell extends IThing {
  well_depth: number
  hole_depth: number
  well_type: string
}

export interface ISpring extends IThing {
  spring_type?: string
}
