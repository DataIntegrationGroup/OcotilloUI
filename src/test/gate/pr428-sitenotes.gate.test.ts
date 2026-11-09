import fs from 'node:fs'
import { pdf } from '@react-pdf/renderer'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { FieldCompilationNotesPdf } from '@/components/pdf/fieldCompilation/page'
import { buildFieldSheetPageOneFixture } from '@/mock/fieldSheetPageOne.fixture'
import { extractPdfText } from '@/test/fixtures/pdfText'

/**
 * GATE — PR #428 review items 10 + 14 (Site Notes joined into Previous Measurements).
 *
 * Liz's asks, verbatim:
 *   10. Site Notes should be a column in the Previous Measurements table.
 *   14. Only show the last two measurements and last two site notes.
 *
 * This file is the gate. The worker runs it; the worker never edits it.
 * It fails on the pre-change tree by design.
 */
const OUT_DIR = '/Users/robbalch/workspace/jobs/fieldsheet-sitenotes-20261108'

const ONE_PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const NOTE_OLDEST = 'NOTE-OLDEST gate marker retired lift station'
const NOTE_MIDDLE = 'NOTE-MIDDLE gate marker cable replaced'
const NOTE_NEWEST = 'NOTE-NEWEST gate marker pump cycling'

const observations = [
  {
    observation_datetime: '2026-10-29T15:04:00Z',
    depth_to_water_bgs: 41.25,
    measuring_point_height: 3.1,
    groundwater_level_reason: 'Steady',
  },
  {
    observation_datetime: '2026-10-15T15:10:00Z',
    depth_to_water_bgs: 40.88,
    measuring_point_height: 3.0,
    groundwater_level_reason: 'Steady',
  },
  {
    observation_datetime: '2026-09-30T15:20:00Z',
    depth_to_water_bgs: 40.1,
    measuring_point_height: 3.0,
    groundwater_level_reason: 'Rising',
  },
]

describe('gate: page 1 carries Site Notes inside Previous Measurements, last two only', () => {
  it('renders one page with the notes column and no trailing band', async () => {
    const fixture = buildFieldSheetPageOneFixture({ photos: 3 })
    const well = {
      ...fixture.well,
      // The gate only cares about content order and count; the surrounding
      // note envelope is not what it asserts on.
      site_notes: [
        { content: NOTE_OLDEST },
        { content: NOTE_MIDDLE },
        { content: NOTE_NEWEST },
      ] as unknown as typeof fixture.well.site_notes,
    }

    const blob = await pdf(
      createElement(FieldCompilationNotesPdf, {
        well,
        contacts: fixture.contacts,
        assets: fixture.assets.map((asset, index) => ({
          ...asset,
          label: `Fixture photo ${index + 1}`,
          signed_url: ONE_PIXEL_PNG,
        })),
        observations,
        sensorDeployments: fixture.sensorDeployments,
        hydrographImage: fixture.hydrographImage,
        sampleMethodsBySampleId: {},
        showDate: false,
        emptyPlaceholder: ' ',
        notesPlacement: 'column',
        firstPageOnly: true,
      }) as any
    ).toBlob()

    const buf = Buffer.from(await blob.arrayBuffer())
    fs.mkdirSync(OUT_DIR, { recursive: true })
    fs.writeFileSync(`${OUT_DIR}/page1.pdf`, buf)

    const { pageCount, text: rawText } = await extractPdfText(blob)
    // A note that wraps is still the same note: collapse line breaks and runs
    // of spaces before matching, so the gate tests placement, not line-fitting.
    const text = rawText.replace(/\s+/g, ' ')

    expect(pageCount, 'page 1 must still fit on one page').toBe(1)

    const at = (needle: string) => {
      const index = text.indexOf(needle)
      expect(index, `missing text: ${needle}`).toBeGreaterThanOrEqual(0)
      return index
    }

    const prevMeas = at('Previous Measurements')
    const siteNotes = at('Site Notes')
    const newMeas = at('New Measurement')
    const installed = at('Installed Equipment')

    expect(siteNotes, 'Site Notes must sit inside Previous Measurements').toBeGreaterThan(prevMeas)
    expect(siteNotes, 'Site Notes must come before New Measurement').toBeLessThan(newMeas)

    const afterInstalled = text.slice(installed)
    expect(
      afterInstalled.includes('Site Notes'),
      'the trailing Site Notes band under Installed Equipment must be gone'
    ).toBe(false)

    // A note that wraps is still the same note, and neighbouring cells can
    // interleave into the extracted line order, so match the note by its two
    // distinctive fragments rather than as one contiguous string.
    expect(text.includes('NOTE-NEWEST'), 'newest note must render').toBe(true)
    expect(text.includes('pump cycling'), 'newest note text must render whole').toBe(true)
    expect(text.includes('NOTE-MIDDLE'), 'second-newest note must render').toBe(true)
    expect(text.includes('NOTE-OLDEST'), 'only the last two notes may render').toBe(false)
  }, 120000)
})
