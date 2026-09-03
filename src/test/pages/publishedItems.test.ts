import { describe, expect, it } from 'vitest'
import {
  extractPublishedCoordinates,
  publishedPropertyKeys,
  publishedThingName,
  publishedThingsBounds,
  publishedThingsToCsv,
  publishedThingsToFeatureCollection,
  publishedThingsToRows,
  publishedThingType,
} from '@/pages/access/destinations/publishedItems'
import {
  type PublishedThing,
  zPublishedThing,
} from '@/utils/accessDestinations'

const thing = (overrides: Partial<PublishedThing> = {}): PublishedThing =>
  zPublishedThing.parse({
    thing_id: 1,
    data_types: ['water level'],
    properties: {},
    location: {},
    ...overrides,
  })

describe('extractPublishedCoordinates', () => {
  it('reads GeoJSON geometry coordinates as [lng, lat]', () => {
    expect(
      extractPublishedCoordinates({
        geometry: { type: 'Point', coordinates: [-106.1, 35.1] },
      })
    ).toEqual([-106.1, 35.1])
  })

  it('reads a bare geometry coordinate pair', () => {
    expect(
      extractPublishedCoordinates({ type: 'Point', coordinates: [-105, 34] })
    ).toEqual([-105, 34])
  })

  it('reads flat longitude/latitude fields', () => {
    expect(
      extractPublishedCoordinates({ longitude: -107, latitude: 36 })
    ).toEqual([-107, 36])
  })

  it('reads lng/lat and lon aliases, and numeric strings', () => {
    expect(extractPublishedCoordinates({ lng: '-104.5', lat: '33.2' })).toEqual(
      [-104.5, 33.2]
    )
    expect(extractPublishedCoordinates({ lon: -108, lat: 32 })).toEqual([
      -108, 32,
    ])
  })

  it('returns null when no coordinate is present', () => {
    expect(extractPublishedCoordinates({})).toBeNull()
    expect(extractPublishedCoordinates({ longitude: -106 })).toBeNull()
    expect(extractPublishedCoordinates({ coordinates: ['x', 'y'] })).toBeNull()
  })
})

describe('publishedThingName', () => {
  it('prefers a name property, falling back to the id', () => {
    expect(publishedThingName(thing({ properties: { name: 'Well 7' } }))).toBe(
      'Well 7'
    )
    expect(publishedThingName(thing({ thing_id: 42 }))).toBe('Thing 42')
  })
})

describe('publishedThingType', () => {
  it('reads thing_type and its aliases, else empty', () => {
    expect(
      publishedThingType(thing({ properties: { thing_type: 'Water Well' } }))
    ).toBe('Water Well')
    expect(publishedThingType(thing({ properties: { type: 'Spring' } }))).toBe(
      'Spring'
    )
    expect(publishedThingType(thing())).toBe('')
  })
})

describe('publishedThingsToFeatureCollection', () => {
  it('keeps only things with a readable coordinate', () => {
    const collection = publishedThingsToFeatureCollection([
      thing({ thing_id: 1, location: { longitude: -106, latitude: 35 } }),
      thing({ thing_id: 2, location: {} }),
    ])
    expect(collection?.features).toHaveLength(1)
    expect(collection?.features[0]).toMatchObject({
      geometry: { type: 'Point', coordinates: [-106, 35] },
      properties: { thing_id: 1 },
    })
  })

  it('returns null when nothing is mappable', () => {
    expect(publishedThingsToFeatureCollection([thing()])).toBeNull()
  })
})

describe('publishedThingsBounds', () => {
  it('encloses every mappable thing as [sw, ne]', () => {
    expect(
      publishedThingsBounds([
        thing({ thing_id: 1, location: { longitude: -106, latitude: 35 } }),
        thing({ thing_id: 2, location: { longitude: -108, latitude: 34 } }),
        thing({ thing_id: 3, location: {} }),
      ])
    ).toEqual([
      [-108, 34],
      [-106, 35],
    ])
  })

  it('collapses a single point to a zero-area box', () => {
    expect(
      publishedThingsBounds([
        thing({ location: { longitude: -106, latitude: 35 } }),
      ])
    ).toEqual([
      [-106, 35],
      [-106, 35],
    ])
  })

  it('returns null when nothing is mappable', () => {
    expect(publishedThingsBounds([thing()])).toBeNull()
  })
})

describe('publishedPropertyKeys', () => {
  it('unions extra keys in first-seen order and drops core collisions', () => {
    const keys = publishedPropertyKeys([
      thing({ properties: { name: 'a', depth: 10 } }),
      thing({ properties: { depth: 20, aquifer: 'x' } }),
    ])
    expect(keys).toEqual(['depth', 'aquifer'])
  })
})

describe('publishedThingsToRows', () => {
  it('flattens core fields, coordinates, and stringifies properties', () => {
    const [row] = publishedThingsToRows([
      thing({
        thing_id: 9,
        data_types: ['water level', 'chemistry'],
        location: { longitude: -106, latitude: 35 },
        properties: {
          name: 'Well 9',
          thing_type: 'Water Well',
          tags: ['a', 'b'],
        },
      }),
    ])
    expect(row).toMatchObject({
      id: 9,
      thing_id: 9,
      name: 'Well 9',
      thing_type: 'Water Well',
      data_types: 'water level, chemistry',
      longitude: -106,
      latitude: 35,
      tags: '["a","b"]',
    })
  })

  it('leaves coordinates null when the location has none', () => {
    const [row] = publishedThingsToRows([thing({ location: {} })])
    expect(row.longitude).toBeNull()
    expect(row.latitude).toBeNull()
  })
})

describe('publishedThingsToCsv', () => {
  it('emits a header of core plus property columns and one row per thing', () => {
    const csv = publishedThingsToCsv([
      thing({
        thing_id: 1,
        data_types: ['water level'],
        location: { longitude: -106, latitude: 35 },
        properties: { aquifer: 'Rio Grande' },
      }),
    ])
    const [header, firstRow] = csv.trim().split(/\r\n|\n/)
    expect(header).toBe(
      'thing_id,name,thing_type,data_types,longitude,latitude,aquifer'
    )
    expect(firstRow).toContain('Rio Grande')
    expect(firstRow).toContain('-106')
  })
})
