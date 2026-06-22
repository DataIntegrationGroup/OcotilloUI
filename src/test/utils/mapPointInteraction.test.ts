import { describe, expect, it } from 'vitest'

import {
  getDistinctMapPoints,
  getMapPointBounds,
} from '@/utils/mapPointInteraction'

const point = (id: number, coordinates: [number, number], layer: string) => ({
  geometry: { type: 'Point', coordinates },
  layer: { id: layer },
  properties: { thing_id: id },
})

describe('map point interaction', () => {
  it('deduplicates one well rendered in multiple data layers', () => {
    const features = [
      point(42, [-106.1, 35.1], 'location-ogc-water-wells'),
      point(42, [-106.1, 35.1], 'location-ogc-latest-depth-to-water'),
    ]

    expect(getDistinctMapPoints(features)).toEqual([features[0]])
  })

  it('keeps distinct wells and calculates bounds for zooming', () => {
    const features = [
      point(42, [-106.2, 35.1], 'location-ogc-water-wells'),
      point(43, [-106.1, 35.2], 'location-ogc-water-wells'),
    ]

    const distinctPoints = getDistinctMapPoints(features)

    expect(distinctPoints).toHaveLength(2)
    expect(getMapPointBounds(distinctPoints)).toEqual([
      [-106.2, 35.1],
      [-106.1, 35.2],
    ])
  })

  it('ignores labels and non-point features', () => {
    const features = [
      point(42, [-106.1, 35.1], 'location-label-ogc-water-wells'),
      {
        geometry: { type: 'Polygon', coordinates: [] },
        layer: { id: 'location-ogc-water-wells' },
        properties: { thing_id: 43 },
      },
    ]

    expect(getDistinctMapPoints(features)).toEqual([])
  })

  it('returns same coordinate bounds for overlapping distinct wells', () => {
    const features = [
      point(42, [-106.1, 35.1], 'location-ogc-water-wells'),
      point(43, [-106.1, 35.1], 'location-ogc-water-wells'),
    ]

    const distinctPoints = getDistinctMapPoints(features)

    expect(distinctPoints).toHaveLength(2)
    expect(getMapPointBounds(distinctPoints)).toEqual([
      [-106.1, 35.1],
      [-106.1, 35.1],
    ])
  })
})
