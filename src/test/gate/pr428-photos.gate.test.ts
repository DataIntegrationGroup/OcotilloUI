import fs from 'node:fs'
import { pdf } from '@react-pdf/renderer'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { FieldCompilationNotesPdf } from '@/components/pdf/fieldCompilation/page'
import { buildFieldSheetPageOneFixture } from '@/mock/fieldSheetPageOne.fixture'

/**
 * GATE — PR #428 review item 1 (photos: smaller, max 3, placeholder for 2,
 * collapse at 0).
 *
 * Liz's ask, verbatim:
 *   1. Make photos smaller, max 3 (it's okay to have a placeholder for
 *      >1<3 photos, < 1 should collapse the placeholders and justify the
 *      text/tables)
 *
 * This file is the gate. The worker runs it; the worker never edits it.
 * It fails on the pre-change tree by design (photo cell height is 140 pt and
 * the strip renders only the photos that exist — no placeholder).
 */
const OUT_DIR = '/Users/robbalch/workspace/jobs/fieldsheet-photos-20261108'

// Pre-change strip pitch: 140 pt cell + 12 pt gap = 152 pt between labels.
const MAX_LABEL_PITCH = 130

const ONE_PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

type PhotoGeometry = {
  pageCount: number
  /** y of each "Fixture photo N" caption, page space, top-down. */
  labelYs: number[]
  /** y of each "No photo" placeholder caption. */
  placeholderYs: number[]
  imageCount: number
  text: string
}

const measure = async (blob: Blob, photoCount: number): Promise<PhotoGeometry> => {
  const data = new Uint8Array(await blob.arrayBuffer())
  const document = await pdfjsLib.getDocument({ data }).promise
  const labelYs: number[] = []
  const placeholderYs: number[] = []
  let imageCount = 0
  const textParts: string[] = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()
    for (const item of content.items as any[]) {
      if (!item.str) continue
      textParts.push(item.str)
      if (item.str.startsWith('Fixture photo')) {
        labelYs.push(Math.round(item.transform[5]))
      }
      if (/no photo/i.test(item.str)) {
        placeholderYs.push(Math.round(item.transform[5]))
      }
    }
    const ops = await page.getOperatorList()
    // Count real image draws only. Labels and the dashed slot frame are text
    // and vector ops, so a placeholder must not inflate this number.
    for (let i = 0; i < ops.fnArray.length; i++) {
      if (
        ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject ||
        ops.fnArray[i] === pdfjsLib.OPS.paintJpegXObject
      ) {
        imageCount++
      }
    }
  }

  return {
    pageCount: document.numPages,
    labelYs,
    placeholderYs,
    imageCount,
    text: textParts.join(' '),
  }
}

const render = async (photos: number) => {
  const fixture = buildFieldSheetPageOneFixture({ photos })
  const blob = await pdf(
    createElement(FieldCompilationNotesPdf, {
      well: fixture.well,
      contacts: fixture.contacts,
      assets: fixture.assets.map((asset, index) => ({
        ...asset,
        label: `Fixture photo ${index + 1}`,
        signed_url: ONE_PIXEL_PNG,
      })),
      observations: [],
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
  fs.writeFileSync(`${OUT_DIR}/page1-${photos}photos.pdf`, buf)
  return blob
}

describe('gate: photo strip is smaller, capped at three, keeps a placeholder at two, collapses at zero', () => {
  it('three photos: one page, three images, smaller pitch', async () => {
    const geometry = await measure(await render(3), 3)

    expect(geometry.pageCount, 'page 1 must stay one page').toBe(1)
    expect(geometry.imageCount, 'three photos must draw three images').toBe(3)
    expect(geometry.labelYs.length, 'three captions').toBe(3)

    const pitch = Math.abs(geometry.labelYs[0] - geometry.labelYs[1])
    expect(pitch, `photo pitch ${pitch} pt must be at most ${MAX_LABEL_PITCH} pt`).toBeLessThanOrEqual(
      MAX_LABEL_PITCH
    )
  }, 120000)

  it('two photos: a third slot is reserved as an empty placeholder', async () => {
    const geometry = await measure(await render(2), 2)

    expect(geometry.pageCount, 'page 1 must stay one page').toBe(1)
    expect(geometry.imageCount, 'two photos must draw two images, not three').toBe(2)

    expect(geometry.labelYs.length, 'two photos must keep two captions').toBe(2)
    expect(geometry.placeholderYs.length, 'exactly one empty slot at two photos').toBe(1)

    // The placeholder sits in the third slot: one photo pitch below the second
    // caption, at the same y as a real third photo's caption.
    const threeUp = await measure(await render(3), 3)
    const pitch = Math.abs(threeUp.labelYs[0] - threeUp.labelYs[1])
    const expectedY = geometry.labelYs[1] - pitch
    expect(
      Math.abs(geometry.placeholderYs[0] - expectedY),
      `placeholder at y ${geometry.placeholderYs[0]} must land in the third slot (y ${expectedY})`
    ).toBeLessThanOrEqual(8)

    expect(
      /no photo/i.test(geometry.text),
      'the empty slot must say it is a placeholder ("No photo")'
    ).toBe(true)
  }, 120000)

  it('no photos: the strip collapses and nothing is drawn', async () => {
    const geometry = await measure(await render(0), 0)

    expect(geometry.pageCount, 'page 1 must stay one page').toBe(1)
    expect(geometry.imageCount, 'no photos must draw no images').toBe(0)
    expect(geometry.labelYs.length, 'no photo captions at all').toBe(0)
    expect(geometry.placeholderYs.length, 'no placeholder at zero photos').toBe(0)
    expect(geometry.text.includes('Site Notes'), 'the measurements table still renders').toBe(true)
  }, 120000)
})
