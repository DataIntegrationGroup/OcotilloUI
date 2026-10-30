/**
 * Local render harness (not a gate). Writes a PDF of the field-compilation
 * template to /tmp/bdms1244 so it can be rasterised with pdftoppm and
 * inspected visually.
 *
 * Run: npx vitest run src/test/tools/renderFieldCompilationPdf.test.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { describe, expect, it } from 'vitest'
import { FieldCompilationNotesPdf } from '@/components/pdf/FieldCompilationNotesPdf'
import { buildSensorDeploymentRows } from '@/utils/SensorDeploymentRows'
import { makeContact, makeObservations, makeSensors, makeWell } from '@/test/fixtures/fieldCompilationPdfSample'

const OUT_DIR = '/tmp/bdms1244'

describe('render harness', () => {
  it('writes the field-compilation PDF for visual inspection', async () => {
    const buffer = await renderToBuffer(
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
        sample: { id: 1, sample_type: 'manual' },
        sampleMethodsBySampleId: {},
        includeConfidentialContacts: false,
      } as any) as any
    )

    mkdirSync(OUT_DIR, { recursive: true })
    writeFileSync(`${OUT_DIR}/W-01-base.pdf`, buffer)
    expect(buffer.length).toBeGreaterThan(10_000)
  }, 60_000)
})
