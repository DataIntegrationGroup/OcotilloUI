import { describe, expect, it, vi } from 'vitest'

import { queryRenderedFeaturesSafely } from '@/utils/queryRenderedFeaturesSafely'

const feature = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-106.4, 34.5] },
  properties: {},
} as const

describe('queryRenderedFeaturesSafely', () => {
  it('returns no features when the map is unavailable', () => {
    expect(queryRenderedFeaturesSafely(null)).toEqual([])
  })

  it('returns no features while the map is loading', () => {
    const queryRenderedFeatures = vi.fn()
    const map = {
      loaded: () => false,
      queryRenderedFeatures,
    }

    expect(queryRenderedFeaturesSafely(map as never)).toEqual([])
    expect(queryRenderedFeatures).not.toHaveBeenCalled()
  })

  it('passes through successful queries and their arguments', () => {
    const queryRenderedFeatures = vi.fn().mockReturnValue([feature])
    const map = {
      loaded: () => true,
      queryRenderedFeatures,
    }
    const point: [number, number] = [12, 24]
    const options = { layers: ['locations'] }

    expect(queryRenderedFeaturesSafely(map as never, point, options)).toEqual([
      feature,
    ])
    expect(queryRenderedFeatures).toHaveBeenCalledWith(point, options)
  })

  it('returns no features when the map library throws', () => {
    const queryRenderedFeatures = vi.fn(() => {
      throw new TypeError('transient style state')
    })
    const map = {
      loaded: () => true,
      queryRenderedFeatures,
    }

    expect(queryRenderedFeaturesSafely(map as never)).toEqual([])
  })
})
