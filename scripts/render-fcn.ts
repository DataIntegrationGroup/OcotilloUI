/**
 * Render-only harness for the Field Compilation Notes PDF.
 *
 * Imports the shipped document component (src/components/pdf/…) exactly as the
 * vitest suite does and writes a 2-page US-Letter PDF with react-pdf's
 * Node renderer. No application source is touched; this file only consumes it.
 *
 * Run via vite-node so the repo's Vite + tsconfig-paths resolution picks up the
 * `@/` aliases used inside the component tree (no new deps, no build step):
 *
 *   node_modules/.bin/vite-node scripts/render-fcn.ts <out.pdf>
 *   FCN_FIXTURE=empty node_modules/.bin/vite-node scripts/render-fcn.ts <out.pdf>
 *   FCN_FIXTURE=batch node_modules/.bin/vite-node scripts/render-fcn.ts <out.pdf>
 */

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import type { IContact, IWell } from '@/interfaces/ocotillo'
import { FieldCompilationNotesPdf } from '../src/components/pdf/FieldCompilationNotesPdf'
import { OcotilloDocument } from '../src/components/pdf/OcotilloDocument'
import { buildWeaverQrDataUrl } from '../src/components/pdf/chemistry/wellQrCode'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import fs from 'node:fs/promises'

const execAsync = promisify(exec)


// ─── Fixture — the mockup's WL-0217 sample (OcotilloMockups/field-notes-mockup.html)
//     so the render is directly comparable to the approved sheet. Fixture only:
//     none of these values live in the document component.
const GRAY_PHOTO =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7ljmRAAAAEUlEQVR4nGO4dvMeHDHg5AAAVMcenYlCb5IAAAAASUVORK5CYII='

const HYDROGRAPH_PATH = fileURLToPath(
  new URL('./fcn-fixtures/hydrograph.png', import.meta.url)
)

const phone = (id: number, phone_type: string, phone_number: string) => ({
  id,
  created_at: new Date('2026-01-01T00:00:00Z'),
  release_status: 'public',
  contact_id: 1,
  phone_type,
  phone_number,
})

const makeContacts = (): IContact[] => [
  {
    id: 1,
    name: 'Dolores Baca',
    contact_type: 'Primary',
    created_at: new Date('2026-01-01T00:00:00Z'),
    release_status: 'public',
    role: 'Owner',
    phones: [phone(1, 'Primary', '5755550123'), phone(2, 'Mobile', '5755550187')],
    emails: [],
  } as unknown as IContact,
]

const note = (id: number, note_type: string, content: string) => ({
  id,
  note_type,
  content,
  created_at: '2026-01-01T00:00:00Z',
})

const makeWell = (): IWell =>
  ({
    id: 217,
    name: 'WL-0217',
    thing_type: 'water-well',
    location_id: 217,
    created_at: '2018-04-17T00:00:00Z',
    release_status: 'public',
    alternate_ids: [
      {
        id: 10,
        created_at: '2026-01-01T00:00:00Z',
        release_status: 'public',
        alternate_id: 'Mesa Redonda Ranch Well 2',
        alternate_organization: 'NMBGMR',
        relation: 'same_as',
      },
      {
        id: 11,
        created_at: '2026-01-01T00:00:00Z',
        release_status: 'public',
        alternate_id: 'G-04218-POD1',
        alternate_organization: 'OSE',
        relation: 'same_as',
      },
    ],
    current_location: {
      geometry: { type: 'Point', coordinates: [-102.59333, 34.30155, 2117.75] },
      properties: {
        utm_coordinates: { easting: 721486, northing: 3798214 },
        elevation: 6948,
        notes: [
          note(1, 'General', 'Well is inside a fenced enclosure 40 ft west of the stock tank: 6-in steel casing with locking cap, solar panel on the north side. Ranch dogs loose near the house; stay in the truck until someone comes out.'),
          note(2, 'Directions', 'From Quemado, west on US-60 for 6.2 mi, left (south) on CR B-021. Continue 3.8 mi on graded dirt to the cattle guard, then right at the green ranch gate (chained, not locked). Two-track 0.6 mi to the windmill; high clearance after rain.'),
        ],
      },
    },
    site_notes: [],
    notes: [],
    measuring_notes: [],
    measuring_point_description:
      'Top of PVC sounding tube, north side of 6-in steel casing, notched. Previous MP was top of casing (2.45 ft) before the tube was installed 06/09/2022.',
    measuring_point_height: 2.1,
    measuring_point_height_unit: 'ft',
    well_depth: 312,
    well_depth_unit: 'ft',
  }) as unknown as IWell

const makeAssets = () =>
  [
    ['WL0217_1.jpg', 'well casing, MP notch'],
    ['WL0217_2.jpg', 'enclosure from gate'],
    ['WL0217_3.jpg', 'ranch gate on CR B-021'],
  ].map(([name, label], i) => ({
    id: 900 + i,
    name,
    label,
    mime_type: 'image/png',
    signed_url: GRAY_PHOTO,
  }))

// Depth below ground surface, oldest first (the mockup's hydrograph series).
const SERIES: Array<[string, number, string?]> = [
  ['2018-04-17', 37.9], ['2018-10-23', 38.3], ['2019-04-16', 37.6], ['2019-10-22', 38.4],
  ['2020-04-21', 38.1], ['2020-10-20', 38.9], ['2021-04-20', 38.5], ['2021-10-19', 39.0],
  ['2022-04-20', 38.6], ['2022-10-19', 39.4, 'Site was pumped recently'], ['2023-04-18', 38.8],
  ['2023-10-24', 39.3], ['2024-04-16', 38.9], ['2024-10-15', 39.6], ['2025-04-22', 38.94],
  ['2025-10-28', 39.71, 'Site was pumped recently'], ['2026-04-14', 39.18], ['2026-10-21', 39.52],
]

const makeObservations = () =>
  SERIES.map(([date, bgs, status], i) => ({
    id: 5000 + i,
    observation_datetime: `${date}T17:00:00Z`,
    depth_to_water_bgs: bgs,
    measuring_point_height: 2.1,
    level_status: status ?? 'Water level not affected',
    groundwater_level_reason: null,
    // only the two most recent readings carry a sample (method / staff lookups)
    sample_id: i === SERIES.length - 1 ? 102 : i === SERIES.length - 2 ? 101 : undefined,
    // single-well paths: staff on the row (well-show.tsx → water_level_measuring_staff)
    water_level_measuring_staff: i === SERIES.length - 1 ? 'MA' : i === SERIES.length - 2 ? 'JT' : undefined,
  }))

const makeSensorDeployments = () =>
  [
    {
      id: 1,
      sensor_id: 31,
      sensor_name: 'Level TROLL 400',
      sensor_type: 'Pressure Transducer',
      sensor_model: 'Level TROLL 400',
      serial_no: '812447',
      hanging_cable_length: 60,
      recording_interval: 12,
      recording_interval_units: 'hour',
      recording_interval_display: '12 hour',
      datetime_installed: '2022-06-09',
      datetime_removed: null,
      notes: 'Downloaded 10/21/2026; battery 88%',
    },
    {
      id: 2,
      sensor_id: 32,
      sensor_name: 'Barologger 5',
      sensor_type: 'Barometric Logger',
      sensor_model: 'Barologger 5',
      serial_no: '2094117',
      hanging_cable_length: 3,
      recording_interval: 12,
      recording_interval_units: 'hour',
      recording_interval_display: '12 hour',
      datetime_installed: '2022-06-09',
      datetime_removed: null,
      notes: '',
    },
  ]

async function main(): Promise<void> {
  const outPath = process.argv[2] ?? 'fcn-pages-1-2.pdf'

  const hydrograph = await readFile(HYDROGRAPH_PATH)
    .then((buf) => `data:image/png;base64,${buf.toString('base64')}`)
    .catch(() => null)

  // FCN_FIXTURE=empty renders a well with nothing on file (blank-rendering check).
  const sparse = process.env.FCN_FIXTURE === 'empty'

  const doc = createElement(
    FieldCompilationNotesPdf,
    (sparse
      ? {
          well: {
            id: 1,
            name: 'WL-9999',
            alternate_ids: [],
            current_location: { properties: {} },
            site_notes: [],
            notes: [],
            measuring_notes: [],
          },
          contacts: [],
          assets: [],
          observations: [],
          sensorDeployments: [],
          hydrographImage: null,
        }
      : {
          well: makeWell(),
          contacts: makeContacts(),
          assets: makeAssets(),
          observations: makeObservations(),
          sensorDeployments: makeSensorDeployments(),
          hydrographImage: hydrograph,
          sampleMethodsBySampleId: { 101: 'Steel tape', 102: 'Electric tape' },
          qrDataUrl: (await buildWeaverQrDataUrl(makeWell().name)) ?? undefined,
        }) as any
  )

  // FCN_FIXTURE=batch mirrors well-batch-export.tsx: two wells, standalone={false},
  // inside one OcotilloDocument; batch passes staffBySampleId, not row staff.
  const batchDoc = createElement(
    OcotilloDocument,
    { title: 'batch', subject: 'Batch Well Field Data Report' },
    ...[makeWell(), { ...makeWell(), id: 218, name: 'WL-0218' }].map((well) =>
      createElement(FieldCompilationNotesPdf, {
        key: well.id,
        well,
        contacts: makeContacts(),
        assets: makeAssets(),
        observations: makeObservations().map(({ water_level_measuring_staff: _s, ...o }) => o),
        sensorDeployments: makeSensorDeployments(),
        hydrographImage: hydrograph,
        sampleMethodsBySampleId: { 101: 'Steel tape', 102: 'Electric tape' },
        staffBySampleId: { 101: 'JT', 102: 'MA' },
        standalone: false,
        includeConfidentialContacts: true,
      } as any)
    )
  )

  // react-pdf v4 `renderToBuffer` returns a Node Buffer on the Node renderer.
  const buffer = await renderToBuffer(
    (process.env.FCN_FIXTURE === 'batch' ? batchDoc : doc) as any
  )

  await writeFile(outPath, buffer)

  console.log(`Wrote ${buffer.length} bytes -> ${outPath}`)

  // --png: 1:1 page images for visual comparison against the approved mockup.
  if (process.argv.includes('--png')) {
    const base = outPath.replace(/\.pdf$/i, '')
    // -sep "" turns the default `-N` suffix into `N`, so pages land as <out>-p1.png.
    // Clear rasters left by an earlier render of the same base: a stale -p3.png
    // made the printed page count disagree with pdfinfo.
    for (const stale of await fs.readdir(path.dirname(outPath))) {
      if (stale.startsWith(path.basename(base) + '-p') && stale.endsWith('.png')) {
        await fs.unlink(path.join(path.dirname(outPath), stale))
      }
    }
    await execAsync(`pdftoppm -png -r 96 -sep "" "${outPath}" "${base}-p"`)
    const pngs = (await fs.readdir(path.dirname(outPath)))
      .filter((name) => name.startsWith(path.basename(base) + '-p') && name.endsWith('.png'))
      .sort()
    console.log(`Rasterised ${pngs.length} page(s): ${pngs.join(', ')}`)
  }
}

main().catch((err) => {
  console.error('render-fcn: failed to write PDF')
  console.error(err)
  process.exit(1)
})
