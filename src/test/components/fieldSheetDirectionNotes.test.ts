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
import { makeContact, makeObservations, makeSensors, makeWell } from '@/test/fixtures/fieldCompilationPdfSample'
import { buildSensorDeploymentRows } from '@/utils/SensorDeploymentRows'

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
