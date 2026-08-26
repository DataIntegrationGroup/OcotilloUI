import axios from 'axios'

/**
 * Forward geocoding against Photon, komoot's OpenStreetMap-backed search.
 *
 * Photon is key-free, like every other tile and data source in `basemaps.ts`,
 * and unlike Nominatim its usage policy permits search-as-you-type. Results
 * are OpenStreetMap data, so anything user-facing owes an "© OpenStreetMap
 * contributors" credit.
 */
const PHOTON_URL = 'https://photon.komoot.io/api'

/** Photon has no country filter, so US results are selected client side. */
const COUNTRY_CODE = 'us'

/** The subset of Photon's `properties` payload this module reads. */
export type PhotonProperties = {
  osm_id?: number | string
  osm_type?: string
  name?: string
  housenumber?: string
  street?: string
  city?: string
  district?: string
  locality?: string
  county?: string
  state?: string
  postcode?: string
  countrycode?: string
  /** Photon's own classification: city, county, state, street, house, … */
  type?: string
  extent?: unknown
}

export type PhotonFeature = {
  geometry?: { type?: string; coordinates?: unknown }
  properties?: PhotonProperties
}

export type GeocodeResult = {
  id: string
  label: string
  center: [number, number]
  bbox?: [number, number, number, number]
}

const isLonLat = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  typeof value[0] === 'number' &&
  typeof value[1] === 'number'

/**
 * Photon reports `extent` as [minLon, maxLat, maxLon, minLat] — north and
 * south are swapped relative to the [west, south, east, north] order that
 * MapLibre's `fitBounds` expects.
 */
const toBbox = (
  extent: unknown
): [number, number, number, number] | undefined => {
  if (
    !Array.isArray(extent) ||
    extent.length !== 4 ||
    !extent.every((entry) => typeof entry === 'number')
  ) {
    return undefined
  }

  const [west, north, east, south] = extent as number[]
  return [west, south, east, north]
}

/**
 * Photon returns address components rather than a single formatted string, so
 * the display label is composed here: the most specific name first, then the
 * containing place, state, and postcode, skipping repeats.
 */
const buildLabel = (properties: PhotonProperties | undefined): string => {
  const street = properties?.street
    ? [properties?.housenumber, properties.street].filter(Boolean).join(' ')
    : undefined
  const primary = properties?.name ?? street ?? properties?.postcode

  if (!primary) return ''

  const parts = [
    primary,
    properties?.name ? street : undefined,
    properties?.city ?? properties?.district ?? properties?.locality,
    properties?.county,
    properties?.state,
    properties?.postcode,
  ]

  const seen = new Set<string>()
  return parts
    .filter((part): part is string => Boolean(part))
    .filter((part) => {
      if (seen.has(part)) return false
      seen.add(part)
      return true
    })
    .join(', ')
}

/**
 * A query like "socorro" matches both the city and the county, and both
 * compose to the same label. Where that happens, Photon's own classification
 * is appended so the two rows are told apart.
 */
const disambiguate = (
  entries: { result: GeocodeResult; kind?: string }[]
): GeocodeResult[] => {
  const labelCounts = new Map<string, number>()
  for (const { result } of entries) {
    labelCounts.set(result.label, (labelCounts.get(result.label) ?? 0) + 1)
  }

  return entries.map(({ result, kind }) =>
    kind && (labelCounts.get(result.label) ?? 0) > 1
      ? { ...result, label: `${result.label} (${kind})` }
      : result
  )
}

export const normalizePhotonFeatures = (
  features: readonly PhotonFeature[] | null | undefined
): GeocodeResult[] => {
  if (!Array.isArray(features)) return []

  const entries = features.flatMap((feature, index) => {
    const center = feature?.geometry?.coordinates
    if (!isLonLat(center)) return []

    const properties = feature?.properties
    if (String(properties?.countrycode ?? '').toLowerCase() !== COUNTRY_CODE) {
      return []
    }

    const label = buildLabel(properties)
    if (!label) return []

    const bbox = toBbox(properties?.extent)

    return [
      {
        result: {
          id: `${properties?.osm_type ?? 'x'}${properties?.osm_id ?? ''}-${index}`,
          label,
          center: [center[0], center[1]] as [number, number],
          ...(bbox ? { bbox } : {}),
        },
        kind: properties?.type,
      },
    ]
  })

  return disambiguate(entries)
}

/**
 * Forward geocode a free-text place query (address, town, landmark, ZIP).
 * Results are biased toward the current map center when `proximity` is given.
 */
export const geocodePlaces = async (
  query: string,
  options: {
    proximity?: [number, number]
    limit?: number
    signal?: AbortSignal
  } = {}
): Promise<GeocodeResult[]> => {
  const trimmed = query.trim()
  if (!trimmed) return []

  const limit = options.limit ?? 5

  const response = await axios.get(PHOTON_URL, {
    params: {
      q: trimmed,
      lang: 'en',
      // Over-fetch so the client-side US filter can still fill the list.
      limit: limit * 3,
      ...(options.proximity
        ? { lon: options.proximity[0], lat: options.proximity[1] }
        : {}),
    },
    signal: options.signal,
  })

  return normalizePhotonFeatures(response.data?.features).slice(0, limit)
}
