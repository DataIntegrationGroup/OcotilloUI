export interface ITerm {
  id: number
  term: string
  definition: string
  categories: string
  created_at: Date
}

export interface ICategory {
  id: number
  name: string
}
