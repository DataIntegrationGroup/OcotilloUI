export interface IThingIdLink {
  id: NonNullable<number>
  created_at: string // API returns ISO string, not Date object
  release_status: string
  thing_id: number
  relation: string
  alternate_id: string
  alternate_organization: string
}
