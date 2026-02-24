import { IPdfOptions } from '@/interfaces'

export const PDF_DEFAULT_VALUES: IPdfOptions = {
  includeNotes: true,
  includeAssets: true,
  includeContacts: true,
  includeBlankPage: false,
  density: 'normal',
}

export const PDF_SINGLE_PAGE_OPTION: IPdfOptions = {
  includeNotes: false,
  includeAssets: false,
  includeContacts: true,
  includeBlankPage: false,
  density: 'very-dense',
}
