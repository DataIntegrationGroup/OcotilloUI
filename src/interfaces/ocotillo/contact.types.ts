import type { IThing } from '@/interfaces/ocotillo'

export type Timestamp = string | Date

export interface IEmailBase {
  id?: number | string
  created_at?: Timestamp
  updated_at?: Timestamp

  email: string
  email_type: string

  contact_id?: number
  release_status?: string
}

export interface IPhoneBase {
  id?: number | string
  created_at?: Timestamp
  updated_at?: Timestamp

  phone_number?: string | null
  nma_phone_number?: string | null

  phone_type: string

  contact_id?: number
  release_status?: string
}

export interface IAddressBase {
  id?: number | string
  created_at?: Timestamp
  updated_at?: Timestamp

  address_line_1: string
  address_line_2?: string | null
  city: string
  state: string
  postal_code: string
  country: string
  address_type: string

  contact_id?: number
  release_status?: string
}

export interface IContactBase {
  id?: number | string
  created_at?: Timestamp
  updated_at?: Timestamp

  name?: string | null
  organization?: string | null
  role: string
  contact_type?: string

  thing_id?: number
  release_status?: string

  emails?: IEmailBase[]
  phones?: IPhoneBase[]
  addresses?: IAddressBase[]
  things?: IThing[]
}
