import { describe, expect, it } from 'vitest'
import { buildWeaverLocationUrl } from '@/utils/wellPublicUrls'
import { buildWeaverQrDataUrl } from '@/components/pdf/chemistry/wellQrCode'
import {
  CHEMISTRY_REPORT_DEFAULT_SECTIONS,
  CHEMISTRY_REPORT_SECTION_LABELS,
} from '@/components/pdf/chemistry'

describe('buildWeaverLocationUrl', () => {
  it('builds a location URL from the point id', () => {
    expect(buildWeaverLocationUrl('WL-0260')).toBe(
      'https://weaver.newmexicowaterdata.org/location/WL-0260'
    )
  })

  it('returns null without a point id, rather than a URL that would 404', () => {
    expect(buildWeaverLocationUrl(null)).toBeNull()
    expect(buildWeaverLocationUrl('   ')).toBeNull()
  })

  it('escapes point ids that are not URL safe', () => {
    expect(buildWeaverLocationUrl('WL 1/2')).toBe(
      'https://weaver.newmexicowaterdata.org/location/WL%201%2F2'
    )
  })
})

describe('buildWeaverQrDataUrl', () => {
  it('encodes a PNG data URI for a well with a point id', async () => {
    const dataUrl = await buildWeaverQrDataUrl('WL-0260')
    expect(dataUrl).toMatch(/^data:image\/png;base64,/)
  })

  it('returns null when there is nothing to link to', async () => {
    await expect(buildWeaverQrDataUrl(undefined)).resolves.toBeNull()
  })
})

describe('chemistry report sections', () => {
  it('defaults the detail sections off', () => {
    expect(CHEMISTRY_REPORT_DEFAULT_SECTIONS.fieldParameters).toBe(false)
    expect(CHEMISTRY_REPORT_DEFAULT_SECTIONS.samplingNotes).toBe(false)
  })

  it('labels every section, so the export page can list them all', () => {
    for (const key of Object.keys(CHEMISTRY_REPORT_DEFAULT_SECTIONS)) {
      expect(CHEMISTRY_REPORT_SECTION_LABELS).toHaveProperty(key)
    }
  })
})
