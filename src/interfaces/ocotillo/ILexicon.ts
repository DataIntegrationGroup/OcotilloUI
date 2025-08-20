export interface ITerm {
  id: number
  term: string
  definition: string
  category: string
  created_at: Date
}

export interface ICategory {
  id: number
  name: string
}
