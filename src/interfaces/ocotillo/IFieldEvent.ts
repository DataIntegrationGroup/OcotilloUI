export interface IFieldEventParticipantContact {
  id: number
  created_at?: string
  release_status?: string
  contact_name?: string | null
  contact_organization?: string | null
}

export interface IFieldEventParticipant {
  id: number
  created_at?: string
  release_status?: string
  field_event_id: number
  contact_id: number
  participant_role: string
  participant?: IFieldEventParticipantContact
}

import type { IFieldActivity } from './IFieldActivity'

export interface IFieldEvent {
  id: number
  created_at?: string
  release_status?: string
  thing_id: number
  event_date?: string
  notes?: string | null
  field_event_participants?: IFieldEventParticipant[]
  field_activities?: IFieldActivity[]
}
