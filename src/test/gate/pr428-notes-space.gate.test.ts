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
 * Measured pre-change at the item-1/10/14 tip: the `Notes:` label to the
 * `Installed Equipment` title is 38 pt (one 16 pt line plus padding), and the
 * `Site Notes` column header sits at x 499 with photos: 0 and x 344 with
 * photos: 3.
 */
const OUT_DIR = '/Users/robbalch/workspace/jobs/fieldsheet-item13-20261109'
const GAP_MIN = 60 // three 16 pt lines + 1 pt gaps puts a correct fix near 72

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
    const installed = findOne(items, (i) => /^Installed Equipment$/.test(i.s), 'the Installed Equipment title').y

    const gap = notes - installed
    expect(
      gap,
      `Notes: at y=${notes.toFixed(1)}, Installed Equipment at y=${installed.toFixed(1)}: ` +
        `three fill lines need ≥ ${GAP_MIN} pt, measured ${gap.toFixed(1)} pt`
    ).toBeGreaterThanOrEqual(GAP_MIN)
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
})
