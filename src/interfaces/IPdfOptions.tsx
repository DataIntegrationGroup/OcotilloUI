import { IPdfDensity } from './'

export interface IPdfOptions {
  includeNotes?: boolean | null
  includeAssets?: boolean | null
  includeContacts?: boolean | null
  includeBlankPage?: boolean | null
  density?: IPdfDensity
}
