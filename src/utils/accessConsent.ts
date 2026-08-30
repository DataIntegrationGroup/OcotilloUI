import { z } from 'zod'
import { compareByLifecycle, validateDateWindow } from '@/utils/accessLifecycle'

/**
 * Publication consent: the record that an owner agreed to publish one data
 * type to one destination, for a period (ADR5).
 *
 * Hand-written zod, like `accessGrants.ts` and `accessDestinations.ts`.
 */

export const zPublicationConsent = z.looseObject({
  id: z.number(),
  thing_id: z.number(),
  destination_id: z.number(),
  data_type: z.string(),
  contact_id: z.number().nullable(),
  recorded_by: z.string(),
  notes: z.string().nullable(),
  starts_at: z.string(),
  ends_at: z.string().nullable(),
  revoked_at: z.string().nullable(),
  revoked_by: z.string().nullable(),
})

export const zPublicationConsentList = z.array(zPublicationConsent)

export type PublicationConsent = z.infer<typeof zPublicationConsent>

export type CreateConsentInput = {
  thing_id: number
  destination_slug: string
  data_type: string
  starts_at: string
  ends_at?: string | null
  contact_id?: number | null
  notes?: string | null
}

export type ConsentFormErrors = Partial<
  Record<'thing_id' | 'destination_slug' | 'contact_id' | 'ends_at', string>
>

const isWholeNumber = (value: string) => /^\d+$/.test(value.trim())

/**
 * `contact_id` is deliberately optional on the API: it is null when the
 * Bureau owns the well, because the decision was institutional and inventing
 * a consenting contact would be a lie. The form treats blank as that null
 * rather than as a missing field.
 */
export const validateConsentForm = (form: {
  thing_id: string
  destination_slug: string
  contact_id: string
  starts_at: string
  ends_at: string
}): ConsentFormErrors => {
  const errors: ConsentFormErrors = {}

  if (!form.thing_id.trim()) {
    errors.thing_id = 'A thing id is required.'
  } else if (!isWholeNumber(form.thing_id)) {
    errors.thing_id = 'Thing id must be a whole number.'
  }

  if (!form.destination_slug) {
    errors.destination_slug = 'A destination is required.'
  }

  if (form.contact_id.trim() && !isWholeNumber(form.contact_id)) {
    errors.contact_id = 'Contact id must be a whole number.'
  }

  return { ...errors, ...validateDateWindow(form) }
}

export const toCreateConsentInput = (form: {
  thing_id: string
  destination_slug: string
  data_type: string
  contact_id: string
  starts_at: string
  ends_at: string
  notes: string
}): CreateConsentInput => ({
  thing_id: Number(form.thing_id),
  destination_slug: form.destination_slug,
  data_type: form.data_type,
  starts_at: form.starts_at,
  ends_at: form.ends_at || null,
  contact_id: form.contact_id.trim() ? Number(form.contact_id) : null,
  notes: form.notes.trim() || null,
})

export const sortConsent = (
  rows: PublicationConsent[],
  today: Date
): PublicationConsent[] =>
  [...rows].sort((a, b) => compareByLifecycle(a, b, today) || b.id - a.id)

/** Blank rather than "unknown": the Bureau owning the well is not a gap. */
export const describeConsentingContact = (
  consent: PublicationConsent
): string =>
  consent.contact_id === null ? 'Bureau-owned' : `#${consent.contact_id}`
