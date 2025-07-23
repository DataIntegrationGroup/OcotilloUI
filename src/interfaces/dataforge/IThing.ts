export interface IThing {
  id: number
  name: string
  created_at: string
}

export interface IWellThing {
  id: number
  thing: IThing
  well_depth: number
  hole_depth: number
  created_at: string
  thing_id: number
  well_type: string
}
