import { mkdirSync, readFileSync } from 'node:fs'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { it } from 'vitest'
import { FieldCompilationNotesPdf } from '@/components/pdf/fieldCompilation/page'
import { buildSensorDeploymentRows } from '@/utils/SensorDeploymentRows'
import { makeContact, makeObservations, makeSensors, makeWell } from '@/test/fixtures/fieldCompilationPdfSample'

const PHOTO_A = {
  id: 1,
  name: 'PHOTO-A',
  label: 'PHOTO-A',
  mime_type: 'image/png',
  signed_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  created_at: '2026-10-01T00:00:00Z',
}

it('renders page 1 only to /Users/robbalch/workspace/jobs/pdf-parity-20261114/page1.pdf', async () => {
  const OUT = '/Users/robbalch/workspace/jobs/pdf-parity-20261114'
  mkdirSync(OUT, { recursive: true })

  const buf = (await renderToBuffer(
    createElement(FieldCompilationNotesPdf, {
      well: makeWell(),
      contacts: [makeContact()],
      assets: [PHOTO_A],
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
    }) as any
  )) as Buffer

  writeFileSync(join(OUT, 'page1.pdf'), buf)
  const text = buf.toString('latin1')
  const pages = (text.match(/\/Type\s*\/Page(?![s])/g) || []).length
  console.log(`PAGE1 pages=${pages} byteSize=${buf.length}`)
})
