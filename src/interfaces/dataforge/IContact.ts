export interface IContact {
  id: number
  name: string
  role: string
  thing_id: number
}

export interface IEmail {
  id: number
  email: string
  email_type: string
  // contact_id: number
}

export interface IPhone {
  id: number
  phone_number: string
  phone_type: string
  // contact_id: number
}

export interface IAddress {
  id: number
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  address_type: string
  // contact_id: number
}
