import type { IObservation, IWell } from '@/interfaces/ocotillo'
import { buildWeaverLocationUrl } from '@/utils/wellPublicUrls'

/**
 * Page-2 (owner sheet) data. One builder, fed by the well's own observation
 * records — the mock supplies the fixture, the real route will supply the API
 * records. Same signature either way.
 */
export type PacketSource = {
  well: Partial<IWell>
  observations: readonly Partial<IObservation>[]
}

export type PacketReading = {
  dateIso: string   // 'YYYY-MM-DD', first 10 chars of observation_datetime
  dateLabel: string // 'Nov 5, 2026'
  dtwFt: number
  mpHtFt: number | null
  levelStatus: string
}

export type PacketData = {
  siteName: string
  pointId: string
  wellDepthFt: number | null
  oseNumber: string | null
  readings: PacketReading[]
  /** Easting as printed on page 1 — thousands separators, no "ft", no datum. `—` when absent. */
  easting: string
  /** Northing as printed on page 1 — thousands separators, no "ft", no datum. `—` when absent. */
  northing: string
  /** Weaver location URL the owner scans/reads; null when the well has no point id. */
  locationUrl: string | null
  /** Synchronous SVG QR of that same URL, or null — the caller decides placeholder vs code. */
  qrDataUrl: string | null
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Deterministic: parses the ISO date part as text, never through Date/locale,
 * so the label cannot shift with the box timezone or with ICU data.
 */
export function formatReadingDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  const mi = Number(m) - 1
  if (!y || !MONTHS[mi] || !d) return iso
  return `${MONTHS[mi]} ${Number(d)}, ${y}`
}

export function buildPacketData(
  source: PacketSource,
  /** Pre-rendered bitmap QR (PNG data URI). The packet builder is synchronous, so the
   *  caller supplies the async-generated bitmap; null → the page prints the literal. */
  qrDataUrl: string | null = null
): PacketData {
  const { well, observations } = source

  const readings: PacketReading[] = observations
    .filter(
      (o) =>
        typeof o.depth_to_water_bgs === 'number' &&
        Number.isFinite(o.depth_to_water_bgs) &&
        typeof o.observation_datetime === 'string' &&
        Number.isFinite(Date.parse(o.observation_datetime))
    )
    .map((o) => ({ o, t: Date.parse(o.observation_datetime as string) }))
    .sort((a, b) => b.t - a.t) // newest first; ties keep fixture order
    .map(({ o }) => {
      const iso = (o.observation_datetime as string).slice(0, 10)
      const mp = o.measuring_point_height
      return {
        dateIso: iso,
        dateLabel: formatReadingDate(iso),
        dtwFt: o.depth_to_water_bgs as number,
        mpHtFt: typeof mp === 'number' && Number.isFinite(mp) ? mp : null,
        levelStatus: (o.level_status ?? '').trim(),
      }
    })

  const pointRef = (well.name ?? '').trim() || String(well.id ?? '')
  const depth = well.well_depth

  // NAD83 UTM metres from the well; page 1 prints with thousands separators,
  // no "ft", no datum suffix. A record without UTM prints em-dash (never blank).
  const utm = (well as { utm?: { easting?: number | null; northing?: number | null } }).utm ?? {}
  const fmtUtm = (v: number | null | undefined): string =>
    typeof v === 'number' && Number.isFinite(v) ? v.toLocaleString('en-US') : '—'

  return {
    siteName: (well.site_name ?? '').trim() || pointRef || '—',
    pointId: pointRef || '—',
    wellDepthFt: typeof depth === 'number' && Number.isFinite(depth) ? depth : null,
    oseNumber: null,
    readings,
    easting: fmtUtm(utm.easting),
    northing: fmtUtm(utm.northing),
    locationUrl: buildWeaverLocationUrl(pointRef),
    qrDataUrl,
  }
}
