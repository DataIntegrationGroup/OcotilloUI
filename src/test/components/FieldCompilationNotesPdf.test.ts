import { createElement } from 'react'
import { Document, pdf } from '@react-pdf/renderer'
import { describe, expect, it } from 'vitest'
import { inflate } from 'pako'
import { FieldCompilationNotesPdf } from '@/components/pdf/FieldCompilationNotesPdf'
import { buildFieldSheetModel } from '@/components/pdf/fieldCompilation/FieldCompilationNotesPage'
import type { IContact, IWell } from '@/interfaces/ocotillo'
import { formatContactPhones } from '@/components/pdf/fieldCompilationPhoneFormatter'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

const makeContact = (phones: NonNullable<IContact['phones']>): IContact =>
  ({
    id: 1,
    name: 'Test Contact',
    created_at: new Date('2026-01-01T00:00:00Z'),
    release_status: 'public',
    role: 'Primary',
    phones,
  }) as IContact

const makeWell = (): IWell =>
  ({
    id: 1,
    name: 'Well-1',
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
        utm_coordinates: {
          easting: 123456,
          northing: 654321,
        },
        notes: [],
      },
    },
    site_notes: [],
    notes: [],
    measuring_notes: [],
    measuring_point_description: 'Top of casing',
  }) as unknown as IWell

const decodePdfStreams = (pdfText: string) => {
  const streamPattern = /stream\r?\n([\s\S]*?)\r?\nendstream/g
  const decoded: string[] = []

  for (const match of pdfText.matchAll(streamPattern)) {
    const streamContent = match[1]
    const bytes = Uint8Array.from(
      streamContent,
      (char) => char.charCodeAt(0) & 0xff
    )

    try {
      decoded.push(inflate(bytes, { to: 'string' }))
    } catch {
      // Ignore non-deflated streams.
    }
  }

  return decoded.join('\n')
}

const extractPdfText = async (pdfBlob: Blob) => {
  const data = new Uint8Array(await pdfBlob.arrayBuffer())

  const document = await pdfjsLib.getDocument({
    data,
  }).promise

  const pages: string[] = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
    const page = await document.getPage(pageNumber)
    const textContent = await page.getTextContent()

    pages.push(textContent.items.map((item: any) => item.str).join(''))
  }

  return {
    pageCount: document.numPages,
    text: pages.join('\n'),
    pages,
  }
}

describe('formatContactPhones', () => {
  it('formats a single phone number with its type', () => {
    const contact = makeContact([
      {
        id: 1,
        created_at: new Date('2026-01-01T00:00:00Z'),
        release_status: 'public',
        contact_id: 1,
        phone_number: '5053300761',
        phone_type: 'Primary',
      },
    ])

    expect(formatContactPhones(contact)).toBe('Primary: (505) 330-0761')
  })

  it('includes all phone numbers in stored order on separate lines', () => {
    const contact = makeContact([
      {
        id: 1,
        created_at: new Date('2026-01-01T00:00:00Z'),
        release_status: 'public',
        contact_id: 1,
        phone_number: '5053300761',
        phone_type: 'Work',
      },
      {
        id: 2,
        created_at: new Date('2026-01-01T00:00:00Z'),
        release_status: 'public',
        contact_id: 1,
        phone_number: '15755551212',
        phone_type: 'Mobile',
      },
    ])

    expect(formatContactPhones(contact)).toBe(
      'Work: (505) 330-0761\nMobile: +1 (575) 555-1212'
    )
  })

  it('renders unlabeled numbers without a type prefix', () => {
    const contact = makeContact([
      {
        id: 1,
        created_at: new Date('2026-01-01T00:00:00Z'),
        release_status: 'public',
        contact_id: 1,
        phone_number: '5053300761',
        phone_type: '',
      },
    ])

    expect(formatContactPhones(contact)).toBe('(505) 330-0761')
  })

  it('ignores empty numbers and falls back to dash when none remain', () => {
    const contact = makeContact([
      {
        id: 1,
        created_at: new Date('2026-01-01T00:00:00Z'),
        release_status: 'public',
        contact_id: 1,
        phone_number: '   ',
        phone_type: 'Primary',
      },
    ])

    expect(formatContactPhones(contact)).toBe('-')
    expect(formatContactPhones(undefined)).toBe('-')
  })
})

describe('FieldCompilationNotesPdf', () => {
  it('renders all expected pages and content when no hydrograph image is provided', async () => {
    const pdfBlob = await pdf(
      createElement(FieldCompilationNotesPdf, {
        well: makeWell(),
        contacts: [makeContact([])],
        assets: [],
        observations: [],
        sensorDeployments: [],
        hydrographImage: null,
      }) as any
    ).toBlob()

    const { pageCount, pages } = await extractPdfText(pdfBlob)

    // Document is now exactly 2 pages (was 4):
    // Page 1 = Sheet 1 header + left column + right images
    // Page 2 = Sheet 2: Owner Leave-Behind (well info, hydrograph box, recent readings, QR/contact footer)
    expect(pageCount).toBe(2)

    // --- Page 1 (field sheet; labels follow OcotilloMockups/field-notes-mockup.html) ---
    expect(pages[0]).toContain('Field Compilation Notes')
    expect(pages[0]).toMatch(/Printed \d{2}\/\d{2}\/\d{4}/)
    expect(pages[0]).toContain('Well-1')
    expect(pages[0]).toContain('SITE-1')
    // Contacts (Primary / Secondary cards)
    expect(pages[0]).toContain('Test Contact')
    // Ruled blocks + MP description
    expect(pages[0]).toContain('Location Notes')
    expect(pages[0]).toContain('Directions')
    expect(pages[0]).toContain('Top of casing')
    // Last Measurements table header (th text is uppercased by textTransform)
    expect(pages[0]).toContain('DATE')
    expect(pages[0]).toContain('DTW BELOW MP (FT)')
    // No `MP HT (FT)` column: OcotilloMockups 1220a81 dropped it from the Last Measurements
    // grid (Date · DTW Below MP (ft) · Method · Level Status · Staff · Site Notes).
    expect(pages[0]).toContain('METHOD')
    expect(pages[0]).toContain('LEVEL STATUS')
    expect(pages[0]).toContain('STAFF')
    expect(pages[0]).toContain('SITE NOTES')
    // Installed Equipment (7 columns, Notes is the 7th)
    expect(pages[0]).toContain('EQUIPMENT TYPE')
    expect(pages[0]).toContain('NOTES')
    // New Measurement write-in grid
    expect(pages[0]).toContain('M5')
    expect(pages[0]).toContain('Tape Correction (ft)')
    expect(pages[0]).toContain('DTW BGS (ft)')
    // Empty values print blank, never a dash placeholder
    expect(pages[0]).not.toMatch(/(^|\s)-(\s|$)/)

    // --- Page 2 (Sheet 2: Owner Leave-Behind) ---
    // Header + info rows
    expect(pages[1]).toContain('Your Well: SITE-1')
    expect(pages[1]).toContain('Healy Collaborative Groundwater Monitoring Network')
    expect(pages[1]).toContain('Site Name')
    expect(pages[1]).toContain('Point ID')
    expect(pages[1]).toContain('Well Depth')
    // Hydrograph box — no observations, no image
    expect(pages[1]).toContain('Hydrograph unavailable')
    expect(pages[1]).toContain('Depth to Water')
    // Recent readings table header columns (space before paren drops in react-pdf extraction)
    expect(pages[1]).toContain('DATE')
    expect(pages[1]).toContain('DEPTH TO WATER BELOW GROUND')
    expect(pages[1]).toContain('LEVEL STATUS')
    // Page 2 never abbreviates to DTW
    expect(pages[1]).not.toContain('DTW')
    // Footer: QR placeholder and contact
    expect(pages[1]).toContain('QR')
    expect(pages[1]).toContain('See your well data online')
    expect(pages[1]).toContain('For questions?')
    expect(pages[1]).toContain('New Mexico Bureau of Geology')
  })

  it ('does not render the old retired sheet-2 content (HOLD - CUT / General Field Notes)', async () => {
    const pdfBlob = await pdf(
      createElement(FieldCompilationNotesPdf, {
        well: makeWell(),
        contacts: [],
        assets: [],
        observations: [],
        sensorDeployments: [],
        hydrographImage: null,
      }) as any
    ).toBlob()

    const { pageCount, pages } = await extractPdfText(pdfBlob)
    expect(pageCount).toBe(2)
    expect(pages[1]).not.toContain('HOLD - CUT')
    expect(pages[1]).not.toContain('General Field Notes:')
  })

  it ('shows QR placeholder and "Hydrograph unavailable" when no image or qrDataUrl', async () => {
    const pdfBlob = await pdf(
      createElement(FieldCompilationNotesPdf, {
        well: makeWell(),
        contacts: [],
        assets: [],
        observations: [],
        sensorDeployments: [],
        hydrographImage: null,
      }) as any
    ).toBlob()

    const { pageCount, pages } = await extractPdfText(pdfBlob)
    expect(pageCount).toBe(2)
    expect(pages[1]).toContain('QR')
    expect(pages[1]).toContain('Hydrograph unavailable')
  })

  it ('renders hydrograph image when provided', async () => {
    const pdfBlob = await pdf(
      createElement(FieldCompilationNotesPdf, {
        well: makeWell(),
        contacts: [],
        assets: [],
        observations: [{ observation_datetime: '2024-06-01T00:00:00Z' }] as any[],
        sensorDeployments: [],
        hydrographImage: '/hydro.png',
      }) as any
    ).toBlob()

    const { pageCount, pages } = await extractPdfText(pdfBlob)

    expect(pageCount).toBe(2)
    // Hydrograph heading with year range appears on page 2
    expect(pages[1]).toContain('Depth to Water')
  })

  it('renders hydrograph image when provided', async () => {
    const pdfBlob = await pdf(
      createElement(FieldCompilationNotesPdf, {
        well: makeWell(),
        contacts: [],
        assets: [],
        observations: [{ observation_datetime: '2024-06-01T00:00:00Z' }] as any[],
        sensorDeployments: [],
        hydrographImage: '/hydro.png',
      }) as any
    ).toBlob()

    const { pageCount, pages } = await extractPdfText(pdfBlob)

    expect(pageCount).toBe(2)
    // Depth to Water heading with year range appears on page 2
    expect(pages[1]).toContain('Depth to Water')
  })

  it('renders empty states when no assets / observations / sensor data', async () => {
    const pdfBlob = await pdf(
      createElement(FieldCompilationNotesPdf, {
        well: makeWell(),
        contacts: [],
        assets: [],
        observations: [],
        sensorDeployments: [],
        hydrographImage: null,
      }) as any
    ).toBlob()

    const { pageCount, pages } = await extractPdfText(pdfBlob)

    expect(pageCount).toBe(2)
    // No images: no frames and no stack caption are drawn
    expect(pages[0]).not.toContain('Top 3 photos shown')
  })

  it('renders with confidential contacts excluded', async () => {
    const pdfBlob = await pdf(
      createElement(FieldCompilationNotesPdf, {
        well: makeWell(),
        contacts: [
          { ...makeContact([]), release_status: 'confidential' } as any,
        ],
        assets: [],
        observations: [],
        sensorDeployments: [],
        hydrographImage: null,
        includeConfidentialContacts: false,
      }) as any
    ).toBlob()

    const { pageCount } = await extractPdfText(pdfBlob)

    expect(pageCount).toBe(2)
  })

  it('renders with empty fields when well has no data', async () => {
    const pdfBlob = await pdf(
      createElement(FieldCompilationNotesPdf, {
        well: {
          ...makeWell(),
          alternate_ids: [],
          current_location: { properties: {} },
          measuring_notes: [],
          measuring_point_description: '',
          site_notes: [],
          notes: [],
        } as any,
        contacts: [],
        assets: [],
        observations: [],
        sensorDeployments: [],
        hydrographImage: null,
      }) as any
    ).toBlob()

    const { pageCount } = await extractPdfText(pdfBlob)

    expect(pageCount).toBe(2)
  })

  it('standalone={false} embeds only the field sheet (owner page stays behind the flag)', async () => {
    const pdfBlob = await pdf(
      createElement(
        Document,
        null,
        createElement(FieldCompilationNotesPdf, {
          well: makeWell(),
          contacts: [],
          assets: [],
          observations: [],
          sensorDeployments: [],
          hydrographImage: null,
          standalone: false,
        }) as any
      ) as any
    ).toBlob()

    const { pageCount, pages } = await extractPdfText(pdfBlob)
    expect(pageCount).toBe(1)
    expect(pages[0]).toContain('Field Compilation Notes')
    expect(pages[0]).not.toContain('Your Well')
  })

  it('includeOwnerPage gates page 2 on the standalone document (single-well preview)', async () => {
    const render = async (includeOwnerPage: boolean) =>
      extractPdfText(
        await pdf(
          createElement(FieldCompilationNotesPdf, {
            well: makeWell(),
            contacts: [],
            assets: [],
            observations: [],
            sensorDeployments: [],
            hydrographImage: null,
            includeOwnerPage,
          }) as any
        ).toBlob()
      )

    const off = await render(false)
    expect(off.pageCount).toBe(1)
    expect(off.pages[0]).toContain('Field Compilation Notes')
    expect(off.pages[0]).not.toContain('Your Well')

    const on = await render(true)
    expect(on.pageCount).toBe(2)
    expect(on.pages[1]).toContain('Your Well')
  })

  it('includeOwnerPage adds the owner page per well when a parent document opts in', async () => {
    const render = async (includeOwnerPage: boolean) =>
      extractPdfText(
        await pdf(
          createElement(
            Document,
            null,
            ...[1, 2].map((id) =>
              createElement(FieldCompilationNotesPdf, {
                key: id,
                well: { ...makeWell(), id },
                contacts: [],
                assets: [],
                observations: [],
                sensorDeployments: [],
                hydrographImage: null,
                standalone: false,
                includeOwnerPage,
              } as any)
            )
          ) as any
        ).toBlob()
      )

    const off = await render(false)
    expect(off.pageCount).toBe(2)
    expect(off.pages[0]).toContain('Field Compilation Notes')
    expect(off.pages[0]).not.toContain('Your Well')

    const on = await render(true)
    expect(on.pageCount).toBe(4)
    expect(on.pages[1]).toContain('Your Well')
    expect(on.pages[3]).toContain('Your Well')
  })

  describe('real-data wiring (single-well + batch paths)', () => {
    const readings = [
      { observation_datetime: '2026-10-21T17:00:00Z', depth_to_water_bgs: 39.52, measuring_point_height: 2.1, sample_id: 102 },
      { observation_datetime: '2026-04-14T17:00:00Z', depth_to_water_bgs: 39.18, measuring_point_height: 2.1, sample_id: 101 },
    ]

    it('prints Last Measurements · Method / Staff from the sample maps (preview + batch)', async () => {
      const pdfBlob = await pdf(
        createElement(FieldCompilationNotesPdf, {
          well: makeWell(),
          contacts: [],
          assets: [],
          observations: readings as any[],
          sensorDeployments: [],
          hydrographImage: null,
          sampleMethodsBySampleId: { 101: 'Steel tape', 102: 'Electric tape' },
          staffBySampleId: { 101: 'Jordan Tate', 102: 'Ethan Mamer' },
        }) as any
      ).toBlob()
      const { pageCount, pages } = await extractPdfText(pdfBlob)
      expect(pageCount).toBe(2)
      expect(pages[0]).toContain('Electric tape')
      expect(pages[0]).toContain('Steel tape')
      expect(pages[0]).toContain('Ethan Mamer')
      expect(pages[0]).toContain('Jordan Tate')
      // page-2 Field staff follows the latest reading's staff
      expect(pages[1]).toContain('Ethan Mamer')
    })

    it('falls back to the well-show row fields when no sample maps are passed', () => {
      const m = buildFieldSheetModel({
        well: makeWell(),
        contacts: [],
        assets: [],
        observations: readings.map((r, i) => ({
          ...r,
          water_level_method: i === 0 ? 'Electric tape' : 'Steel tape',
          water_level_measuring_staff: i === 0 ? 'Ethan Mamer' : 'Jordan Tate',
        })) as any[],
        sensorDeployments: [],
        sampleMethodsBySampleId: {},
        includeConfidentialContacts: true,
      })
      expect(m.lastRows.map((r) => [r.method, r.staff])).toEqual([
        ['Electric tape', 'Ethan Mamer'],
        ['Steel tape', 'Jordan Tate'],
      ])
    })

    it('sample-map values win over the row fields; "-" maps print blank', () => {
      const m = buildFieldSheetModel({
        well: makeWell(),
        contacts: [],
        assets: [],
        observations: [{ ...readings[0], water_level_method: 'Row method' }] as any[],
        sensorDeployments: [],
        sampleMethodsBySampleId: { 102: 'Electric tape' },
        staffBySampleId: { 102: '-' },
        includeConfidentialContacts: true,
      })
      expect(m.lastRows[0].method).toBe('Electric tape')
      expect(m.lastRows[0].staff).toBe('')
    })

    it('OSE # prefers the NMOSE OSEPOD id (well-show precedence)', async () => {
      const well = makeWell()
      well.alternate_ids = [
        ...(well.alternate_ids ?? []),
        { id: 11, alternate_id: 'RA-00001', alternate_organization: 'NMOSE', relation: 'same_as' },
        { id: 12, alternate_id: 'G-04218-POD1', alternate_organization: 'NMOSE', relation: 'OSEPOD' },
      ] as any
      const pdfBlob = await pdf(
        createElement(FieldCompilationNotesPdf, {
          well,
          contacts: [],
          assets: [],
          observations: [],
          sensorDeployments: [],
          hydrographImage: null,
        }) as any
      ).toBlob()
      const { pages } = await extractPdfText(pdfBlob)
      expect(pages[1]).toContain('G-04218-POD1')
      expect(pages[1]).not.toContain('RA-00001')
    })
  })
})
