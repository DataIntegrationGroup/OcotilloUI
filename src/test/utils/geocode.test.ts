import { describe, expect, it } from 'vitest'

import {
  normalizePhotonFeatures,
  type PhotonFeature,
  type PhotonProperties,
} from '@/utils/geocode'

const feature = (
  properties: PhotonProperties,
  coordinates = [-106.9, 34.06]
): PhotonFeature => ({
  geometry: { type: 'Point', coordinates },
  properties: { countrycode: 'US', ...properties },
})

describe('normalizePhotonFeatures', () => {
  it('composes a label from Photon address components', () => {
    const results = normalizePhotonFeatures([
      feature({
        osm_type: 'N',
        osm_id: 1,
        housenumber: '801',
        street: 'Leroy Place',
        city: 'Socorro',
        state: 'New Mexico',
        postcode: '87801',
      }),
    ])

    expect(results).toHaveLength(1)
    expect(results[0].label).toBe('801 Leroy Place, Socorro, New Mexico, 87801')
    expect(results[0].center).toEqual([-106.9, 34.06])
  })

  it('reorders the Photon extent into west/south/east/north', () => {
    const [result] = normalizePhotonFeatures([
      feature({
        osm_type: 'R',
        osm_id: 2,
        name: 'Socorro',
        state: 'New Mexico',
        extent: [-106.95, 34.1, -106.83, 34.0],
      }),
    ])

    expect(result.bbox).toEqual([-106.95, 34.0, -106.83, 34.1])
  })

  it('drops repeated components from the label', () => {
    const [result] = normalizePhotonFeatures([
      feature({ name: 'Socorro', city: 'Socorro', state: 'New Mexico' }),
    ])

    expect(result.label).toBe('Socorro, New Mexico')
  })

  it('skips non-US results, coordinate-less features, and bad input', () => {
    const results = normalizePhotonFeatures([
      feature({ name: 'Socorro', countrycode: 'ES' }),
      { properties: { countrycode: 'US', name: 'No geometry' } },
      feature({ postcode: undefined, name: undefined, street: undefined }),
    ])

    expect(results).toEqual([])
    expect(normalizePhotonFeatures(undefined)).toEqual([])
  })
})
