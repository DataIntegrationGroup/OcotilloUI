import type { IWell } from '@/interfaces/ocotillo'

const extractLeadingWellName = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''

  const firstToken = trimmed.match(/^\S+/)?.[0] ?? ''
  return firstToken.trim()
}

export const parseIds = (raw: string) =>
  raw
    .split(/[,\r\n]+/)
    .map((s) => extractLeadingWellName(s))
    .filter(Boolean)

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
