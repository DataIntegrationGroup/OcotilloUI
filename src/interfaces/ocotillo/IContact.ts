import { IThing } from '@/interfaces/ocotillo'
import type {
  IContactBase,
  IEmailBase,
  IPhoneBase,
  IAddressBase,
} from '@/interfaces/ocotillo/contact.types'

export interface IContact extends IContactBase {
  id: number
  name: string
  created_at: Date
  release_status: string

  things?: IThing[]
  emails?: IEmail[]
  phones?: IPhone[]
  addresses?: IAddress[]
}

export interface IEmail extends IEmailBase {
  id: number
  created_at: Date
  release_status: string
  contact_id: number
  email: string
  email_type: string
}

export interface IPhone extends IPhoneBase {
  id: number
  created_at: Date
  release_status: string
  contact_id: number
  phone_number: string
  phone_type: string
}

export interface IAddress extends IAddressBase {
  id: number
  created_at: Date
  release_status: string
  contact_id: number
  address_line_1: string
  city: string
  state: string
  postal_code: string
  country: string
  address_type: string
}
