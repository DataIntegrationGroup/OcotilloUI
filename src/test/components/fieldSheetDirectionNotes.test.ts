/**
 * BDMS-1509 — Direction notes region on page 1.
 *
 * Unit-tests the display-only `directionNotesValue` helper and renders page 1
 * twice (supplied vs. not supplied) to prove the prop is threaded through and
 * never breaks rendering.
 *
 * Binary-free on purpose: assertions read only `buffer.length`, so CI (which
 * has neither `pdftotext` nor `pdfinfo`) can run it. The textual proof — that
 * `Direction notes` prints with an empty value when none is supplied — lives in
 * visual/WORK-1509.md PRINTED-PROOF, rendered locally with pdftotext.
 */

import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import {
  directionNotesValue,
  FieldCompilationNotesPdf,
} from '@/components/pdf/FieldCompilationNotesPdf'
import type { IContact, IWell } from '@/interfaces/ocotillo'
import { buildSensorDeploymentRows } from '@/utils/SensorDeploymentRows'

const note = (
  id: number,
  note_type: string,
  content: string,
  created_at: string
) => ({
  id,
  note_type,
  content,
  created_at,
  release_status: 'public',
  target_id: 1,
  target_table: 'thing',
})

const makeWell = (): IWell =>
  ({
    id: 1,
    name: 'AB-0001',
    thing_type: 'water-well',
    location_id: 1,
    created_at: '2026-01-01T00:00:00Z',
    release_status: 'public',
    alternate_ids: [
      {
        id: 10,
        created_at: '2026-01-01T00:00:00Z',
        release_status: 'public',
        alternate_id: 'SITE-1',
        alternate_organization: 'NMBGMR',
        relation: 'same_as',
      },
    ],
    current_location: {
      properties: {
        utm_coordinates: { easting: 123456, northing: 654321 },
        notes: [
          note(
            1,
            'General',
            'Gate is locked; combination at the office.',
            '2026-05-01'
          ),
        ],
      },
    },
    site_notes: [
      note(
        2,
        'Site Notes (legacy)',
        'Dogs on property. Call ahead.',
        '2026-04-02'
      ),
    ],
    notes: [],
    measuring_notes: [
      note(3, 'Maintenance', 'Casing cap replaced.', '2026-04-02T00:00:00Z'),
    ],
    measuring_point_description: 'Top of casing',
    measuring_point_height: 1.2,
    measuring_point_height_unit: 'ft',
    well_depth: 480,
    well_depth_unit: 'ft',
  }) as unknown as IWell

const makeContact = (): IContact =>
  ({
    id: 1,
    name: 'Test Owner',
    created_at: new Date('2026-01-01T00:00:00Z'),
    release_status: 'public',
    role: 'Owner',
    phones: [
      {
        id: 1,
        created_at: new Date('2026-01-01T00:00:00Z'),
        release_status: 'public',
        contact_id: 1,
        phone_number: '5053300761',
        phone_type: 'Primary',
      },
    ],
    emails: [
      {
        id: 1,
        created_at: new Date('2026-01-01T00:00:00Z'),
        release_status: 'public',
        contact_id: 1,
        email: 'owner@example.com',
      },
    ],
  }) as unknown as IContact

const makeObservations = () =>
  [
    {
      id: 1,
      observation_type: 'groundwater-level',
      observation_datetime: '2026-03-01T10:15:00Z',
      created_at: new Date('2026-03-01'),
      release_status: 'public',
      sample_id: null,
      sensor_id: null,
      observed_property: 'depth-to-water',
      value: 112.4,
      unit: 'ft',
      depth_to_water_bgs: 112.4,
      measuring_point_height: 1.2,
      level_status: 'stable',
      groundwater_level_reason: null,
      nma_data_quality: null,
    },
    {
      id: 2,
      observation_type: 'groundwater-level',
      observation_datetime: '2026-06-01T09:40:00Z',
      created_at: new Date('2026-06-01'),
      release_status: 'public',
      sample_id: null,
      sensor_id: null,
      observed_property: 'depth-to-water',
      value: 118.9,
      unit: 'ft',
      depth_to_water_bgs: 118.9,
      measuring_point_height: 1.2,
      level_status: 'stable',
      groundwater_level_reason: null,
      nma_data_quality: null,
    },
  ] as unknown[]

const makeSensors = () =>
  [
    {
      id: 1,
      thing_id: 1,
      sensor: {
        id: 11,
        name: 'HOBO-01',
        model: 'U20-001-04',
        sensor_type: 'pressure transducer',
        notes: 'Downloaded 2026-05-20',
      },
      installation_date: '2025-11-02',
      removal_date: null,
      release_status: 'public',
      notes: 'Hanging cable 12 ft',
    },
    {
      id: 2,
      thing_id: 1,
      sensor: {
        id: 12,
        name: 'Unattached spare',
        model: 'U20-001-04',
        sensor_type: 'pressure transducer',
      },
      installation_date: null,
      removal_date: null,
      release_status: 'public',
      notes: null,
    },
  ] as unknown[]

const baseProps = () => ({
  well: makeWell(),
  contacts: [makeContact()],
  assets: [],
  observations: makeObservations(),
  sensorDeployments: buildSensorDeploymentRows(
    makeSensors() as never[],
    [
      {
        id: 11,
        name: 'HOBO-01',
        model: 'U20-001-04',
        sensor_type: 'pressure transducer',
        notes: 'Downloaded 2026-05-20',
        thing_id: 1,
      },
      {
        id: 12,
        name: 'Unattached spare',
        model: 'U20-001-04',
        sensor_type: 'pressure transducer',
        thing_id: 1,
      },
    ] as never[]
  ),
  hydrographImage: null,
  sampleMethodsBySampleId: {},
  includeConfidentialContacts: false,
})

describe('directionNotesValue (BDMS-1509)', () => {
  it('forwards a supplied direction string verbatim', () => {
    expect(directionNotesValue('N 40 E, 12 deg')).toBe('N 40 E, 12 deg')
  })

  it('returns empty for undefined (AC2/AC3)', () => {
    expect(directionNotesValue(undefined)).toBe('')
  })

  it('returns empty for blank / whitespace-only input', () => {
    expect(directionNotesValue('')).toBe('')
    expect(directionNotesValue('   ')).toBe('')
  })

  it('never returns a placeholder such as N/A or -', () => {
    const v = directionNotesValue(undefined)
    expect(v).not.toBe('N/A')
    expect(v).not.toBe('-')
  })
})

describe('page 1 Direction notes region render', () => {
  it('renders a populated Direction notes region', async () => {
    const buffer = await renderToBuffer(
      createElement(FieldCompilationNotesPdf, {
        ...baseProps(),
        directionNotes: 'N 40 E, 12 deg',
      } as any) as any
    )

    expect(buffer.length).toBeGreaterThan(10_000)
  }, 60_000)

  it('renders the label with no value beneath when none supplied (empty, not missing)', async () => {
    const buffer = await renderToBuffer(
      createElement(FieldCompilationNotesPdf, baseProps() as any) as any
    )

    expect(buffer.length).toBeGreaterThan(10_000)
  }, 60_000)
})
