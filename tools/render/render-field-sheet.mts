/**
 * Render the BDMS field-sheet pages to standalone PDFs, outside the app.
 *
 * Why: the mock routes (`/mock/field-sheet/page-1`, `-2`) only ever render inside
 * a browser PDFViewer, behind the dev server and the Authentik login. That means a
 * local model cannot look at the sheet unless a human is sitting in the browser.
 * This script writes the same pages to disk so they can be rasterised
 * (`pdftoppm`) or served (`python3 -m http.server`) and viewed by anyone.
 *
 * Run (repo root):  node_modules/.bin/vite-node tools/render-field-sheet.mts
 * Output:           $OUT_DIR (arg 1) or ./visual/pdf
 *
 * It imports the components and fixtures directly, so it renders whatever the
 * working tree currently says — no build, no dev server, no auth.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { Document, renderToBuffer } from '@react-pdf/renderer'

import { FieldCompilationNotesPdf } from '@/components/pdf/FieldCompilationNotesPdf'
import { FieldSheetPageTwo } from '@/components/pdf/FieldSheetPageTwo'
import { buildWeaverQrDataUrl } from '@/components/pdf/chemistry/wellQrCode'
import { buildFieldSheetPageOneFixture } from '@/mock/fieldSheetPageOne.fixture'
import { buildFieldSheetPageTwoFixture } from '@/mock/fieldSheetPageTwo.fixture'

const outDir = path.resolve(process.argv[2] ?? 'visual/pdf')
fs.mkdirSync(outDir, { recursive: true })

/**
 * The fixtures carry web-root paths (`/images/pixel/ocotillo-spout.png`). In a
 * browser the dev server serves those; in node react-pdf treats them as
 * filesystem paths and throws ENOENT. Rewrite every such string to the real file
 * under `public/` so the standalone render is self-contained.
 */
const localize = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return value.startsWith('/images/')
      ? path.resolve('public', value.slice(1))
      : value
  }

  if (Array.isArray(value)) return value.map(localize)

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [key, localize(inner)])
    )
  }

  return value
}

const write = async (name: string, element: unknown): Promise<void> => {
  const buffer = await renderToBuffer(
    element as Parameters<typeof renderToBuffer>[0]
  )
  const target = path.join(outDir, name)
  fs.writeFileSync(target, buffer)

  console.log(`  ${name}\t${buffer.length} bytes`)
}

const main = async (): Promise<void> => {
  // One file per Photos-switch state the review route offers: 0 (off) and 5 (on,
  // up to PHOTO_SLOT_CAP). Both must land on a single LETTER page, so each is a
  // gate. Names stay unsuffixed so existing gates and notes that reference
  // page1-photos0.pdf keep resolving.
  for (const photos of [0, 3, 5] as const) {
    const fixture = localize(
      buildFieldSheetPageOneFixture({ photos })
    ) as ReturnType<typeof buildFieldSheetPageOneFixture>

    await write(
      `page1-photos${photos}.pdf`,
      createElement(FieldCompilationNotesPdf, {
        well: fixture.well,
        contacts: fixture.contacts,
        assets: fixture.assets,
        observations: fixture.observations,
        sensorDeployments: fixture.sensorDeployments,
        hydrographImage: fixture.hydrographImage,
        sampleMethodsBySampleId: fixture.sampleMethodsBySampleId,
        showDate: false,
        emptyPlaceholder: ' ',
        firstPageOnly: false,
      })
    )
  }

  for (const withOse of [true, false] as const) {
    const data = localize(
      buildFieldSheetPageTwoFixture({ withOse })
    ) as ReturnType<typeof buildFieldSheetPageTwoFixture>

    // Same QR the page prints in the footer, built from the same link.
    const qrDataUrl = await buildWeaverQrDataUrl(data.pointId)

    await write(
      `page2-${withOse ? 'with-ose' : 'no-ose'}.pdf`,
      // The page-2 sheet is a bare <Page>, so it needs a <Document> host.
      createElement(
        Document,
        null,
        createElement(FieldSheetPageTwo, { ...data, qrDataUrl })
      )
    )
  }
}

await main()
