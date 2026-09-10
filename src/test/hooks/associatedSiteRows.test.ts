import { describe, expect, it } from 'vitest'
import {
  buildAssociatedSiteRow,
  getSiteShowPath,
  latestObservation,
} from '@/hooks/useAssociatedSiteRows'
import type {
  IObservation,
  ISample,
  IThing,
  IWell,
} from '@/interfaces/ocotillo'

const thing = (overrides: Partial<IThing> = {}) =>
  ({
    id: 42,
    name: 'WL-0260',
    thing_type: 'water well',
    location_id: 1,
    created_at: '2025-01-01',
    release_status: 'public',
    ...overrides,
  }) as IThing

const observation = (overrides: Partial<IObservation> = {}) =>
  ({
    observation_datetime: '2025-06-01T00:00:00Z',
    ...overrides,
  }) as IObservation

describe('getSiteShowPath', () => {
  it('routes springs to the spring page', () => {
    expect(getSiteShowPath({ id: 7, thing_type: 'spring' } as IThing)).toBe(
      '/ocotillo/spring/show/7'
    )
  })

  it('routes wells, and anything unrecognised, to the well page', () => {
    expect(getSiteShowPath({ id: 7, thing_type: 'water well' } as IThing)).toBe(
      '/ocotillo/well/show/7'
    )
    expect(getSiteShowPath({ id: 7, thing_type: '' } as IThing)).toBe(
      '/ocotillo/well/show/7'
    )
  })
})

describe('latestObservation', () => {
  it('picks the most recent, ignoring undated readings', () => {
    const result = latestObservation([
      observation({ observation_datetime: '2024-01-01T00:00:00Z' }),
      observation({ observation_datetime: undefined }),
      observation({ observation_datetime: '2026-01-01T00:00:00Z' }),
    ])
    expect(result?.observation_datetime).toBe('2026-01-01T00:00:00Z')
  })

  it('returns nothing for an empty list', () => {
    expect(latestObservation([])).toBeUndefined()
  })
})

describe('buildAssociatedSiteRow', () => {
  it('falls back to the thing when the well has not loaded', () => {
    const row = buildAssociatedSiteRow({ thing: thing() })

    expect(row.name).toBe('WL-0260')
    expect(row.wellDepth).toBeNull()
    expect(row.lastCheckedDate).toBeNull()
    expect(row.lastCheckedBy).toBeNull()
  })

  it('names an unnamed site by its id, so the link is never blank', () => {
    expect(buildAssociatedSiteRow({ thing: thing({ name: '' }) }).name).toBe(
      'Site 42'
    )
  })

  it('prefers the well location over the thing location', () => {
    const row = buildAssociatedSiteRow({
      thing: thing({
        current_location: {
          geometry: { coordinates: [-106, 36] },
          properties: { elevation: 1000, elevation_unit: 'm' },
        },
      } as unknown as Partial<IThing>),
      well: {
        current_location: {
          geometry: { coordinates: [-107.5, 35.25] },
          properties: { elevation: 6812, elevation_unit: 'ft' },
        },
      } as unknown as IWell,
    })

    expect(row.latitude).toBe(35.25)
    expect(row.longitude).toBe(-107.5)
    expect(row.elevation).toBe(6812)
    expect(row.elevationUnit).toBe('ft')
  })

  it('prefers the field event date over the sample date and the reading', () => {
    const row = buildAssociatedSiteRow({
      thing: thing(),
      observations: [observation({ observation_datetime: '2023-01-01' })],
      sample: {
        field_event: { event_date: '2025-05-05' },
        sample_date: '2024-04-04',
      } as unknown as ISample,
    })

    expect(row.lastCheckedDate).toBe('2025-05-05')
  })

  it('falls back to the sample date, then the latest reading', () => {
    expect(
      buildAssociatedSiteRow({
        thing: thing(),
        observations: [observation({ observation_datetime: '2023-01-01' })],
        sample: { sample_date: '2024-04-04' } as unknown as ISample,
      }).lastCheckedDate
    ).toBe('2024-04-04')

    expect(
      buildAssociatedSiteRow({
        thing: thing(),
        observations: [observation({ observation_datetime: '2023-01-01' })],
      }).lastCheckedDate
    ).toBe('2023-01-01')
  })

  it('qualifies the sampler with their organisation when both are known', () => {
    expect(
      buildAssociatedSiteRow({
        thing: thing(),
        sample: {
          contact: { name: 'Joseph Beman', organization: 'NMBGMR' },
        } as unknown as ISample,
      }).lastCheckedBy
    ).toBe('Joseph Beman (NMBGMR)')
  })

  it('uses the bare contact name, then the sampler name, when it cannot', () => {
    expect(
      buildAssociatedSiteRow({
        thing: thing(),
        sample: { contact: { name: 'Joseph Beman' } } as unknown as ISample,
      }).lastCheckedBy
    ).toBe('Joseph Beman')

    expect(
      buildAssociatedSiteRow({
        thing: thing(),
        sample: { sampler_name: 'Field crew' } as unknown as ISample,
      }).lastCheckedBy
    ).toBe('Field crew')
  })

  it('takes depth to water from the most recent reading', () => {
    const row = buildAssociatedSiteRow({
      thing: thing(),
      observations: [
        observation({
          observation_datetime: '2024-01-01T00:00:00Z',
          depth_to_water_bgs: 10,
        }),
        observation({
          observation_datetime: '2026-01-01T00:00:00Z',
          depth_to_water_bgs: 42,
        }),
      ],
    })

    expect(row.depthToWater).toBe(42)
  })

  it('defaults depth units to feet when the well omits them', () => {
    const row = buildAssociatedSiteRow({
      thing: thing(),
      well: { well_depth: 200, hole_depth: 220 } as unknown as IWell,
    })

    expect(row.wellDepthUnit).toBe('ft')
    expect(row.holeDepthUnit).toBe('ft')
  })
})
