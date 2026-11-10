/**
 * PR #428 / Liz notes — lane L2: reading label + elevation descriptor.
 *
 * Frozen gate. Written by the planner; the worker runs it and never edits it.
 *
 * What it decides, from Rob's rulings on 2026-11-09:
 *
 *  - D7 — "DTW is actually depth to water below ground surface." Every header
 *    and label that said `DTW Below MP` must say *Depth to Water Below Ground
 *    Surface*, on page 1 and on the owner sheet, and no value is converted:
 *    the feed stays `observation.depth_to_water_bgs`.
 *  - D6 — the elevation prints as `Elevation: 6,234 ft (NAVD88)`: value
 *    grouped from `properties.elevation`, unit from `elevation_unit` with `ft`
 *    as the fallback, datum from `vertical_datum` omitted when absent.
 *
 * Why `squash()` for the long phrase and exact text for the elevation: the
 * phrase has to survive react-pdf's line breaking and hyphenation inside
 * narrow table cells, so spacing is not part of the contract; the *words* are.
 * The elevation is a number a reader compares to a survey sheet, so its exact
 * printed form — comma, unit, parentheses — is.
 */
import fs from 'node:fs'
import { pdf, Document } from '@react-pdf/renderer'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { FieldCompilationNotesPdf } from '@/components/pdf/fieldCompilation/page'
import { formatElevation } from '@/components/pdf/fieldCompilation/format'
import { FieldSheetPageTwo } from '@/components/pdf/FieldSheetPageTwo'
import { buildFieldSheetPageOneFixture } from '@/mock/fieldSheetPageOne.fixture'
import { buildFieldSheetPageTwoFixture } from '@/mock/fieldSheetPageTwo.fixture'

const OUT_DIR = '/Users/robbalch/workspace/jobs/nmbg-liznotes-20261109/L2'
const LABEL = 'Depth to Water Below Ground Surface'
const RETIRED = 'DTW Below MP'
const TIMEOUT = 240000

/** a-z0-9 only: line breaks, hyphenation and justification drop out. */
const squash = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '')

const pageText = async (blob: Blob): Promise<string> => {
  const doc = await pdfjsLib.getDocument({
    data: new Uint8Array(await blob.arrayBuffer()),
  }).promise
  const pages: string[] = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    const items = (content.items as { str?: string }[])
      .map((item) => item.str ?? '')
      .join(' ')
    pages.push(items.replace(/\s+/g, ' ').trim())
  }
  return pages.join('\n')
}

type LocationProperties = {
  elevation?: number | null
  elevation_unit?: string
  vertical_datum?: string
}

const save = (name: string, bytes: ArrayBuffer) => {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(`${OUT_DIR}/${name}`, Buffer.from(bytes))
}

const packetCache = new Map<string, string>()

/**
 * The whole packet, optionally with the well's location properties replaced.
 * `photos: 3` is the reviewer's density: the one that shows both readings.
 */
const packetText = async (
  label: string,
  properties?: LocationProperties
): Promise<string> => {
  const cached = packetCache.get(label)
  if (cached) return cached
  const fixture = buildFieldSheetPageOneFixture({ photos: 3 })
  const well = properties
    ? { ...fixture.well, current_location: { properties } }
    : fixture.well
  const blob = await pdf(
    createElement(FieldCompilationNotesPdf, {
      ...fixture,
      well,
      hydrographImage: null,
    } as never) as never
  ).toBlob()
  const bytes = await blob.arrayBuffer()
  save(`packet-${label}.pdf`, bytes)
  const text = await pageText(new Blob([bytes]))
  packetCache.set(label, text)
  return text
}

const ownerSheetText = async (): Promise<string> => {
  const fixture = buildFieldSheetPageTwoFixture({ withOse: true })
  const blob = await pdf(
    createElement(
      Document,
      null,
      createElement(FieldSheetPageTwo, { ...fixture })
    ) as never
  ).toBlob()
  const bytes = await blob.arrayBuffer()
  save('owner-sheet.pdf', bytes)
  return pageText(new Blob([bytes]))
}

describe('L2 — reading label (D7)', () => {
  it(
    'no header or label in the packet or on the owner sheet still says "DTW Below MP"',
    async () => {
      const packet = squash(await packetText('fixture'))
      const owner = squash(await ownerSheetText())
      const retired = squash(RETIRED)

      expect(
        packet.includes(retired),
        `the packet still contains "${RETIRED}"`
      ).toBe(false)
      expect(
        owner.includes(retired),
        `the owner sheet still contains "${RETIRED}"`
      ).toBe(false)
    },
    TIMEOUT
  )

  it(
    'the packet labels the reading as depth to water below ground surface',
    async () => {
      const packet = squash(await packetText('fixture'))
      expect(packet).toContain(squash(LABEL))
    },
    TIMEOUT
  )

  it(
    'the owner sheet labels the reading as depth to water below ground surface',
    async () => {
      const owner = squash(await ownerSheetText())
      expect(owner).toContain(squash(LABEL))
    },
    TIMEOUT
  )
})

describe('L2 — elevation descriptor (D6)', () => {
  it('formats value + unit + datum and degrades cleanly', () => {
    expect(
      formatElevation({ elevation: 6234, elevation_unit: 'ft', vertical_datum: 'NAVD88' })
    ).toBe('6,234 ft (NAVD88)')
    // The datum is dropped when the well has none; the unit is never dropped.
    expect(formatElevation({ elevation: 6234, elevation_unit: 'ft' })).toBe('6,234 ft')
    expect(formatElevation({ elevation: 6234, vertical_datum: 'NAVD88' })).toBe(
      '6,234 ft (NAVD88)'
    )
    expect(formatElevation({ elevation: 6234 })).toBe('6,234')
    // A blank unit is the same as no unit.
    expect(formatElevation({ elevation: 6234, elevation_unit: '  ' })).toBe('6,234 ft')
    // Nothing to print stays the sheet's empty placeholder.
    expect(formatElevation({})).toBe('-')
    expect(formatElevation(null)).toBe('-')
  })

  it(
    'the shipped reviewer fixture prints a real elevation triple',
    async () => {
      const packet = await packetText('fixture')
      expect(packet).toContain('Elevation: 6,234 ft (NAVD88)')
    },
    TIMEOUT
  )

  it(
    'a well without a datum prints the unit and no parentheses',
    async () => {
      const packet = await packetText('unit-only', {
        elevation: 6234,
        elevation_unit: 'ft',
      })
      expect(packet).toContain('Elevation: 6,234 ft')
      expect(packet).not.toContain('NAVD88')
    },
    TIMEOUT
  )

  it(
    'a well with neither unit nor datum prints the grouped value alone',
    async () => {
      const packet = await packetText('bare', { elevation: 6234 })
      expect(packet).toContain('Elevation: 6,234')
      expect(packet).not.toContain('6,234 ft')
      expect(packet).not.toContain('NAVD88')
    },
    TIMEOUT
  )
})
