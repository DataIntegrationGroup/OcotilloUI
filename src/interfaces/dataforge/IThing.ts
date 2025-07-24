export interface IThing {
  id: number
  name: string
  created_at: string
  thing_type: string
  location_id: number
}

export interface IWell extends IThing {
  well_depth: number
  hole_depth: number
  well_type: string
}

export interface ISpring extends IThing {
  spring_type?: string
}
