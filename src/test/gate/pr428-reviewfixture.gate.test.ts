import fs from 'node:fs'
import { pdf } from '@react-pdf/renderer'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { FieldCompilationNotesPdf } from '@/components/pdf/fieldCompilation/page'
import { buildFieldSheetPageOneFixture } from '@/mock/fieldSheetPageOne.fixture'

/**
 * GATE — PR #428 review surface.
 *
 * The shared mock fixture fed the review build an empty observation list and an
 * empty site-note list, so on the deployed page 1 the "Previous Measurements"
 * block printed nothing and the Site Notes column printed nothing. Liz cannot
 * review items 11 and 14 against an empty sheet: the block looks unimplemented
 * when it is simply unfed.
 *
 * This gate requires the fixture to carry data and the sheet to show the last
 * two of it — nothing more. Marker values are part of the brief.
 *
 * Fails on the pre-change tree: with `observations: []` and `site_notes: []`
 * none of these strings render.
 */
const OUT_DIR = '/Users/robbalch/workspace/jobs/fieldsheet-reviewfixture-20261109'

const extractText = async (blob: Blob) => {
  const data = new Uint8Array(await blob.arrayBuffer())
  const document = await pdfjsLib.getDocument({ data }).promise
  const parts: string[] = []
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()
    for (const item of content.items as any[]) {
      if (item.str) parts.push(item.str)
    }
  }
  return { pageCount: document.numPages, text: parts.join(' ').replace(/\s+/g, ' ') }
}

const renderReviewSheet = async () => {
  const fixture = buildFieldSheetPageOneFixture({ photos: 0 })
  const blob = await pdf(
    createElement(FieldCompilationNotesPdf, { ...fixture, firstPageOnly: true }) as any
  ).toBlob()
  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(`${OUT_DIR}/page1.pdf`, Buffer.from(await blob.arrayBuffer()))
  return extractText(blob)
}

describe('gate: the review build carries data Liz can actually read', () => {
  it('previous measurements and site notes show the last two of the fixture', async () => {
    const { pageCount, text } = await renderReviewSheet()

    expect(pageCount, 'page 1 must stay one page with the fixture data loaded').toBe(1)

    // Two newest depth-to-water readings (formatted to two decimals).
    expect(text.includes('11.20'), 'newest DTW 11.20 must render').toBe(true)
    expect(text.includes('11.90'), 'second-newest DTW 11.90 must render').toBe(true)
    expect(text.includes('12.40'), 'only the last two measurements may render').toBe(false)

    // Method joins from sampleMethodsBySampleId, so this also proves the
    // method wiring, not just the row.
    expect(text.includes('Pressure transducer'), 'method must render in its column').toBe(true)

    // Two newest site notes, newest on the newest row.
    expect(text.includes('Pump cycled twice'), 'newest site note must render').toBe(true)
    expect(text.includes('Casing intact'), 'second-newest site note must render').toBe(true)
    expect(text.includes('Marker repainted'), 'only the last two site notes may render').toBe(false)
  }, 180000)
})
