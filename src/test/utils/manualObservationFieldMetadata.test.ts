import { describe, expect, it } from 'vitest'
import type { IFieldEvent } from '@/interfaces/ocotillo'
import {
  buildManualObservationFieldMetadata,
  formatCollector,
} from '@/utils/manualObservationFieldMetadata'

const event = (overrides: Partial<IFieldEvent>): IFieldEvent => ({
  id: 1,
  thing_id: 7834,
  ...overrides,
})

describe('buildManualObservationFieldMetadata', () => {
  it('maps the sample contact onto every observation in the sample', () => {
    const metadata = buildManualObservationFieldMetadata([
      event({
        event_date: '2025-02-11T17:00:00Z',
        notes: 'Routine visit',
        field_activities: [
          {
            id: 10,
            field_event_id: 1,
            activity_type: 'groundwater level',
            samples: [
              {
                id: 5196,
                sample_method: 'Electric tape measurement (E-probe)',
                contact: { name: 'Joseph Beman', organization: 'NMBGMR' },
                observations: [{ id: 5196 }, { id: 5197 }],
              },
            ],
          },
        ],
      }),
    ])

    expect(metadata.get(5196)).toEqual({
      collectedBy: 'Joseph Beman',
      collectorOrganization: 'NMBGMR',
      measurementMethod: 'Electric tape measurement (E-probe)',
      fieldEventDate: '2025-02-11T17:00:00Z',
      notes: 'Routine visit',
    })
    expect(metadata.get(5197)?.collectedBy).toBe('Joseph Beman')
  })

  it('falls back to sampler_name, then to the event Lead participant', () => {
    const metadata = buildManualObservationFieldMetadata([
      event({
        id: 1,
        field_activities: [
          {
            id: 10,
            field_event_id: 1,
            samples: [
              { id: 1, sampler_name: 'A. Tech', observations: [{ id: 100 }] },
            ],
          },
        ],
      }),
      event({
        id: 2,
        field_event_participants: [
          {
            id: 1,
            field_event_id: 2,
            contact_id: 9,
            participant_role: 'Assistant',
            participant: { id: 9, name: 'Second Chair' },
          },
          {
            id: 2,
            field_event_id: 2,
            contact_id: 8,
            participant_role: 'Lead',
            participant: { id: 8, name: 'Lead Tech', organization: 'NMBGMR' },
          },
        ],
        field_activities: [
          {
            id: 11,
            field_event_id: 2,
            samples: [{ id: 2, observations: [{ id: 200 }] }],
          },
        ],
      }),
    ])

    expect(metadata.get(100)?.collectedBy).toBe('A. Tech')
    expect(metadata.get(100)?.collectorOrganization).toBeNull()
    expect(metadata.get(200)?.collectedBy).toBe('Lead Tech')
    expect(metadata.get(200)?.collectorOrganization).toBe('NMBGMR')
  })

  it('reports no collector when the field event records none', () => {
    const metadata = buildManualObservationFieldMetadata([
      event({
        field_activities: [
          {
            id: 10,
            field_event_id: 1,
            samples: [
              {
                id: 12602,
                sample_method: 'Electric tape measurement (E-probe)',
                observations: [{ id: 12602 }],
              },
            ],
          },
        ],
      }),
    ])

    expect(metadata.get(12602)?.collectedBy).toBeNull()
    expect(metadata.get(12602)?.measurementMethod).toBe(
      'Electric tape measurement (E-probe)'
    )
  })

  it('prefers the sample note over the activity and event notes', () => {
    const metadata = buildManualObservationFieldMetadata([
      event({
        notes: 'event note',
        field_activities: [
          {
            id: 10,
            field_event_id: 1,
            notes: 'activity note',
            samples: [
              { id: 1, notes: 'sample note', observations: [{ id: 1 }] },
            ],
          },
        ],
      }),
    ])

    expect(metadata.get(1)?.notes).toBe('sample note')
  })

  it('ignores null events and events without activities', () => {
    expect(
      buildManualObservationFieldMetadata([null, undefined, event({})]).size
    ).toBe(0)
  })
})

describe('formatCollector', () => {
  it('appends the organization when known', () => {
    expect(
      formatCollector({
        collectedBy: 'Joseph Beman',
        collectorOrganization: 'NMBGMR',
        measurementMethod: null,
        fieldEventDate: null,
        notes: null,
      })
    ).toBe('Joseph Beman (NMBGMR)')
  })

  it('returns null when no collector is recorded', () => {
    expect(
      formatCollector({
        collectedBy: null,
        collectorOrganization: null,
        measurementMethod: null,
        fieldEventDate: null,
        notes: null,
      })
    ).toBeNull()
    expect(formatCollector(null)).toBeNull()
  })
})
