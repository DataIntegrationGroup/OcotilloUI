import type { IWell } from '@/interfaces/ocotillo'

const extractLeadingWellName = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''

  const firstToken = trimmed.match(/^\S+/)?.[0] ?? ''
  return firstToken.trim()
}

export const parseIds = (raw: string) =>
  // Split well IDs out of calendar prose — Google loop descriptions join them
  // with commas, newlines AND slashes. Each delimited unit yields at most one
  // leading well-name token; prose that is not a leading token is dropped here.
  raw
    .split(/[,\r\n/]+/)
    .map((s) => extractLeadingWellName(s))
    .filter(Boolean)

/**
 * The ordered set of PDF pages a single well contributes to a batch file:
 * page 1 (the field sheet) always, plus page 2 (the owner leave-behind /
 * BDMS-1507 sheet) only when `includeOwnerPage` is true. Kept side-effect free
 * so the two-page ruling can be unit-tested without rendering react-pdf
 * (CI has no pdftotext/pdfinfo). Layout of each page lives in BDMS-1504 /
 * BDMS-1507 components and is untouched here.
 */
export type WellBatchPage = 'field-sheet' | 'owner-leavebehind'

export const pagesForWell = (
  _well: IWell,
  includeOwnerPage: boolean
): WellBatchPage[] =>
  includeOwnerPage ? ['field-sheet', 'owner-leavebehind'] : ['field-sheet']

export const normalizeLookupKey = (value: string) =>
  value
    .normalize('NFKC')
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase()

export const compactLookupKey = (value: string) =>
  normalizeLookupKey(value).replace(/[^A-Z0-9]/g, '')

export const buildWellLookup = (wells: IWell[]) => {
  const lookup = new Map<string, IWell>()

  wells.forEach((well) => {
    const name = String(well.name ?? '')
    if (!name.trim()) return

    const normalizedName = normalizeLookupKey(name)
    lookup.set(normalizedName, well)

    const compactName = compactLookupKey(name)
    if (compactName && compactName !== normalizedName) {
      lookup.set(compactName, well)
    }
  })

  return lookup
}

export const buildBatchFilename = () => {
  const date = new Date().toISOString().slice(0, 10)
  return `FieldSheets_Batch_${date}`
}

export const sanitizeFilenamePart = (value: string) =>
  value
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

export const safeFilenamePrefix = (value: string) =>
  sanitizeFilenamePart(value) || 'FieldSheets_Batch'
