import { describe, expect, it } from 'vitest'
import {
  deriveInternalGisConnection,
  findGisConnection,
  indexGisLayersByCollection,
  normalizeMediaType,
  zGisCatalog,
} from '@/utils/gisArtifacts'

const catalogFixture = {
  service_url: 'https://ocotillo-api.example.org/ogcapi',
  connections: [
    {
      client: 'qgis',
      href: 'https://ocotillo-api.example.org/gis/qgis/connections.xml',
      media_type: 'text/xml',
      filename: 'ocotillo-ogcapi-connections.xml',
    },
  ],
  layers: [
    {
      id: 'water-level-trend',
      title: 'Water-Level Trend',
      abstract: 'Direction of the fitted depth-to-water trend at each well.',
      collection: 'depth_to_water_trend_wells',
      collection_url:
        'https://ocotillo-api.example.org/ogcapi/collections/depth_to_water_trend_wells',
      geometry: 'Point',
      renderer: 'categorized',
      downloads: [
        {
          client: 'qgis',
          href: 'https://ocotillo-api.example.org/gis/qgis/layers/water-level-trend.qlr',
          media_type: 'text/xml',
          filename: 'water-level-trend.qlr',
        },
        {
          client: 'arcgis',
          href: 'https://ocotillo-api.example.org/gis/arcgis/layers/water-level-trend.lyrx',
          media_type: 'application/json',
          filename: 'water-level-trend.lyrx',
        },
      ],
    },
    {
      id: 'water-wells',
      title: 'Water Wells',
      abstract: null,
      collection: 'wells',
      collection_url:
        'https://ocotillo-api.example.org/ogcapi/collections/wells',
      geometry: 'Point',
      renderer: 'single',
      downloads: [
        {
          client: 'qgis',
          href: 'https://ocotillo-api.example.org/gis/qgis/layers/water-wells.qlr',
          media_type: 'text/xml',
          filename: 'water-wells.qlr',
        },
      ],
    },
  ],
}

describe('zGisCatalog', () => {
  it('parses a catalogue response', () => {
    const catalog = zGisCatalog.parse(catalogFixture)

    expect(catalog.layers).toHaveLength(2)
    expect(catalog.layers[0].downloads).toHaveLength(2)
    expect(catalog.service_url).toBe('https://ocotillo-api.example.org/ogcapi')
  })

  it('rejects a response missing the layer downloads', () => {
    const broken = {
      ...catalogFixture,
      layers: [{ ...catalogFixture.layers[0], downloads: undefined }],
    }

    expect(() => zGisCatalog.parse(broken)).toThrow()
  })

  it('rejects an unknown client', () => {
    const broken = {
      ...catalogFixture,
      connections: [{ ...catalogFixture.connections[0], client: 'mapinfo' }],
    }

    expect(() => zGisCatalog.parse(broken)).toThrow()
  })
})

describe('indexGisLayersByCollection', () => {
  it('keys layers by their collection id', () => {
    const catalog = zGisCatalog.parse(catalogFixture)
    const index = indexGisLayersByCollection(catalog)

    expect(index.size).toBe(2)
    expect(index.get('depth_to_water_trend_wells')?.id).toBe(
      'water-level-trend'
    )
    expect(index.get('wells')?.id).toBe('water-wells')
    expect(index.get('not_published')).toBeUndefined()
  })

  it('returns an empty index when the catalogue has not loaded', () => {
    expect(indexGisLayersByCollection(undefined).size).toBe(0)
  })

  it('keeps the first layer when two claim the same collection', () => {
    const catalog = zGisCatalog.parse({
      ...catalogFixture,
      layers: [
        catalogFixture.layers[0],
        {
          ...catalogFixture.layers[1],
          collection: 'depth_to_water_trend_wells',
        },
      ],
    })

    expect(
      indexGisLayersByCollection(catalog).get('depth_to_water_trend_wells')?.id
    ).toBe('water-level-trend')
  })
})

describe('findGisConnection', () => {
  it('finds the connections file for a client', () => {
    const catalog = zGisCatalog.parse(catalogFixture)

    expect(findGisConnection(catalog, 'qgis')?.filename).toBe(
      'ocotillo-ogcapi-connections.xml'
    )
    expect(findGisConnection(catalog, 'arcgis')).toBeUndefined()
  })
})

describe('deriveInternalGisConnection', () => {
  it('derives the internal href and filename from the public entry', () => {
    const catalog = zGisCatalog.parse(catalogFixture)
    const internal = deriveInternalGisConnection(catalog)

    expect(internal?.href).toBe(
      'https://ocotillo-api.example.org/gis/qgis/connections-internal.xml'
    )
    expect(internal?.filename).toBe('ocotillo-ogcapi-connections-internal.xml')
  })

  it('returns undefined when the catalogue has no qgis connection', () => {
    const catalog = zGisCatalog.parse({ ...catalogFixture, connections: [] })

    expect(deriveInternalGisConnection(catalog)).toBeUndefined()
  })
})

describe('normalizeMediaType', () => {
  it('strips parameters so the wire value matches the catalogue value', () => {
    expect(normalizeMediaType('text/xml; charset=utf-8')).toBe('text/xml')
    expect(normalizeMediaType('application/json')).toBe('application/json')
  })
})
