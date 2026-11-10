import fs from 'node:fs'
import { pdf } from '@react-pdf/renderer'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { FieldCompilationNotesPdf } from '@/components/pdf/fieldCompilation/page'
import { buildFieldSheetPageOneFixture } from '@/mock/fieldSheetPageOne.fixture'

/**
 * GATE — PR #428 item 13, "More space for Notes at bottom; condense photos;
 * let sections span width."
 *
 * Rob's calls: three fill lines under `Notes:`, photo strip stays one third
 * with 100 pt frames, sections span the full width only when there are no
 * photos.
 *
 * Measured at the item-1/10/14 tip: the `Notes:` label sat 38 pt from the
 * `Installed Equipment` title (one 16 pt line plus padding), and the
 * `Site Notes` column header sat at x 499 with photos: 0 and x 344 with
 * photos: 3.
 *
 * Retargeted 2026-11-10 by the planner, before L6 ran. Page 1 reflowed after
 * that tip (one-page frame at 0ec9dd9c, notes renderer at 3fbed47d): the
 * write-in block now sits at the FOOT of the sheet, so `notes.y - installed.y`
 * measures -302.6 pt with photos: 3 and -285.5 pt with photos: 0. No layout can
 * satisfy ">= 60" against that pair without moving the block above the
 * equipment table, which is not what item 13 asks for. The invariant item 13
 * needs is the room BELOW the label, where the three 16 pt rows are written:
 * the label must clear the page footer by >= 60 pt. Threshold unchanged, pair
 * retargeted; old -> new is recorded in LANES.json with this file's sha256.
 *
 * Clarified by Rob 2026-11-10: that -302.6 / -285.5 pair is measured in the
 * LOWER HALF of the sheet, below any possible photo. The strip is one third
 * wide and holds three 100 pt frames — it fills its column for the top third
 * of the page and nothing below it. Today page 1 reserves that column for the
 * full height anyway, so the lower tables (Installed Equipment, the New
 * Measurement box) stop at x 392 and leave the strip's band empty below the
 * last frame. Rob's ask: below any possible photo, the lower tables continue
 * left across the page and fill the space the strip does not use. The
 * `Site Notes` header stays where the upper tables live (beside the strip),
 * so its pair of assertions is unchanged; the new third assertion is the
 * lower-half one, keyed on the equipment table's last column header.
 */
const OUT_DIR = '/Users/robbalch/workspace/jobs/fieldsheet-item13-20261109'
const CLEAR_MIN = 60 // three 16 pt rows plus the label, written above the footer
// The strip's band starts here (content column is two thirds of 516 pt + the
// 48 pt margin). A lower table that still honours the strip stops short of it;
// one that fills the space below the frames puts its last column near x 490.
const STRIP_BAND_X = 392
const LOWER_TABLE_MIN_X = 440

const loadPage = async (photos: 0 | 3) => {
  const fixture = buildFieldSheetPageOneFixture({ photos })
  const blob = await pdf(
    createElement(FieldCompilationNotesPdf, { ...fixture, firstPageOnly: true }) as any
  ).toBlob()
  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(`${OUT_DIR}/page1-photos${photos}.pdf`, Buffer.from(await blob.arrayBuffer()))
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise
  const page = await doc.getPage(1)
  const content = await page.getTextContent()
  const items = (content.items as any[])
    .filter((i) => i.str && i.str.trim())
    .map((i) => ({ s: i.str.trim(), x: i.transform[4], y: i.transform[5] }))
  return { pageCount: doc.numPages, items }
}

const findOne = (
  items: Array<{ s: string; x: number; y: number }>,
  pred: (i: { s: string; x: number; y: number }) => boolean,
  why: string
) => {
  const hits = items.filter(pred)
  expect(hits.length, `${why} must appear exactly once on page 1`).toBe(1)
  return hits[0]
}

describe.each([0, 3] as const)('gate: item 13 with photos=%i', (photos) => {
  it('Notes has room for three lines and the sheet still fits one page', async () => {
    const { pageCount, items } = await loadPage(photos)
    expect(pageCount, 'adding notes lines may not spill page 1 onto a second page').toBe(1)

    // The New Measurement label sits in the left write-in column; the site-notes
    // table also has a column headed "Notes", so disambiguate by x.
    const notes = findOne(items, (i) => /^Notes:?$/.test(i.s) && i.x < 100, 'the New Measurement Notes: label').y
    const footer = findOne(items, (i) => /^Well ID:/.test(i.s), 'the page footer').y

    const clearance = notes - footer
    expect(
      clearance,
      `Notes: at y=${notes.toFixed(1)}, footer at y=${footer.toFixed(1)}: ` +
        `three fill rows plus their label need ≥ ${CLEAR_MIN} pt above the footer, measured ${clearance.toFixed(1)} pt`
    ).toBeGreaterThanOrEqual(CLEAR_MIN)
  }, 240000)

  it('tables span the width available to them', async () => {
    const { items } = await loadPage(photos)
    const header = findOne(items, (i) => /^Site Notes$/.test(i.s), 'the Site Notes column header')
    const x = header.x
    if (photos === 0) {
      expect(x, `no photo strip: the table must span the content width (x ≥ 380, got ${x.toFixed(1)})`).toBeGreaterThanOrEqual(380)
    } else {
      expect(x, `photo strip retained at one third (260 ≤ x ≤ 300, got ${x.toFixed(1)})`).toBeGreaterThanOrEqual(260)
      expect(x, `photo strip retained at one third (260 ≤ x ≤ 300, got ${x.toFixed(1)})`).toBeLessThanOrEqual(300)
    }
  }, 240000)

  it('the lower half flows under the photo strip', async () => {
    const { items } = await loadPage(photos)
    // Installed Equipment is the first table below the frames. Its last column
    // header is the only bare "Notes" on page 1 ("Notes:" is the write-in label,
    // "Site Notes" is the measurements column).
    const last = findOne(items, (i) => /^Notes$/.test(i.s), 'the Installed Equipment Notes column header')
    expect(
      last.x,
      `strip band starts at x ${STRIP_BAND_X}: the lower tables must keep flowing left ` +
        `and fill the frames' unused space (x ≥ ${LOWER_TABLE_MIN_X}, got ${last.x.toFixed(1)})`
    ).toBeGreaterThanOrEqual(LOWER_TABLE_MIN_X)
  }, 240000)
})
