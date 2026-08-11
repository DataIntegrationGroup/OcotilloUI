import { describe, expect, it } from 'vitest'
import { parseProjectBoundaryGeoJson } from '@/utils/projectBoundary'

const SQUARE = [
  [
    [-106.5, 34.5],
    [-106.4, 34.5],
    [-106.4, 34.6],
    [-106.5, 34.6],
    [-106.5, 34.5],
  ],
]

const polygon = (coordinates = SQUARE) => ({ type: 'Polygon', coordinates })

const parse = (value: unknown) =>
  parseProjectBoundaryGeoJson(JSON.stringify(value))

const errorOf = (result: ReturnType<typeof parseProjectBoundaryGeoJson>) =>
  'error' in result ? result.error : null

describe('parseProjectBoundaryGeoJson', () => {
  it('emits MULTIPOLYGON WKT, the only type the API accepts', () => {
    expect(parse(polygon())).toEqual({
      wkt: 'MULTIPOLYGON (((-106.5 34.5, -106.4 34.5, -106.4 34.6, -106.5 34.6, -106.5 34.5)))',
    })
  })

  it('accepts a Feature and a single-feature FeatureCollection', () => {
    const feature = { type: 'Feature', properties: {}, geometry: polygon() }

    expect(parse(feature)).toHaveProperty('wkt')
    expect(
      parse({ type: 'FeatureCollection', features: [feature] })
    ).toHaveProperty('wkt')
  })

  it('accepts a MultiPolygon with exactly one part', () => {
    expect(
      parse({ type: 'MultiPolygon', coordinates: [SQUARE] })
    ).toHaveProperty('wkt')
  })

  it('rejects multiple features', () => {
    const feature = { type: 'Feature', properties: {}, geometry: polygon() }
    const result = parse({
      type: 'FeatureCollection',
      features: [feature, feature],
    })

    expect(errorOf(result)).toContain('2 features')
  })

  it('rejects a multi-part MultiPolygon', () => {
    const result = parse({
      type: 'MultiPolygon',
      coordinates: [SQUARE, SQUARE],
    })

    expect(errorOf(result)).toContain('2 parts')
  })

  it('rejects non-polygon geometry', () => {
    const result = parse({ type: 'Point', coordinates: [-106.5, 34.5] })

    expect(errorOf(result)).toContain('"Point"')
  })

  it('rejects invalid JSON', () => {
    expect(errorOf(parseProjectBoundaryGeoJson('{oops'))).toContain(
      'not valid JSON'
    )
  })

  it('rejects an unclosed ring', () => {
    const result = parse(polygon([SQUARE[0].slice(0, 4)]))

    expect(errorOf(result)).toContain('closed')
  })

  it('rejects a ring with too few positions', () => {
    const result = parse(polygon([SQUARE[0].slice(0, 3)]))

    expect(errorOf(result)).toContain('four positions')
  })

  it('rejects coordinates outside WGS84 bounds', () => {
    const projected = SQUARE[0].map(([lon, lat]) => [
      lon * 10_000,
      lat * 10_000,
    ])
    const result = parse(polygon([projected]))

    expect(errorOf(result)).toContain('WGS84')
  })

  it('rejects non-numeric coordinates', () => {
    const strings = [
      ['a', 'b'],
      ['c', 'd'],
      ['e', 'f'],
      ['a', 'b'],
    ] as unknown as number[][]
    const result = parse(polygon([strings]))

    expect(errorOf(result)).toContain('numeric')
  })
})
