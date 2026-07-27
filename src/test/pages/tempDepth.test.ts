import { describe, expect, it } from 'vitest'
import {
  TEMP_DEPTH_FIELDS,
  buildTempDepthTemplate,
  isBlankPoint,
  makeBlankPoint,
  mapRecordsToPoints,
} from '@/pages/geothermal/wells/tempDepth'

describe('mapRecordsToPoints', () => {
  it('maps the legacy export headers, coercing numbers', () => {
    const { points, unknownHeaders } = mapRecordsToPoints(
      [
        {
          Depth_m: '112',
          Depth_ft: '367.45',
          Resistance: '107065.7',
          Temp_F: '74.96',
          Temp_C: '23.867',
          Gradient_C_km: '46.2',
        },
      ],
      ['Depth_m', 'Depth_ft', 'Resistance', 'Temp_F', 'Temp_C', 'Gradient_C_km']
    )
    expect(unknownHeaders).toEqual([])
    expect(points).toEqual([
      {
        depth_m: 112,
        depth_ft: 367.45,
        temp_f: 74.96,
        temp_c: 23.867,
        resistance: 107065.7,
        gradient_c_km: 46.2,
        comment: null,
      },
    ])
  })

  it('reports unknown headers (dup/blank/formation-note columns) and ignores them', () => {
    const { points, unknownHeaders } = mapRecordsToPoints(
      [{ Depth_ft: '367', Temp: '74.9', Depth_ft_1: '367', 'In Camp Rice Formation': 'fine slots' }],
      ['Depth_ft', 'Temp', 'Depth_ft_1', '', 'In Camp Rice Formation']
    )
    // Temp (legacy alias) maps to temp_c; dup + note columns are reported.
    expect(unknownHeaders).toEqual(['Depth_ft_1', 'In Camp Rice Formation'])
    expect(points[0].depth_ft).toBe(367)
    expect(points[0].temp_c).toBe(74.9)
  })

  it('skips rows with no recognized values and drops unparseable numbers', () => {
    const { points } = mapRecordsToPoints(
      [
        { Depth_ft: '', Temp_C: '' },
        { Depth_ft: 'abc', Temp_C: '25', Comments: 'note' },
      ],
      ['Depth_ft', 'Temp_C', 'Comments']
    )
    expect(points).toHaveLength(1)
    expect(points[0]).toMatchObject({ depth_ft: null, temp_c: 25, comment: 'note' })
  })
})

describe('temp-depth helpers', () => {
  it('buildTempDepthTemplate emits a header row of every field', () => {
    const header = buildTempDepthTemplate().split(/\r?\n/)[0]
    expect(header.split(',')).toEqual(TEMP_DEPTH_FIELDS)
  })

  it('isBlankPoint is true only for untouched points', () => {
    expect(isBlankPoint(makeBlankPoint())).toBe(true)
    expect(isBlankPoint({ ...makeBlankPoint(), depth_ft: 1 })).toBe(false)
  })
})
