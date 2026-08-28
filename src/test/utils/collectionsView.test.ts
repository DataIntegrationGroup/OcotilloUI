import { describe, expect, it } from 'vitest'
import {
  buildCollectionRows,
  collectionDescriptionOf,
  collectionIdOf,
  collectionTitleOf,
} from '@/utils/collectionsView'
import { indexGisLayersByCollection, zGisCatalog } from '@/utils/gisArtifacts'
import type { OgcCollectionRecord } from '@/utils/ogcLayerUtils'

const wells = {
  id: 'water_wells',
  title: 'Water Wells',
  description: 'Every well in the register.',
} as OgcCollectionRecord

const springs = {
  collection_id: 'springs',
  abstract: 'Mapped spring locations.',
} as OgcCollectionRecord

const groups = [
  {
    key: 'groundwater',
    title: 'Groundwater',
    collections: [{ layerKey: 'ogc-water-wells', collection: wells }],
  },
  {
    key: 'surfaceWater',
    title: 'Surface Water',
    collections: [
      {
        layerKey: 'ogc-springs',
        collection: springs,
        displayLabel: 'Springs',
      },
    ],
  },
]

const catalog = zGisCatalog.parse({
  service_url: 'https://ocotillo-api.example.org/ogcapi',
  connections: [],
  layers: [
    {
      id: 'water-wells',
      title: 'Water Wells',
      collection: 'water_wells',
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
})

describe('collection field resolution', () => {
  it('falls back through the fields the catalogue actually fills in', () => {
    expect(collectionIdOf(wells)).toBe('water_wells')
    expect(collectionIdOf(springs)).toBe('springs')
    expect(collectionIdOf({} as OgcCollectionRecord)).toBeUndefined()

    expect(collectionTitleOf(wells)).toBe('Water Wells')
    expect(collectionTitleOf(springs, 'Springs')).toBe('Springs')
    expect(collectionTitleOf(springs)).toBe('springs')
    expect(collectionTitleOf({} as OgcCollectionRecord)).toBe(
      'Untitled collection'
    )

    expect(collectionDescriptionOf(wells)).toBe('Every well in the register.')
    expect(collectionDescriptionOf(springs)).toBe('Mapped spring locations.')
  })
})

describe('buildCollectionRows', () => {
  it('flattens every group into one list, keeping the group as a column', () => {
    const rows = buildCollectionRows(groups, new Map())

    expect(rows).toHaveLength(2)
    expect(rows.map((row) => row.groupTitle)).toEqual([
      'Groundwater',
      'Surface Water',
    ])
    expect(rows.map((row) => row.groupKey)).toEqual([
      'groundwater',
      'surfaceWater',
    ])
    expect(rows.map((row) => row.title)).toEqual(['Water Wells', 'Springs'])
    expect(rows[0].layerKey).toBe('ogc-water-wells')
  })

  it('attaches the GIS layer that matches the collection id', () => {
    const rows = buildCollectionRows(
      groups,
      indexGisLayersByCollection(catalog)
    )

    expect(rows[0].gisLayer?.id).toBe('water-wells')
    expect(rows[1].gisLayer).toBeUndefined()
  })

  it('returns an empty list when no group has collections', () => {
    expect(
      buildCollectionRows(
        [{ key: 'reference', title: 'Reference', collections: [] }],
        new Map()
      )
    ).toEqual([])
  })
})
