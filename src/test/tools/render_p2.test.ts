import { mkdirSync } from 'node:fs'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { it } from 'vitest'
import { createElement } from 'react'
import { renderToBuffer, Document, Text as PdfText } from '@react-pdf/renderer'
import { buildWeaverQrDataUrl } from '@/components/pdf/chemistry/wellQrCode'
import { OwnerSheetPage } from '@/components/pdf/fieldCompilation/pages/OwnerSheetPage'
import { createFieldCompilationStyles } from '@/components/pdf/fieldCompilation/styles'

const makeWell = () =>
  ({
    id: 1,
    name: 'AB-0001',
    thing_type: 'water-well',
    location_id: 1,
    created_at: '2026-01-01T00:00:00Z',
    release_status: 'public',
    alternate_ids: [
      {
        id: 10,
        created_at: '2026-01-01T00:00:00Z',
        release_status: 'public',
        alternate_id: 'SITE-1',
        alternate_organization: 'NMBGMR',
        relation: 'same_as',
      },
    ],
    current_location: {
      properties: {
        utm_coordinates: { easting: 123456, northing: 654321 },
        notes: [],
      },
    },
    site_notes: [
      { id: 2, note_type: 'Site Notes (legacy)', content: 'Dogs on property. Call ahead.', created_at: '2026-04-02' },
    ],
    notes: [],
    measuring_point_description: 'Top of casing',
    measuring_point_height: 1.2,
    measuring_point_height_unit: 'ft',
    well_depth: 480,
    well_depth_unit: 'ft',
  }) as any

const makeObservations = () => [
  {
    id: 1, observation_type: 'groundwater-level', observation_datetime: '2026-03-01T10:15:00Z',
    created_at: new Date('2026-03-01'), release_status: 'public', sample_id: null, sensor_id: null,
    observed_property: 'depth-to-water', value: 112.4, unit: 'ft', depth_to_water_bgs: 112.4,
    measuring_point_height: 1.2, level_status: 'stable', groundwater_level_reason: null, nma_data_quality: null,
  },
  {
    id: 2, observation_type: 'groundwater-level', observation_datetime: '2026-06-01T09:40:00Z',
    created_at: new Date('2026-06-01'), release_status: 'public', sample_id: null, sensor_id: null,
    observed_property: 'depth-to-water', value: 118.9, unit: 'ft', depth_to_water_bgs: 118.9,
    measuring_point_height: 1.2, level_status: 'stable', groundwater_level_reason: null, nma_data_quality: null,
  },
] as any[]

it('renders owner sheet (page 2) to /Users/robbalch/workspace/jobs/pdf-parity-20261114/page2.pdf', async () => {
  const OUT = '/Users/robbalch/workspace/jobs/pdf-parity-20261114'
  mkdirSync(OUT, { recursive: true })

  const well = makeWell()
  const qrDataUrl = await buildWeaverQrDataUrl(well.name as string)
  const observations = makeObservations()
  const styles = createFieldCompilationStyles('comfortable')
  const renderPageDate = () => createElement(PdfText, { style: styles.pageDate }, '2026-11-14')

  const buf = (await renderToBuffer(
    createElement(Document, null,
      createElement(OwnerSheetPage, {
        well,
        observations,
        hydrographImage: null,
        styles,
        renderPageDate,
        showDate: true,
        pageNumber: 2,
        totalPages: 2,
        qrDataUrl,
      })
    )
  )) as Buffer

  writeFileSync(join(OUT, 'page2.pdf'), buf)
  const text = buf.toString('latin1')
  const pages = (text.match(/\/Type\s*\/Page(?![s])/g) || []).length
  console.log(`PAGE2 pages=${pages} byteSize=${buf.length}`)
})
