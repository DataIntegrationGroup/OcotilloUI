import { useQuery } from '@tanstack/react-query'
import { settings } from '@/settings'

// Fetches USGS monitoring location metadata for a given site number from the
// OGC API (api.waterdata.usgs.gov/ogcapi), along with the field labels and
// descriptions the service publishes for itself.
//
// This replaces the legacy NWIS RDB site service (waterservices.usgs.gov),
// which USGS has largely decommissioned.

const API_URL = settings.usgs_nwis_ogc_api_url
const COLLECTION = 'monitoring-locations'

export type USGSSiteRecord = Record<string, string>

export type USGSSiteInfo = {
  record: USGSSiteRecord
  /** Property name -> the title the API documents for it, e.g. site_type_code -> "Monitoring location type code". */
  labels: Record<string, string>
  /** Property name -> the API's description of that field. */
  descriptions: Record<string, string>
  latitude: number | null
  longitude: number | null
  url: string
}

type Queryables = {
  labels: Record<string, string>
  descriptions: Record<string, string>
}

type Feature = {
  id?: string
  geometry?: { type?: string; coordinates?: [number, number] } | null
  properties?: Record<string, unknown> | null
}

// The collection describes its own fields, so labels and descriptions come from
// the API rather than being hard-coded here.
const fetchQueryables = async (): Promise<Queryables> => {
  const res = await fetch(
    `${API_URL}/collections/${COLLECTION}/queryables?f=json`
  )
  if (!res.ok) {
    throw new Error(`USGS queryables request failed with status ${res.status}`)
  }

  const body = (await res.json()) as {
    properties?: Record<string, { title?: string; description?: string }>
  }

  const labels: Record<string, string> = {}
  const descriptions: Record<string, string> = {}

  for (const [name, schema] of Object.entries(body.properties ?? {})) {
    if (schema?.title) labels[name] = schema.title
    if (schema?.description) descriptions[name] = schema.description.trim()
  }

  return { labels, descriptions }
}

// The field definitions are effectively static, so they are fetched once per
// session and shared by every site lookup. A failed attempt is not cached.
let queryablesPromise: Promise<Queryables> | null = null

const loadQueryables = (): Promise<Queryables> => {
  queryablesPromise ??= fetchQueryables().catch((error) => {
    queryablesPromise = null
    throw error
  })

  return queryablesPromise
}

/** Drops the agency prefix so both "USGS-01234567" and "01234567" resolve. */
const toSiteNumber = (site_no: string): string => {
  const trimmed = site_no.trim()
  const separator = trimmed.indexOf('-')
  return separator === -1 ? trimmed : trimmed.slice(separator + 1)
}

// Flattens a GeoJSON feature's properties into the string record the summary
// builders consume. Nulls and blanks are dropped so they never render.
const toRecord = (feature: Feature): USGSSiteRecord => {
  const record: USGSSiteRecord = {}

  if (feature.id) record['id'] = String(feature.id)

  for (const [key, value] of Object.entries(feature.properties ?? {})) {
    if (value == null) continue

    const text = String(value).trim()
    if (text) record[key] = text
  }

  return record
}

const fetchSiteInfo = async (site_no: string): Promise<USGSSiteInfo | null> => {
  const url = new URL(`${API_URL}/collections/${COLLECTION}/items`)
  url.search = new URLSearchParams({
    monitoring_location_number: toSiteNumber(site_no),
    f: 'json',
    limit: '1',
  }).toString()

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`USGS site info request failed with status ${res.status}`)
  }

  const body = (await res.json()) as { features?: Feature[] }
  const feature = body.features?.[0]
  if (!feature) return null

  // Field definitions are a presentation nicety; a site still renders without them.
  const { labels, descriptions } = await loadQueryables().catch(() => ({
    labels: {},
    descriptions: {},
  }))

  const [longitude, latitude] = feature.geometry?.coordinates ?? []

  return {
    record: toRecord(feature),
    labels,
    descriptions,
    latitude: typeof latitude === 'number' ? latitude : null,
    longitude: typeof longitude === 'number' ? longitude : null,
    url: url.toString(),
  }
}

// React Query hook used by USGSInfoCard; skips fetch when site_no is missing or "N/A".
export const useUSGSSiteInfo = (site_no: string) => {
  const normalizedSiteNo = site_no?.trim()
  const hasValidSiteNo = Boolean(normalizedSiteNo) && normalizedSiteNo !== 'N/A'

  return useQuery({
    queryKey: ['site_no', normalizedSiteNo],
    queryFn: () => fetchSiteInfo(normalizedSiteNo),
    enabled: hasValidSiteNo,
    staleTime: 5 * 60 * 1000, // matches the other well-show queries
    gcTime: 10 * 60 * 1000,
  })
}
