import { GroupType } from '@/constants'

export type BaseResult = {
  label: string
  group: GroupType
  description?: string
}

export type RelatedThing = {
  id: number
  label: string
  thing_type: string
}

export type AssetResult = BaseResult & {
  group: GroupType.Assets
  properties: {
    id: number
    storage_service: 'gcs' | 's3' | string
    storage_path: string
    mime_type: string
    size: number
    things: RelatedThing[]
  }
}

export type ContactResult = BaseResult & {
  group: GroupType.Contacts
  properties: {
    id: number
    address: string[]
    phone: string[]
    email: string[]
    things: RelatedThing[]
  }
}

export type WellResult = BaseResult & {
  group: GroupType.Wells | GroupType.Springs
  properties: {
    id: number
    thing_type: string
    well_purposes?: string[]
    well_depth?: number
    hole_depth?: number
    // Fields below require backend additions to the /search endpoint:
    owner_name?: string
    county?: string
    site_name?: string
    alternate_ids?: string[]
    owner_phone?: string[]
  }
}

export type MessageResult = {
  group: GroupType.Messages
  label: string
  __empty?: boolean
  __error?: boolean
}

export type SearchResult =
  | ContactResult
  | WellResult
  | AssetResult
  | MessageResult
