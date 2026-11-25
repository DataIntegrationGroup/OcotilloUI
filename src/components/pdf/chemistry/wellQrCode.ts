import QRCode from 'qrcode'
import { buildWeaverLocationUrl } from '@/utils/wellPublicUrls'

/** Shared encoder: PNG data URI for `url`, or null when the encode fails. */
const encodeQrDataUrl = async (url: string): Promise<string | null> => {
  try {
    return await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 0,
      scale: 8,
      color: { dark: '#000000ff', light: '#ffffffff' },
    })
  } catch {
    return null
  }
}

/**
 * PNG data URI of a QR code pointing at the well's Weaver location page, for
 * embedding in the report masthead. Returns null when the well has no point id
 * or the encode fails — the report prints fine without the code, so a failure
 * here must not take the whole PDF down.
 */
export const buildWeaverQrDataUrl = async (
  pointId: string | null | undefined
): Promise<string | null> => {
  const url = buildWeaverLocationUrl(pointId)
  if (!url) return null
  return encodeQrDataUrl(url)
}

const isCoord = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** Google Maps link at the well, 5-decimal lat/lon (the precision page 1 prints). */
export const buildGoogleMapsUrl = (
  lat: number | null | undefined,
  lon: number | null | undefined
): string | null =>
  isCoord(lat) && isCoord(lon)
    ? `https://www.google.com/maps?q=${lat.toFixed(5)},${lon.toFixed(5)}`
    : null

/**
 * Page-1 QR (field sheet ident block): Google Maps at the well coordinates.
 * Same encoder and failure contract as the Weaver QR — null when the well has
 * no coordinates or the encode fails.
 */
export const buildGoogleMapsQrDataUrl = async (
  lat: number | null | undefined,
  lon: number | null | undefined
): Promise<string | null> => {
  const url = buildGoogleMapsUrl(lat, lon)
  if (!url) return null
  return encodeQrDataUrl(url)
}

type WellWithPoint = {
  current_location?: { geometry?: { coordinates?: unknown } | null } | null
}

/** Convenience for call sites: reads GeoJSON [lon, lat, z] off the well. */
export const buildWellMapsQrDataUrl = (
  well: WellWithPoint | null | undefined
): Promise<string | null> => {
  const coords = well?.current_location?.geometry?.coordinates
  const [lon, lat] = Array.isArray(coords) ? (coords as unknown[]) : []
  return buildGoogleMapsQrDataUrl(lat as number, lon as number)
}
