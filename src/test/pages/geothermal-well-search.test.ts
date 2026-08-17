import { describe, expect, it } from 'vitest'
import type { IWell } from '@/interfaces/geothermal'
import {
  buildWellSearchParams,
  isSelectableWell,
  moveActiveIndex,
  wellSearchDetail,
  wellSearchLabel,
  WELL_SEARCH_PAGE_SIZE,
} from '@/pages/geothermal/wells/wellSearch'

const well = (overrides: Partial<IWell>): IWell =>
  ({ well_data_id: 'WDI-1', ...overrides }) as IWell

describe('wellSearchLabel', () => {
  it('prefers the name, then the API, then the well number, then the id', () => {
    expect(wellSearchLabel(well({ name: 'Jemez 1', api: '30-043-2' }))).toBe(
      'Jemez 1'
    )
    expect(wellSearchLabel(well({ name: null, api: '30-043-2' }))).toBe(
      '30-043-2'
    )
    expect(
      wellSearchLabel(well({ name: null, api: null, well_number: '7' }))
    ).toBe('7')
    expect(wellSearchLabel(well({ name: null, api: null }))).toBe('WDI-1')
  })

  it('treats a whitespace-only name as absent', () => {
    expect(wellSearchLabel(well({ name: '   ', api: '30-043-2' }))).toBe(
      '30-043-2'
    )
  })
})

describe('wellSearchDetail', () => {
  it('joins only the parts the well actually has', () => {
    expect(
      wellSearchDetail(
        well({
          api: '30-043-2',
          well_type: 'Geothermal',
          status: 'Plugged',
          county: 'Sandoval',
          operator: 'NMBGMR',
        })
      )
    ).toBe('30-043-2 · Geothermal · Plugged · Sandoval · NMBGMR')

    // No stray separators when most fields are empty.
    expect(wellSearchDetail(well({ county: 'Sandoval' }))).toBe('Sandoval')
    expect(wellSearchDetail(well({}))).toBe('')
  })
})

describe('buildWellSearchParams', () => {
  it('sends the term as q, trimmed', () => {
    expect(
      buildWellSearchParams({ term: '  jemez ', pageSize: WELL_SEARCH_PAGE_SIZE })
    ).toEqual({ q: 'jemez', size: WELL_SEARCH_PAGE_SIZE })
  })

  it('omits q entirely when the box is empty', () => {
    // An empty box lists the first page; it must not search for "".
    expect(buildWellSearchParams({ term: '', pageSize: 50 })).toEqual({
      size: 50,
    })
    expect(buildWellSearchParams({ term: '   ', pageSize: 50 })).toEqual({
      size: 50,
    })
  })
})

describe('moveActiveIndex', () => {
  it('enters the list from either end', () => {
    expect(moveActiveIndex(-1, 1, 3)).toBe(0)
    expect(moveActiveIndex(-1, -1, 3)).toBe(2)
  })

  it('wraps at both ends so a held key cycles', () => {
    expect(moveActiveIndex(2, 1, 3)).toBe(0)
    expect(moveActiveIndex(0, -1, 3)).toBe(2)
    expect(moveActiveIndex(0, 1, 3)).toBe(1)
  })

  it('has nothing to highlight in an empty list', () => {
    expect(moveActiveIndex(-1, 1, 0)).toBe(-1)
    expect(moveActiveIndex(0, 1, 0)).toBe(-1)
  })
})

describe('isSelectableWell', () => {
  it('drops rows that cannot be routed to', () => {
    expect(isSelectableWell(well({ well_data_id: 'WDI-1' }))).toBe(true)
    expect(isSelectableWell(well({ well_data_id: '' }))).toBe(false)
    expect(
      isSelectableWell(well({ well_data_id: null as unknown as string }))
    ).toBe(false)
  })
})
