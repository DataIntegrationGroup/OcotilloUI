import { describe, expect, it } from 'vitest'
import {
  buildSchemaFieldRows,
  collectionSchemaUrl,
  roleLabelOf,
  typeLabelOf,
  zCollectionSchema,
} from '@/utils/collectionSchema'

const schema = zCollectionSchema.parse({
  type: 'object',
  title: 'Latest TDS (Water Wells)',
  $schema: 'http://json-schema.org/draft/2019-09/schema',
  $id: 'https://api.example.org/ogcapi/collections/latest_tds_wells/schema',
  required: ['name'],
  properties: {
    geometry: { format: 'geometry-any', 'x-ogc-role': 'primary-geometry' },
    name: { type: 'string', title: 'Name', description: 'Well name.' },
    id: { type: 'integer', title: 'Feature ID', 'x-ogc-role': 'id' },
    latest_tds_observation_date: { type: 'string', format: 'date' },
    thing_type: { type: 'string', enum: ['water well', 'spring'] },
  },
})

describe('buildSchemaFieldRows', () => {
  it('hoists the id and geometry roles, then keeps server key order', () => {
    expect(buildSchemaFieldRows(schema).map((row) => row.name)).toEqual([
      'id',
      'geometry',
      'name',
      'latest_tds_observation_date',
      'thing_type',
    ])
  })

  it('carries titles, descriptions, enums, and required flags', () => {
    const rows = buildSchemaFieldRows(schema)
    const name = rows.find((row) => row.name === 'name')
    const thingType = rows.find((row) => row.name === 'thing_type')

    expect(name).toMatchObject({
      title: 'Name',
      description: 'Well name.',
      required: true,
    })
    expect(thingType?.required).toBe(false)
    expect(thingType?.enumValues).toEqual(['water well', 'spring'])
  })

  it('tolerates a schema with no properties', () => {
    expect(buildSchemaFieldRows(zCollectionSchema.parse({}))).toEqual([])
  })
})

describe('typeLabelOf', () => {
  it('labels a geometry property that carries only a format', () => {
    expect(typeLabelOf({ format: 'geometry-any' })).toBe('geometry')
  })

  it('combines type and format', () => {
    expect(typeLabelOf({ type: 'string', format: 'date' })).toBe(
      'string (date)'
    )
  })

  it('drops null from a union type', () => {
    expect(typeLabelOf({ type: ['number', 'null'] })).toBe('number')
  })

  it('falls back when the property declares nothing', () => {
    expect(typeLabelOf({})).toBe('unknown')
  })
})

describe('roleLabelOf', () => {
  it('maps known OGC roles and passes unknown ones through', () => {
    expect(roleLabelOf('primary-geometry')).toBe('Geometry')
    expect(roleLabelOf('something-else')).toBe('something-else')
    expect(roleLabelOf(undefined)).toBeUndefined()
  })
})

describe('collectionSchemaUrl', () => {
  it('builds the schema URL without doubling the slash', () => {
    expect(collectionSchemaUrl('https://api.example.org/', 'water_wells')).toBe(
      'https://api.example.org/ogcapi/collections/water_wells/schema?f=json'
    )
  })
})
