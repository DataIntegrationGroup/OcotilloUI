export type PdfDensity = 'normal' | 'dense' | 'very-dense'

export interface IPdfOptions {
  includeNotes?: boolean | null
  includeAssets?: boolean | null
  includeContacts?: boolean | null
  includeBlankPage?: boolean | null
  density?: PdfDensity
}
