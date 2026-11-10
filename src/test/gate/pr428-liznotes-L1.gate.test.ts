/**
 * PR #428 / Liz notes — lane L1: page 1 carries the latest reading, not a log.
 *
 * Frozen gate. Written by the planner; the worker runs it and never edits it.
 *
 * What it decides, from Rob's rulings on 2026-11-09:
 *
 *  - D1 — the Observation card is removed from page 1.
 *  - D2(a) — the Previous Measurements table is replaced by a one-row
 *    *Today's Measurement* table, prefilled from the newest observation (Rob
 *    picked the prefilled variant, not the blank write-in).
 *  - item 2 — the reading column keeps its spelled-out header (`Depth to Water
 *    Below Ground Surface`), `MP Ht` is removed from page 1 entirely, and
 *    Method / Level Status / Site Notes keep that left-to-right order.
 *  - D10 — the blank `Staff` column is gone; the only `Staff` left on page 1 is
 *    the hand-writable `Staff:` label in the New Measurement card.
 *  - Liz §4 — Installed Equipment moves between Today's Measurement and the
 *    New Measurement write-in card.
 *
 * Anchors: the fixture's three readings are Sep 18 (12.4, Steel tape, Steady),
 * Oct 22 (11.9, Steel tape, Steady) and Nov 5 (11.2, Pressure transducer,
 * Falling), printed at two decimals. Only the Nov 5 row may survive on page 1,
 * so the older dates, values, methods and statuses are absent — that is what
 * proves the single row is *prefilled from the newest observation* rather than
 * left blank or copied from the old table's first row.
 *
 * Text comparisons are squashed to a-z0-9 because react-pdf breaks and
 * hyphenates inside narrow cells; positions use the PDF baseline (larger y is
 * higher on the page).
 */
import fs from 'node:fs'
import { pdf } from '@react-pdf/renderer'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { FieldCompilationNotesPdf } from '@/components/pdf/fieldCompilation/page'
import { buildFieldSheetPageOneFixture } from '@/mock/fieldSheetPageOne.fixture'

const OUT_DIR = '/Users/robbalch/workspace/jobs/nmbg-liznotes-20261109/L1'
const TIMEOUT = 240000

type Item = { str: string; x: number; y: number }
type Packet = { pages: { raw: string; items: Item[] }[] }

/** a-z0-9 only: line breaks, hyphenation and justification drop out. */
const squash = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '')

let cached: Promise<Packet> | null = null

const packet = (): Promise<Packet> =>
  (cached ??= (async () => {
    const fixture = buildFieldSheetPageOneFixture({ photos: 3 })
    const blob = await pdf(
      createElement(FieldCompilationNotesPdf, {
        ...fixture,
        hydrographImage: null,
      } as never) as never
    ).toBlob()
    const bytes = new Uint8Array(await blob.arrayBuffer())
    fs.mkdirSync(OUT_DIR, { recursive: true })
    fs.writeFileSync(`${OUT_DIR}/liznotes-L1-packet.pdf`, Buffer.from(bytes))
    const doc = await pdfjsLib.getDocument({ data: bytes }).promise
    const pages: Packet['pages'] = []
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p)
      const content = await page.getTextContent()
      const items = (content.items as never[])
        .filter((i: never) => (i as { str?: string }).str?.trim())
        .map((i: never) => {
          const it = i as { str: string; transform: number[] }
          return { str: it.str, x: it.transform[4], y: it.transform[5] }
        })
      pages.push({ raw: items.map((i) => i.str).join(' '), items })
    }
    return { pages }
  })())

/** Page 1 text, squashed. Page 1 only: pages 2-4 are lane L3's business. */
const body = async (): Promise<string> => squash((await packet()).pages[0].raw)

const page1Items = async (): Promise<Item[]> => (await packet()).pages[0].items

/** Baseline (y) of the highest item whose squashed text contains `needle`. */
const topmost = (items: Item[], needle: string): number => {
  const hits = items.filter((i) => squash(i.str).includes(squash(needle)))
  return hits.length ? Math.max(...hits.map((h) => h.y)) : Number.NEGATIVE_INFINITY
}

/**
 * The measurement table's header row, read left to right as one squashed
 * string. Anchored on the `Method` header — the labels before it are short
 * enough to survive as one item, while `Level Status` wraps to a second line
 * and `Depth to Water Below Ground Surface (ft)` wraps to three, so matching
 * labels by exact text would silently skip cells.
 */
const headerRow = (items: Item[]): string => {
  const method = items.filter(
    (i) => squash(i.str) === 'method' && i.x > 100
  )[0]
  if (!method) return ''
  return squash(
    items
      .filter((i) => Math.abs(i.y - method.y) < 0.5)
      .sort((a, b) => a.x - b.x)
      .map((i) => i.str)
      .join(' ')
  )
}

describe('L1 — page 1 shows the latest reading, no log, no MP Ht, no Staff column', () => {
  it('renders a readable page 1', async () => {
    expect((await packet()).pages.length).toBeGreaterThanOrEqual(1)
    expect((await body()).length).toBeGreaterThan(200)
  }, TIMEOUT)

  it('D1 — the Observation card no longer prints', async () => {
    expect(await body()).not.toContain('observation')
  }, TIMEOUT)

  it("D2(a) — Previous Measurements is replaced by Today's Measurement", async () => {
    const text = await body()
    expect(text).not.toContain('previousmeasurements')
    expect(text).toContain('todaysmeasurement')
  }, TIMEOUT)

  it('D2(a) — the row is prefilled from the newest observation', async () => {
    const text = await body()
    expect(text).toContain(squash('Nov 5, 2026'))
    expect(text).toContain('1120')
    expect(text).toContain(squash('Pressure transducer'))
    expect(text).toContain('falling')
    expect(text).toContain(squash('Pump cycled twice during the visit.'))
  }, TIMEOUT)

  it('D2(a) — the older readings are gone from page 1', async () => {
    const text = await body()
    expect(text).not.toContain(squash('Oct 22, 2026'))
    expect(text).not.toContain(squash('Sep 18, 2026'))
    expect(text).not.toContain('1190')
    expect(text).not.toContain('1240')
    expect(text).not.toContain(squash('Steel tape'))
    expect(text).not.toContain('steady')
  }, TIMEOUT)

  it('item 2 — the reading column is spelled out', async () => {
    expect(await body()).toContain(
      squash('Depth to Water Below Ground Surface')
    )
  }, TIMEOUT)

  it('item 2 / D10 — MP Ht and the Staff column are gone', async () => {
    const text = await body()
    expect(text).not.toContain('mpht')
    const staff = (await packet()).pages[0].raw.match(/Staff/g) ?? []
    // One occurrence only: the hand-writable `Staff:` label in the write-in box.
    expect(staff.length).toBe(1)
  }, TIMEOUT)

  it('item 2 — Method, Level Status, Site Notes keep their order', async () => {
    const header = headerRow(await page1Items())
    expect(header.length).toBeGreaterThan(0)
    const cols = ['date', 'method', 'level', 'sitenotes']
    const at = cols.map((c) => header.indexOf(c))
    for (let i = 1; i < at.length; i++) {
      expect(at[i - 1]).toBeGreaterThanOrEqual(0)
      expect(at[i]).toBeGreaterThan(at[i - 1])
    }
  }, TIMEOUT)

  it('item 3 — page 1 still fits: nothing spills onto a continuation sheet', async () => {
    // Baseline fact at 3 photos: page 1 currently overflows and the equipment
    // table plus the write-in card land on a second physical page. The single
    // row and the dropped Observation card buy the height back; this pins it.
    const p = await packet()
    expect(squash(p.pages[1].raw)).not.toContain('equipmenttype')
    expect(squash(p.pages[1].raw)).not.toContain('installedequipment')
  }, TIMEOUT)

  it("Liz §4 — Installed Equipment sits between Today's Measurement and New Measurement", async () => {
    const items = await page1Items()
    const today = topmost(items, "Today's Measurement")
    const equipment = topmost(items, 'Installed Equipment')
    const writeIn = topmost(items, 'New Measurement')
    expect(today).toBeGreaterThan(Number.NEGATIVE_INFINITY)
    expect(equipment).toBeGreaterThan(Number.NEGATIVE_INFINITY)
    expect(writeIn).toBeGreaterThan(Number.NEGATIVE_INFINITY)
    expect(today).toBeGreaterThan(equipment)
    expect(equipment).toBeGreaterThan(writeIn)
  }, TIMEOUT)
})
