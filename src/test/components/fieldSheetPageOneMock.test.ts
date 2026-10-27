import { pdf } from '@react-pdf/renderer'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { FieldCompilationNotesPdf } from '@/components/pdf/FieldCompilationNotesPdf'
import type { IPdfDensity } from '@/interfaces'
import { buildFieldSheetPageOneFixture } from '@/mock/fieldSheetPageOne.fixture'

/**
 * Page 1 of the BDMS-1504 sheet, rendered the way the review route renders it:
 * fixture only, no date stamp, page 1 alone.
 */
const ONE_PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const renderPageOne = async ({
  photos,
  density = 'standard',
  notesPlacement = 'column',
}: {
  photos: number
  density?: IPdfDensity
  notesPlacement?: 'column' | 'top'
}) => {
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
      observations: fixture.observations,
      sensorDeployments: fixture.sensorDeployments,
      hydrographImage: fixture.hydrographImage,
      sampleMethodsBySampleId: fixture.sampleMethodsBySampleId,
      density,
      showDate: false,
      emptyPlaceholder: ' ',
      notesPlacement,
      firstPageOnly: true,
    }) as any
  ).toBlob()

  const data = new Uint8Array(await blob.arrayBuffer())
  const document = await pdfjsLib.getDocument({ data }).promise
  const pages: string[] = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
    const page = await document.getPage(pageNumber)
    const textContent = await page.getTextContent()
    pages.push(textContent.items.map((item: any) => item.str).join(''))
  }

  return { pageCount: document.numPages, text: pages.join('\n') }
}

describe('field sheet page 1 mock-up', () => {
  it('prints three of five photographs and stays on one page', async () => {
    const { pageCount, text } = await renderPageOne({ photos: 5 })

    expect(pageCount).toBe(1)
    expect(text).toContain('Fixture photo 1')
    expect(text).toContain('Fixture photo 3')
    expect(text).not.toContain('Fixture photo 4')
  })

  it('keeps a one-photo sheet on one page', async () => {
    const { pageCount, text } = await renderPageOne({ photos: 1 })

    expect(pageCount).toBe(1)
    expect(text).toContain('Fixture photo 1')
    expect(text).not.toContain('Fixture photo 2')
  })

  it('fills a photo-less sheet without spilling to a second page', async () => {
    const { pageCount } = await renderPageOne({ photos: 0 })

    expect(pageCount).toBe(1)
  })

  it('keeps one page at every density step', async () => {
    for (const density of ['comfortable', 'standard', 'compact'] as const) {
      const { pageCount } = await renderPageOne({ photos: 5, density })

      expect(pageCount, density).toBe(1)
    }
  })

  it('keeps one page with the notes block at the top', async () => {
    const column = await renderPageOne({ photos: 1, notesPlacement: 'column' })
    const top = await renderPageOne({ photos: 1, notesPlacement: 'top' })

    expect(column.pageCount).toBe(1)
    expect(top.pageCount).toBe(1)
    expect(top.text).toContain('Field Notes')
  })

  it('prints the template with expected date formats', async () => {
    const { text } = await renderPageOne({ photos: 3 })

    expect(text).toContain('Field Compilation Notes')
    // Amendment G added date fields (e.g., "Date: Oct 27, 2026"), so the
    // year appears. The test was previously checking for "no date stamp"
    // but that was before the date fields were introduced.
    expect(text).toContain('Date:')
    expect(text).toContain(String(new Date().getFullYear()))
  })
})
