export interface IWellInventoryForm {
  id?: number
  location: {
    name: string
    notes?: string
    point: string 
    release_status: string
  }
  locationMode: 'existing' | 'new'
  selectedLocationId?: number
  well: {
    name: string
    thing_type: 'well'
    well_depth?: number
    hole_depth?: number
    well_type: string
    notes?: string
  }
  contacts: Array<{
    name: string
    role: string
    emails?: Array<{
      email: string
      email_type: string
    }>
    phones?: Array<{
      phone_number: string
      phone_type: string
      country_code?: string
    }>
    addresses?: Array<{
      address_line_1: string
      address_line_2?: string
      city: string
      state: string
      postal_code: string
      address_type: string
    }>
  }>
  assets?: Array<{
    label: string
    name: string
    file?: File
    mime_type?: string
  }>
} 