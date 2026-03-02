import { ILocationGeo, IGroup, IThingIdLink } from '@/interfaces/ocotillo'
import { z } from 'zod'
import { zReleaseStatus, zNoteResponse } from '@/generated/zod.gen'

export interface IThing {
  id: NonNullable<number>
  name: string
  created_at: string
  release_status: z.infer<typeof zReleaseStatus>
  thing_type: string
  location_id: number
  current_location?: ILocationGeo | null
  first_visit_date?: string | null
  groups?: IGroup[]
  monitoring_status?: string | null
  alternate_ids?: IThingIdLink[]
  water_notes?: z.infer<typeof zNoteResponse>[]
  measuring_notes?: z.infer<typeof zNoteResponse>[]
  notes?: z.infer<typeof zNoteResponse>[]
  general_notes?: z.infer<typeof zNoteResponse>[]
  sampling_procedure_notes?: z.infer<typeof zNoteResponse>[]
  construction_notes?: z.infer<typeof zNoteResponse>[]
}
