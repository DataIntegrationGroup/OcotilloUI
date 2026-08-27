import QRCode from 'qrcode'
import { buildWeaverLocationUrl } from '@/utils/wellPublicUrls'

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
