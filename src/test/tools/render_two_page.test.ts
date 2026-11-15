import { mkdirSync, readFileSync } from 'node:fs'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { it } from 'vitest'
import { FieldCompilationNotesPdf } from '@/components/pdf/fieldCompilation/page'
import { buildSensorDeploymentRows } from '@/utils/SensorDeploymentRows'
import { buildWeaverQrDataUrl } from '@/components/pdf/chemistry/wellQrCode'
import { makeContact, makeObservations, makeSensors, makeWell } from '@/test/fixtures/fieldCompilationPdfSample'

it('renders both pages and page-1-only to /Users/robbalch/workspace/jobs/pdf-parity-20261114/', async () => {
  const OUT = '/Users/robbalch/workspace/jobs/pdf-parity-20261114'
  mkdirSync(OUT, { recursive: true })
  const qrDataUrl = await buildWeaverQrDataUrl(makeWell().name as string)

  // ── 2-page PDF (firstPageOnly=false) → field-compilation-2page.pdf ──
  const buf2 = (await renderToBuffer(
    createElement(FieldCompilationNotesPdf, {
      well: makeWell(),
      contacts: [makeContact()],
      assets: [],
      observations: makeObservations(),
      sensorDeployments: buildSensorDeploymentRows(makeSensors() as any, [
        { id: 11, name: 'HOBO-01', model: 'U20-001-04', sensor_type: 'pressure transducer', notes: 'Downloaded 2026-05-20', thing_id: 1 },
        { id: 12, name: 'Unattached spare', model: 'U20-001-04', sensor_type: 'pressure transducer', thing_id: 1 },
      ] as any),
      hydrographImage: null,
      sampleMethodsBySampleId: {},
      includeConfidentialContacts: false,
      density: 'comfortable',
      firstPageOnly: false,
      showPhotos: true,
      qrDataUrl,
    }) as any
  )) as Buffer

  writeFileSync(join(OUT, 'field-compilation-2page.pdf'), buf2)
  let text = buf2.toString('latin1')
  let pages = (text.match(/\/Type\s*\/Page(?![s])/g) || []).length
  console.log(`FIELD-COMPILATION-2PAGE pages=${pages} byteSize=${buf2.length}`)

  // ── Page-1-only PDF (firstPageOnly=true) → page1.pdf ──
  const buf1 = (await renderToBuffer(
    createElement(FieldCompilationNotesPdf, {
      well: makeWell(),
      contacts: [makeContact()],
      assets: [],
      observations: makeObservations(),
      sensorDeployments: buildSensorDeploymentRows(makeSensors() as any, [
        { id: 11, name: 'HOBO-01', model: 'U20-001-04', sensor_type: 'pressure transducer', notes: 'Downloaded 2026-05-20', thing_id: 1 },
        { id: 12, name: 'Unattached spare', model: 'U20-001-04', sensor_type: 'pressure transducer', thing_id: 1 },
      ] as any),
      hydrographImage: null,
      sampleMethodsBySampleId: {},
      includeConfidentialContacts: false,
      density: 'comfortable',
      firstPageOnly: true,
      showPhotos: true,
      qrDataUrl,
    }) as any
  )) as Buffer

  writeFileSync(join(OUT, 'page1.pdf'), buf1)
  text = buf1.toString('latin1')
  pages = (text.match(/\/Type\s*\/Page(?![s])/g) || []).length
  console.log(`PAGE1 pages=${pages} byteSize=${buf1.length}`)
})
