export interface ITerm {
  id: number
  term: string
  definition: string
  categories: ICategory[]
  created_at: string
}

export interface ICategory {
  id: number
  name: string
  created_at: string
  description: string | null
}
