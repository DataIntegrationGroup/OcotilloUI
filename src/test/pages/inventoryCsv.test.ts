import { describe, expect, it } from 'vitest'
import {
  buildTemplateCsv,
  mapRecordsToDrafts,
} from '@/pages/geothermal/wells/inventoryCsv'
import { ALL_FIELDS } from '@/pages/geothermal/wells/inventoryFields'

describe('mapRecordsToDrafts', () => {
  it('maps recognized headers, coercing number fields', () => {
    const { rows, unknownHeaders } = mapRecordsToDrafts(
      [{ name: 'GEO-1', total_depth: '3300', county: 'Otero' }],
      ['name', 'total_depth', 'county']
    )
    expect(unknownHeaders).toEqual([])
    expect(rows).toEqual([
      { name: 'GEO-1', total_depth: 3300, county: 'Otero' },
    ])
  })

  it('matches headers case-insensitively and trimmed', () => {
    const { rows } = mapRecordsToDrafts(
      [{ ' Name ': 'GEO-2', COUNTY: 'Grant' }],
      [' Name ', 'COUNTY']
    )
    expect(rows).toEqual([{ name: 'GEO-2', county: 'Grant' }])
  })

  it('collects unknown headers and ignores their values', () => {
    const { rows, unknownHeaders } = mapRecordsToDrafts(
      [{ name: 'GEO-3', bogus: 'x' }],
      ['name', 'bogus']
    )
    expect(unknownHeaders).toEqual(['bogus'])
    expect(rows).toEqual([{ name: 'GEO-3' }])
  })

  it('drops unparseable numbers and skips fully-empty rows', () => {
    const { rows } = mapRecordsToDrafts(
      [
        { name: 'GEO-4', total_depth: 'not-a-number' },
        { name: '', county: '' },
      ],
      ['name', 'total_depth', 'county']
    )
    expect(rows).toEqual([{ name: 'GEO-4' }])
  })
})

describe('buildTemplateCsv', () => {
  it('emits a header row of every field name', () => {
    const header = buildTemplateCsv().split(/\r?\n/)[0]
    expect(header.split(',')).toEqual(ALL_FIELDS)
  })
})
