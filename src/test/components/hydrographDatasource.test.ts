import { describe, expect, it } from 'vitest'
import {
  buildFieldSheetHydrographOptions,
  buildHydrographDatasource,
} from '@/pages/ocotillo/thing/hydrographDatasource'

describe('buildHydrographDatasource', () => {
  const well = { id: 217, name: 'WL-0217' }

  it('returns [] for no observations', () => {
    expect(buildHydrographDatasource(well, [])).toEqual([])
    expect(buildHydrographDatasource(well, undefined)).toEqual([])
  })

  it('drops rows without a datetime or a numeric value, sorts oldest first', () => {
    const [series] = buildHydrographDatasource(well, [
      { observation_datetime: '2026-10-21T17:00:00Z', value: 41.62, depth_to_water_bgs: 39.52 },
      { observation_datetime: null, value: 40, depth_to_water_bgs: 38 },
      { observation_datetime: '2025-01-01T00:00:00Z', value: null, depth_to_water_bgs: 37 },
      { observation_datetime: '2026-04-14T17:00:00Z', value: 41.28, depth_to_water_bgs: 39.18 },
    ])
    expect(series.id).toBe(217)
    expect(series.name).toBe('WL-0217')
    expect(series.style).toBe('scatter')
    expect(series.data).toEqual([
      { phenomenonTime: '2026-04-14T17:00:00Z', result: 39.18 },
      { phenomenonTime: '2026-10-21T17:00:00Z', result: 39.52 },
    ])
  })

  it('returns [] when every row is dropped, and names an unnamed well', () => {
    expect(buildHydrographDatasource(well, [{ observation_datetime: '2026-01-01' }])).toEqual([])
    const [series] = buildHydrographDatasource(null, [
      { observation_datetime: '2026-01-01T00:00:00Z', value: 1, depth_to_water_bgs: 1 },
    ])
    expect(series.id).toBe(0)
    expect(series.name).toBe('Depth to Water')
  })

  it('field-sheet chart options keep the 30% annotation margin', () => {
    expect(buildFieldSheetHydrographOptions({ invertYAxis: true })).toMatchObject({
      invertYAxis: true,
      rightPaddingPercent: 30,
    })
  })
})
