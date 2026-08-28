import { describe, expect, it } from 'vitest'
import {
  describeConsentingContact,
  type PublicationConsent,
  sortConsent,
  toCreateConsentInput,
  validateConsentForm,
  zPublicationConsent,
} from '@/utils/accessConsent'

const consent = (
  overrides: Partial<PublicationConsent> = {}
): PublicationConsent =>
  zPublicationConsent.parse({
    id: 1,
    thing_id: 42,
    destination_id: 3,
    data_type: 'water level',
    contact_id: 9,
    recorded_by: 'admin@example.org',
    notes: null,
    starts_at: '2026-01-01',
    ends_at: null,
    revoked_at: null,
    revoked_by: null,
    ...overrides,
  })

const today = new Date('2026-06-15T12:00:00Z')

describe('validateConsentForm', () => {
  const form = {
    thing_id: '42',
    destination_slug: 'ngwmn',
    contact_id: '',
    starts_at: '2026-06-01',
    ends_at: '',
  }

  it('accepts a consent with no contact, which the API allows', () => {
    expect(validateConsentForm(form)).toEqual({})
  })

  it('requires a numeric thing id', () => {
    expect(validateConsentForm({ ...form, thing_id: '' })).toHaveProperty(
      'thing_id'
    )
    expect(validateConsentForm({ ...form, thing_id: 'abc' })).toHaveProperty(
      'thing_id'
    )
  })

  it('requires a destination', () => {
    expect(
      validateConsentForm({ ...form, destination_slug: '' })
    ).toHaveProperty('destination_slug')
  })

  it('rejects a non-numeric contact id but allows a blank one', () => {
    expect(validateConsentForm({ ...form, contact_id: 'abc' })).toHaveProperty(
      'contact_id'
    )
    expect(validateConsentForm({ ...form, contact_id: '  ' })).toEqual({})
  })

  it('rejects an end date before the start date', () => {
    expect(
      validateConsentForm({ ...form, ends_at: '2026-05-01' })
    ).toHaveProperty('ends_at')
  })
})

describe('toCreateConsentInput', () => {
  const form = {
    thing_id: '42',
    destination_slug: 'ngwmn',
    data_type: 'water chemistry',
    contact_id: '  ',
    starts_at: '2026-06-01',
    ends_at: '',
    notes: '  agreed by phone  ',
  }

  it('sends a blank contact as null, not as a missing field', () => {
    expect(toCreateConsentInput(form)).toEqual({
      thing_id: 42,
      destination_slug: 'ngwmn',
      data_type: 'water chemistry',
      starts_at: '2026-06-01',
      ends_at: null,
      contact_id: null,
      notes: 'agreed by phone',
    })
  })

  it('sends a supplied contact as a number', () => {
    expect(toCreateConsentInput({ ...form, contact_id: '9' }).contact_id).toBe(
      9
    )
  })
})

describe('describeConsentingContact', () => {
  it('names Bureau ownership rather than showing a gap', () => {
    expect(describeConsentingContact(consent({ contact_id: null }))).toBe(
      'Bureau-owned'
    )
    expect(describeConsentingContact(consent({ contact_id: 9 }))).toBe('#9')
  })
})

describe('sortConsent', () => {
  it('orders live consent ahead of withdrawn', () => {
    const rows = sortConsent(
      [
        consent({ id: 1, revoked_at: '2026-03-01T00:00:00Z' }),
        consent({ id: 2 }),
      ],
      today
    )

    expect(rows.map((row) => row.id)).toEqual([2, 1])
  })
})
