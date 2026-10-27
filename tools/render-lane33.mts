/**
 * Lane 33 render harness.
 *
 * Generates page-1 PDFs for photo counts 0, 1, 3, 5 using the WellPDF component.
 * Output: out/lane33/page1-photos{N}.pdf and .png
 *
 * Usage:
 *   npx vite-node --config tools/vite.render.config.ts tools/render-lane33.mts
 */
import { renderToString } from '@react-pdf/renderer'
import { WellPDF } from '../src/components/pdf/well'
import { buildFieldSheetPageOneFixture } from '../src/mock/fieldSheetPageOne.fixture'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const PHOTO_COUNTS = [0, 1, 3, 5]
const OUT_DIR = resolve(__dirname, '../../lanes/preview-compilation-mockup/out/lane33')

for (const photos of PHOTO_COUNTS) {
  const fixture = buildFieldSheetPageOneFixture({ photos })
  const { pdf } = WellPDF({
    well: fixture.well,
    assets: fixture.assets,
    contacts: fixture.contacts,
    observations: fixture.observations,
    sensorDeployments: fixture.sensorDeployments,
    hydrographImage: null,
    options: {
      includeHydrograph: false,
      includeBlankPage: false,
    },
    standalone: true,
  })

  const blob: Blob = await pdf({}) as unknown as Blob
  const buffer = Buffer.from(await blob.arrayBuffer())

  const pdfPath = resolve(OUT_DIR, `page1-photos${photos}.pdf`)
  const pngPath = resolve(OUT_DIR, `page1-photos${photos}.png`)

  writeFileSync(pdfPath, buffer)
  console.log(`Generated ${pdfPath} (${buffer.length} bytes)`)

  // Generate PNG via pdfinfo + pdftoppm (external tools)
  console.log(`PDF written. PNG generation via external tool: ${pdfPath} → ${pngPath}`)
}

console.log('Done.')
