import { describe, expect, it } from 'vitest'
import { resolveCollection } from '@/utils/ogcLayerUtils'

const collection = (id: string, title?: string) => ({ id, title })

describe('resolveCollection', () => {
  it('matches a collection id exactly', () => {
    const resolved = resolveCollection(
      [collection('water_wells', 'Water Wells')],
      ['Water Wells', 'water_wells']
    )

    expect(resolved.exists).toBe(true)
    expect(resolved.id).toBe('water_wells')
    expect(resolved.label).toBe('Water Wells')
  })

  it('ignores separators and case when comparing names', () => {
    const resolved = resolveCollection(
      [collection('Water_Elevation_Contours')],
      ['water elevation contours']
    )

    expect(resolved.id).toBe('Water_Elevation_Contours')
  })

  it('does not bind to a collection that merely contains the candidate', () => {
    const resolved = resolveCollection(
      [collection('rock_sample_locations', 'Rock Sample Locations')],
      ['Locations', 'locations']
    )

    expect(resolved.exists).toBe(false)
    expect(resolved.id).toBe('')
  })

  it('does not bind to a collection the candidate is a prefix of', () => {
    const resolved = resolveCollection(
      [collection('latest_depth_to_water_wells')],
      ['latest_depth_to_water']
    )

    expect(resolved.exists).toBe(false)
  })

  it('reports no match when the catalog no longer publishes the collection', () => {
    const resolved = resolveCollection(
      [collection('water_wells'), collection('springs')],
      ['Average TDS (Water Wells)', 'avg_tds_wells']
    )

    expect(resolved.exists).toBe(false)
    expect(resolved.label).toBe('Average TDS')
  })

  it('prefers a canonical identifier over another collection title', () => {
    const resolved = resolveCollection(
      [
        collection('legacy_springs', 'springs'),
        collection('springs', 'Springs'),
      ],
      ['springs']
    )

    expect(resolved.id).toBe('springs')
  })

  it('matches a title containing an em dash', () => {
    const resolved = resolveCollection(
      [
        collection(
          'geothermal_wells_bht',
          'Geothermal Wells — Bottom-Hole Temperature'
        ),
      ],
      ['Geothermal Wells — Bottom-Hole Temperature']
    )

    expect(resolved.id).toBe('geothermal_wells_bht')
  })

  it('does not confuse dst with collections that contain it', () => {
    const resolved = resolveCollection(
      [collection('dst', 'Drill Stem Tests'), collection('dst_summary')],
      ['dst']
    )

    expect(resolved.id).toBe('dst')
  })

  it('tries candidates in order', () => {
    const resolved = resolveCollection(
      [collection('project_area'), collection('project_areas')],
      ['project_areas', 'project_area']
    )

    expect(resolved.id).toBe('project_areas')
  })
})
