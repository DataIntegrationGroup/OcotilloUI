import {
  VIRIDIS_HIGH,
  VIRIDIS_LOW,
  VIRIDIS_MID,
  viridisGradient,
  viridisSamples,
} from '@/constants/viridis'

// Class colors for the binned scales below. Sampled straight off the viridis
// ramp, lowest class first, so the legend gradient and the symbols agree.
const TDS_CLASS_COLORS = viridisSamples(6)

export type OgcCollectionRecord = {
  id?: string
  collection_id?: string
  name?: string
  title?: string
  description?: string
  abstract?: string
}

export type ResolvedCollection = {
  id: string
  label: string
  exists: boolean
  description?: string
}

export const TDS_LEGEND = {
  gradient: viridisGradient(),
  minLabel: '<300',
  maxLabel: '5000+ mg/L',
}

export const TREND_LEGEND = {
  gradient: viridisGradient(3),
  minLabel: 'Declining',
  maxLabel: 'Rising',
}

const parseNumeric = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined

  const normalized = value.replace(/,/g, '').match(/-?\d+(\.\d+)?/)
  if (!normalized) return undefined
  const parsed = Number(normalized[0])
  return Number.isFinite(parsed) ? parsed : undefined
}

const findNumericPropertyWithPriority = (
  feature: any,
  priorityPatterns: RegExp[],
  fallbackPatterns: RegExp[],
  excludePatterns: RegExp[] = []
): number | undefined => {
  const properties = feature?.properties || {}
  const entries = Object.entries(properties) as Array<[string, unknown]>

  const tryMatch = (includePatterns: RegExp[]) => {
    for (const [key, value] of entries) {
      const keyString = String(key)
      if (excludePatterns.some((pattern) => pattern.test(keyString))) continue
      if (!includePatterns.some((pattern) => pattern.test(keyString))) continue
      const parsed = parseNumeric(value)
      if (parsed !== undefined) return parsed
    }
    return undefined
  }

  return tryMatch(priorityPatterns) ?? tryMatch(fallbackPatterns)
}

const findStringProperty = (feature: any, patterns: RegExp[]): string | undefined => {
  const properties = feature?.properties || {}
  for (const [key, value] of Object.entries(properties)) {
    const keyString = String(key)
    if (!patterns.some((pattern) => pattern.test(keyString))) continue
    if (typeof value === 'string' && value.trim().length > 0) return value
  }
  return undefined
}

export const latestTdsColorFromFeature = (feature: any): string | undefined => {
  const value = findNumericPropertyWithPriority(
    feature,
    [
      /(latest|recent|most).*(tds|dissolved.*solids)/i,
      /(tds|dissolved.*solids).*(latest|recent|most)/i,
    ],
    [/tds/i, /dissolved.*solids/i],
    [
      /count/i,
      /num/i,
      /code/i,
      /id$/i,
      /unit/i,
      /rank/i,
      /class/i,
      /flag/i,
      /avg/i,
      /average/i,
      /mean/i,
      /median/i,
      /min/i,
      /max/i,
    ]
  )
  if (value === undefined) return undefined
  if (value < 300) return TDS_CLASS_COLORS[0]
  if (value < 500) return TDS_CLASS_COLORS[1]
  if (value < 1000) return TDS_CLASS_COLORS[2]
  if (value < 2000) return TDS_CLASS_COLORS[3]
  if (value < 5000) return TDS_CLASS_COLORS[4]
  return TDS_CLASS_COLORS[5]
}

export const trendColorFromFeature = (feature: any): string | undefined => {
  const label = findStringProperty(feature, [/trend/i, /trend_class/i])?.toLowerCase()
  if (label) {
    if (/(declin|decreas|fall|down)/.test(label)) return VIRIDIS_LOW
    if (/(stable|flat|no change|neutral)/.test(label)) return VIRIDIS_MID
    if (/(ris|increas|up)/.test(label)) return VIRIDIS_HIGH
  }

  const slope = findNumericPropertyWithPriority(
    feature,
    [/trend.*slope/i, /slope.*trend/i, /latest.*trend/i, /trend.*latest/i],
    [/trend/i, /slope/i],
    [/count/i, /num/i, /code/i, /id$/i, /unit/i, /rank/i, /class/i, /flag/i]
  )
  if (slope === undefined) return undefined
  if (slope < -0.2) return VIRIDIS_LOW
  if (slope > 0.2) return VIRIDIS_HIGH
  return VIRIDIS_MID
}

const normalize = (value?: string): string =>
  (value || '').toLowerCase().replace(/[^a-z0-9]+/g, '')

export const resolveCollection = (
  collections: OgcCollectionRecord[],
  candidates: string[]
): ResolvedCollection => {
  const primaryKeys = (collection: OgcCollectionRecord): string[] =>
    [collection.id, collection.collection_id].map(normalize).filter(Boolean)
  const secondaryKeys = (collection: OgcCollectionRecord): string[] =>
    [collection.name, collection.title].map(normalize).filter(Boolean)

  const findExact = (
    candidate: string,
    keysFor: (collection: OgcCollectionRecord) => string[]
  ): OgcCollectionRecord | undefined =>
    collections.find((collection) => keysFor(collection).includes(candidate))

  // Matching is exact. A registered layer names the collections it can bind
  // to, and binds to none of them if the catalog does not publish one --
  // partial matching used to bind a layer to an unrelated collection whose
  // name merely contained the candidate.
  let bestMatch: OgcCollectionRecord | undefined

  for (const candidate of candidates.map(normalize).filter(Boolean)) {
    bestMatch =
      findExact(candidate, primaryKeys) ?? findExact(candidate, secondaryKeys)
    if (bestMatch) break
  }

  return {
    id: bestMatch?.id || bestMatch?.collection_id || bestMatch?.name || '',
    label:
      bestMatch?.title ||
      bestMatch?.name ||
      candidates[0].replace(/\s*\(Water Wells\)\s*/g, ''),
    exists: Boolean(bestMatch),
    description: bestMatch?.description || bestMatch?.abstract,
  }
}
