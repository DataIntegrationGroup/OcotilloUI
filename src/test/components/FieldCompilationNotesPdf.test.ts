import { pdf } from '@react-pdf/renderer'
import { inflate } from 'pako'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import {
  FieldCompilationNotesPdf,
  scaleForDensity,
} from '@/components/pdf/FieldCompilationNotesPdf'
import { formatContactPhones } from '@/components/pdf/fieldCompilationPhoneFormatter'
import type { IContact, IWell } from '@/interfaces/ocotillo'

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
        contacts: [],
        assets: [],
        observations: [],
        sensorDeployments: [],
        hydrographImage: null,
      }) as any
    ).toBlob()

    const { pageCount, pages } = await extractPdfText(pdfBlob)

    expect(pageCount).toBe(4)

    expect(pages[0]).toContain('Field Compilation Notes')
    expect(pages[1]).toContain('General Field Notes: Well-1')
    expect(pages[2]).toContain('Hydrograph unavailable for this well')
    expect(pages[3]).toContain('This page is intentionally left blank')
  })
})

describe('site notes field (lane 32)', () => {
  it('renders "-" when no site notes are present', async () => {
    const well = makeWell() // site_notes: []
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

    const { text } = await extractPdfText(pdfBlob)
    // The inline "Site Notes:" label must appear
    expect(text).toContain('Site Notes:')
    // And because there are no notes, it should show "-"
    expect(text).toContain('-')
  })

  it('renders note content when site_notes are provided', async () => {
    const well = makeWell()
    ;(well as any).site_notes = [
      {
        id: 1,
        note_type: 'Site Notes',
        content: 'Dogs on property. Call ahead.',
        created_at: '2026-04-02',
        release_status: 'public',
        target_id: 1,
        target_table: 'thing',
      },
    ]

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

    const { text } = await extractPdfText(pdfBlob)
    expect(text).toContain('Site Notes:')
    expect(text).toContain('Dogs on property. Call ahead.')
  })

  it('falls back to well.notes when site_notes is absent', async () => {
    const well = makeWell()
    ;(well as any).site_notes = []
    ;(well as any).notes = [
      {
        id: 2,
        note_type: 'Other',
        content: 'Fallback note content.',
        created_at: '2026-03-01',
        release_status: 'public',
        target_id: 1,
        target_table: 'thing',
      },
    ]

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

    const { text } = await extractPdfText(pdfBlob)
    expect(text).toContain('Site Notes:')
    expect(text).toContain('Fallback note content.')
  })

  it('shows "-" when both site_notes and notes are empty', async () => {
    const well = makeWell()
    ;(well as any).site_notes = []
    ;(well as any).notes = []

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

    const { text } = await extractPdfText(pdfBlob)
    expect(text).toContain('Site Notes:')
    expect(text).toContain('-')
  })
})

describe('scaleForDensity', () => {
  it('orders compact < standard < comfortable and defaults to standard', () => {
    expect(scaleForDensity(20, 16, 12, 'compact')).toBe(12)
    expect(scaleForDensity(20, 16, 12, 'standard')).toBe(16)
    expect(scaleForDensity(20, 16, 12, 'comfortable')).toBe(20)
    expect(scaleForDensity(20, 16, 12)).toBe(16)
  })
})
