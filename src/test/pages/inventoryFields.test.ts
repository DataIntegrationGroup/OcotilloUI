import { describe, expect, it } from 'vitest'
import {
  validateApi,
  validatePlss,
  validateDraft,
  isBlankDraft,
  cleanDraft,
  formatCoord,
} from '@/pages/geothermal/wells/inventoryFields'

describe('validateApi', () => {
  it('accepts SS-CCC-NNNNN with 4 or 5 trailing digits', () => {
    expect(validateApi('30-039-05212')).toBeUndefined()
    expect(validateApi('30-039-0521')).toBeUndefined()
    expect(validateApi(' 30-039-05212 ')).toBeUndefined()
  })

  it('rejects malformed API numbers with guidance', () => {
    for (const bad of ['99', '30-39-05212', '30-039-052', 'abc', '3003905212']) {
      expect(validateApi(bad)).toMatch(/SS-CCC-NNNNN/)
    }
  })
})

describe('validatePlss', () => {
  it('accepts township-range-section forms', () => {
    expect(validatePlss('T24N R5W S33')).toBeUndefined()
    expect(validatePlss('24N 5W 33 SE-SE')).toBeUndefined()
    expect(validatePlss('t24n r5w sec. 33')).toBeUndefined()
  })

  it('rejects non-PLSS text with guidance', () => {
    for (const bad of ['', 'somewhere', 'T24 R5 S33', '24N 33']) {
      expect(validatePlss(bad)).toMatch(/PLSS/)
    }
  })
})

describe('validateDraft', () => {
  const valid = {
    name: 'GEO-1',
    api: '30-039-05212',
    well_type: 'Wildcat',
    latitude: 35.1,
    longitude: -106.2,
  }

  it('passes a draft with all required fields and valid formats', () => {
    expect(validateDraft(valid)).toEqual({})
  })

  it('flags missing required fields with actionable messages', () => {
    const errors = validateDraft({ name: 'GEO-1' })
    expect(errors.api).toMatch(/required/)
    expect(errors.latitude).toMatch(/required/)
    expect(errors.longitude).toMatch(/required/)
    expect(errors.well_type).toMatch(/required/)
    expect(errors.name).toBeUndefined()
  })

  it('runs per-field validators on non-empty values only', () => {
    expect(validateDraft({ ...valid, api: '99' }).api).toMatch(/SS-CCC-NNNNN/)
    expect(validateDraft({ ...valid, plss: 'nope' }).plss).toMatch(/PLSS/)
    // Empty optional field with a validator → no error.
    expect(validateDraft(valid).plss).toBeUndefined()
  })
})

describe('draft helpers', () => {
  it('isBlankDraft treats empty/false-only drafts as blank', () => {
    expect(isBlankDraft({})).toBe(true)
    expect(isBlankDraft({ has_geothermal_data: false })).toBe(true)
    expect(isBlankDraft({ name: 'x' })).toBe(false)
  })

  it('cleanDraft strips empty fields but keeps false and 0', () => {
    expect(
      cleanDraft({ name: 'x', api: '', county: null, total_depth: 0, has_geothermal_data: false })
    ).toEqual({ name: 'x', total_depth: 0, has_geothermal_data: false })
  })

  it('formatCoord rounds display to 7 decimal places', () => {
    expect(formatCoord(35.68234567891)).toBe('35.6823457')
    expect(formatCoord(-106.7)).toBe('-106.7')
  })
})
