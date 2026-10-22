import { Document, pdf } from '@react-pdf/renderer'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { FieldSheetPageTwo } from '@/components/pdf/FieldSheetPageTwo'
import { buildFieldSheetPageTwoFixture } from '@/mock/fieldSheetPageTwo.fixture'
import { buildWeaverQrDataUrl } from '@/components/pdf/chemistry/wellQrCode'

/**
 * Page 2 of the BDMS-1507 sheet, rendered the way the review route renders it:
 * fixture only. Both OSE variants are checked — the OSE cell prints when present
 * and disappears entirely when `withOse` is false.
 */
const renderPageTwo = async ({
  withOse,
  qrDataUrl,
}: {
  withOse: boolean
  qrDataUrl?: string
}) => {
  const fixture = buildFieldSheetPageTwoFixture({ withOse, qrDataUrl })
  const blob = await pdf(
    createElement(
      Document,
      null,
      createElement(FieldSheetPageTwo, { ...fixture })
    ) as any
  ).toBlob()

  const data = new Uint8Array(await blob.arrayBuffer())
  const stream = new TextDecoder('latin1').decode(data)
  const document = await pdfjsLib.getDocument({ data }).promise
  const pages: string[] = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
    const page = await document.getPage(pageNumber)
    const textContent = await page.getTextContent()
    pages.push(textContent.items.map((item: any) => item.str).join(''))
  }

  return {
    pageCount: document.numPages,
    text: pages.join('\n'),
    stream,
  }
}

describe('field sheet page 2 mock-up', () => {
  it('renders to at least one full page of text', async () => {
    const { pageCount, text } = await renderPageTwo({ withOse: true })

    expect(pageCount).toBeGreaterThanOrEqual(1)
    expect(text.length).toBeGreaterThan(0)
  })

  it('embeds a real QR image (not the placeholder) when qrDataUrl is supplied', async () => {
    const dataUrl = await buildWeaverQrDataUrl('WL-0085')
    // Sanity: the helper produces a decodable PNG we can actually embed.
    expect(dataUrl).toBeTruthy()
    if (!dataUrl) throw new Error('expected a real QR data URL for WL-0085')
    expect(dataUrl).toMatch(/^data:image\/png;base64,/)

    const { stream, text } = await renderPageTwo({
      withOse: true,
      qrDataUrl: dataUrl,
    })

    // The PNG is embedded as an image XObject — proof an image renders in the
    // QR area, not just a label. (The placeholder path embeds no image.)
    expect(stream).toContain('/Subtype /Image')
    // The literal placeholder is gone wherever a real code now prints.
    expect(text).not.toContain('[QR Code]')
  })

  it('prints the header, subtitle and info labels (OSE present)', async () => {
    const { text } = await renderPageTwo({ withOse: true })

    expect(text).toContain('Your Well: Reserve Well 4')
    expect(text).toContain('Healy Collaborative Groundwater Monitoring Network')
    expect(text).toContain('Site Name:')
    expect(text).toContain('Point ID:')
    expect(text).toContain('Well Depth:')
    expect(text).toContain('OSE #:')
    expect(text).toContain('2024-NMT-0085')
  })

  it('omits the OSE cell entirely when withOse is false', async () => {
    const { text } = await renderPageTwo({ withOse: false })

    expect(text).not.toContain('OSE #:')
    expect(text).not.toContain('2024-NMT-0085')
  })

  it('prints the dated hydrograph caption from the readings', async () => {
    const { text } = await renderPageTwo({ withOse: true })

    expect(text).toContain('Depth to Water')
    expect(text).toContain('2021 – 2025')
  })

  it('prints the four table headers and the em dash empty convention', async () => {
    const { text } = await renderPageTwo({ withOse: true })

    expect(text).toContain('Date')
    expect(text).toContain('DTW (ft)')
    expect(text).toContain('MP Ht (ft)')
    expect(text).toContain('Level Status')
    // Two of the five rows have no level status; they print an em dash.
    expect(text).toContain('—')
  })

  it('prints all five measurement rows newest first', async () => {
    const { text } = await renderPageTwo({ withOse: true })

    expect(text).toContain('Dec 23, 2025')
    expect(text).toContain('Jun 6, 2024')
    expect(text).toContain('Jun 15, 2023')
    expect(text).toContain('May 18, 2022')
    expect(text).toContain('Jun 23, 2021')
    expect(text).toContain('Water level not affected')
    expect(text).toContain('Site was pumped recently')
  })

  it('prints the hand-writable write-in area (value not printed)', async () => {
    const { text } = await renderPageTwo({ withOse: true })

    expect(text).toContain("Today's Measurement")
    expect(text).toContain('Your water level measured on this visit:')
    expect(text).toContain('Date:')
    expect(text).toContain('Depth to water (ft):')
    expect(text).toContain('ft')
  })

  it('prints the footer: QR placeholder, link and contact', async () => {
    const { text } = await renderPageTwo({ withOse: true })

    expect(text).toContain('[QR Code]')
    expect(text).toContain('View your well data online:')
    expect(text).toContain('weaver.newmexicowaterdata.org')
    expect(text).toContain('location/')
    expect(text).toContain('WL-0085')
    expect(text).toContain('For questions:')
    expect(text).toContain('nmbg-waterlevels@nmt.edu')
  })

  it('prints the page footer with the point id and page number', async () => {
    const { text } = await renderPageTwo({ withOse: true })

    // ALIGNMENT A12. Guards the absolute-position regressions found 2026-10-21:
    // `bottom` is ignored by react-pdf here and the footer silently vanished.
    expect(text).toMatch(/Well ID: WL-0085 \| Page \d+ of 2/)
  })

  it('prints the staff line with data, not a literal', async () => {
    const { text } = await renderPageTwo({ withOse: true })

    expect(text).toContain(
      'Visited by: Ethan Mamer | ethan.mamer@nmt.edu | (575) 555-0142'
    )
  })
})

/**
 * The review route must supply the <Document> the PDFViewer needs. Page 2 is a
 * bare <Page>, unlike FieldCompilationNotesPdf which is self-documenting — so
 * without this wrapper the route renders an empty viewer. Added 2026-10-20
 * after page 2 shipped blank on the preview while page 1 rendered.
 */
describe('field sheet page 2 review route', () => {
  it('wraps the page in a Document inside PDFViewer', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync(
      new URL('../../pages/mock/FieldSheetPageTwoMock.tsx', import.meta.url),
      'utf8'
    )
    const viewer = src.slice(src.indexOf('<PDFViewer'))
    expect(viewer).toMatch(/<PDFViewer[^>]*>\s*<Document>/)
    expect(viewer).toMatch(/<\/Document>\s*<\/PDFViewer>/)
  })
})
