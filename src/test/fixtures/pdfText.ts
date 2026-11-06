import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

/**
 * Shared page-text extraction for the PDF mock-up tests.
 *
 * Hoisted 2026-10-30 from the verbatim inline blocks that
 * `src/test/components/fieldSheetPageOneMock.test.ts` and
 * `src/test/components/fieldSheetPageTwoMock.test.ts` each duplicated: render a
 * PDF Blob to bytes, walk every page, and concat its text items. Same body, one
 * copy — neither caller needs pdfjsLib anymore. Test helper, so it lives under
 * src/test/fixtures/, next to regulatoryLimits.ts.
 */

export const extractPdfText = async (
  blob: Blob
): Promise<{ pageCount: number; text: string }> => {
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
