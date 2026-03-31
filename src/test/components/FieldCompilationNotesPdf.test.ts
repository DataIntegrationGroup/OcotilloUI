import { createElement } from 'react'
import { pdf } from '@react-pdf/renderer'
import { describe, expect, it } from 'vitest'
import { inflate } from 'pako'
import { FieldCompilationNotesPdf } from '@/components/pdf/FieldCompilationNotesPdf'
import type { IContact, IWell } from '@/interfaces/ocotillo'
import { formatContactPhones } from '@/components/pdf/fieldCompilationPhoneFormatter'

const makeContact = (
  phones: NonNullable<IContact['phones']>
): IContact =>
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
  }) as IWell

const decodePdfStreams = (pdfText: string) => {
  const streamPattern = /stream\r?\n([\s\S]*?)\r?\nendstream/g
  const decoded: string[] = []

  for (const match of pdfText.matchAll(streamPattern)) {
    const streamContent = match[1]
    const bytes = Uint8Array.from(streamContent, (char) => char.charCodeAt(0) & 0xff)

    try {
      decoded.push(inflate(bytes, { to: 'string' }))
    } catch {
      // Ignore non-deflated streams.
    }
  }

  return decoded.join('\n')
}

const decodePdfHexStrings = (decodedPdfText: string) => {
  const fragments: string[] = []

  for (const match of decodedPdfText.matchAll(/<([0-9A-Fa-f]+)>/g)) {
    const hex = match[1]
    fragments.push(Buffer.from(hex, 'hex').toString('latin1'))
  }

  return fragments.join('')
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
  it('appends a final blank page with the requested text', async () => {
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

    const pdfText = Buffer.from(await pdfBlob.arrayBuffer()).toString('latin1')

    const pageMatches = pdfText.match(/\/Type \/Page\b/g) ?? []
    const decodedText = decodePdfStreams(pdfText)
    const decodedVisibleText = decodePdfHexStrings(decodedText)

    expect(pageMatches).toHaveLength(4)
    expect(decodedVisibleText).toContain(
      'Hydrograph and Manual Measurements: Well-1'
    )
    expect(decodedVisibleText).toContain('This page is intentionally left blank')
  })
})
