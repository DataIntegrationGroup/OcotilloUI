import Papa from 'papaparse'
import type { PublishedThing } from '@/utils/accessDestinations'

export type PublishedCoordinate = [number, number]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const asCoordinatePair = (value: unknown): PublishedCoordinate | null => {
  if (!Array.isArray(value) || value.length < 2) return null
  const lng = asNumber(value[0])
  const lat = asNumber(value[1])
  return lng === null || lat === null ? null : [lng, lat]
}

/**
 * `PublishedThing.location` is allowlist-projected, so its shape is whatever
 * the audience is cleared to read: GeoJSON geometry, a bare coordinate pair, or
 * flat lat/lng fields under any of the names the API has used across surfaces.
 * Read all three defensively and return `[lng, lat]` (GeoJSON order), or null
 * when nothing usable is present — the console never invents a coordinate.
 */
export const extractPublishedCoordinates = (
  location: Record<string, unknown>
): PublishedCoordinate | null => {
  if (!isRecord(location)) return null

  const geometry = isRecord(location.geometry) ? location.geometry : location
  const fromGeometry = asCoordinatePair(geometry.coordinates)
  if (fromGeometry) return fromGeometry

  const fromPair = asCoordinatePair(location.coordinates)
  if (fromPair) return fromPair

  const lng = asNumber(
    location.longitude ?? location.lng ?? location.lon ?? location.x
  )
  const lat = asNumber(location.latitude ?? location.lat ?? location.y)
  return lng === null || lat === null ? null : [lng, lat]
}

/** A published thing's display name, falling back to its id. */
export const publishedThingName = (thing: PublishedThing): string => {
  const candidate =
    thing.properties.name ?? thing.properties.title ?? thing.properties.label
  return typeof candidate === 'string' && candidate.trim() !== ''
    ? candidate
    : `Thing ${thing.thing_id}`
}

/** A published thing's type, read from its projected properties, or ''. */
export const publishedThingType = (thing: PublishedThing): string => {
  const candidate =
    thing.properties.thing_type ??
    thing.properties.thingType ??
    thing.properties.type
  return typeof candidate === 'string' ? candidate : ''
}

export type PublishedFeature = {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: PublishedCoordinate }
  properties: {
    thing_id: number
    name: string
    thing_type: string
    data_types: string
  }
}

export type PublishedFeatureCollection = {
  type: 'FeatureCollection'
  features: PublishedFeature[]
}

/** Only things that carry a readable coordinate become map features. */
export const publishedThingsToFeatures = (
  things: PublishedThing[]
): PublishedFeature[] =>
  things.flatMap((thing) => {
    const coordinates = extractPublishedCoordinates(thing.location)
    if (!coordinates) return []
    return [
      {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates },
        properties: {
          thing_id: thing.thing_id,
          name: publishedThingName(thing),
          thing_type: publishedThingType(thing),
          data_types: thing.data_types.join(', '),
        },
      },
    ]
  })

export const publishedThingsToFeatureCollection = (
  things: PublishedThing[]
): PublishedFeatureCollection | null => {
  const features = publishedThingsToFeatures(things)
  return features.length > 0 ? { type: 'FeatureCollection', features } : null
}

export type PublishedBounds = [PublishedCoordinate, PublishedCoordinate]

/**
 * South-west / north-east corners enclosing every mappable thing, or null when
 * none carry a coordinate. Used to frame the map from the data before its first
 * paint, so it opens at the right extent rather than animating out to it.
 */
export const publishedThingsBounds = (
  things: PublishedThing[]
): PublishedBounds | null => {
  const features = publishedThingsToFeatures(things)
  if (features.length === 0) return null

  const lngs = features.map((f) => f.geometry.coordinates[0])
  const lats = features.map((f) => f.geometry.coordinates[1])
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ]
}

const CORE_FIELDS = [
  'thing_id',
  'name',
  'thing_type',
  'data_types',
  'longitude',
  'latitude',
] as const

const flattenValue = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/**
 * The extra property columns to show beyond the core ones — the union of keys
 * across every thing, in first-seen order, with anything that would collide
 * with a core column dropped so the projected properties never shadow it.
 */
export const publishedPropertyKeys = (things: PublishedThing[]): string[] => {
  const seen = new Set<string>(CORE_FIELDS)
  const keys: string[] = []
  for (const thing of things) {
    for (const key of Object.keys(thing.properties)) {
      if (seen.has(key)) continue
      seen.add(key)
      keys.push(key)
    }
  }
  return keys
}

export type PublishedItemRow = {
  id: number
  thing_id: number
  name: string
  thing_type: string
  data_types: string
  longitude: number | null
  latitude: number | null
} & Record<string, unknown>

export const publishedThingsToRows = (
  things: PublishedThing[]
): PublishedItemRow[] =>
  things.map((thing) => {
    const coordinates = extractPublishedCoordinates(thing.location)
    const row: PublishedItemRow = {
      id: thing.thing_id,
      thing_id: thing.thing_id,
      name: publishedThingName(thing),
      thing_type: publishedThingType(thing),
      data_types: thing.data_types.join(', '),
      longitude: coordinates ? coordinates[0] : null,
      latitude: coordinates ? coordinates[1] : null,
    }
    for (const [key, value] of Object.entries(thing.properties)) {
      if (key in row) continue
      row[key] = flattenValue(value)
    }
    return row
  })

export const publishedThingsToCsv = (things: PublishedThing[]): string => {
  const fields = [...CORE_FIELDS, ...publishedPropertyKeys(things)]
  const rows = publishedThingsToRows(things)
  const data = rows.map((row) =>
    fields.map((field) => {
      const value = row[field]
      return value === null || value === undefined ? '' : value
    })
  )
  return Papa.unparse({ fields: [...fields], data })
}
