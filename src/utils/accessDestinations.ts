import { z } from 'zod'

/**
 * Destinations: the places published data is offered to (ADR5).
 *
 * Hand-written zod for the same reason as `accessGrants.ts` — the committed
 * `openapi-auth.json` snapshot predates the `/access` routes.
 *
 * `destination_kind` is lexicon-backed on the API, so it parses as a plain
 * string; the values below are pinned only to populate the form.
 */

export const DESTINATION_KINDS = [
  'public web',
  'harvester',
  'partner agency',
] as const

export const zDestination = z.looseObject({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  destination_kind: z.string(),
  description: z.string().nullable(),
  active: z.boolean(),
})

export const zDestinationList = z.array(zDestination)

export type Destination = z.infer<typeof zDestination>

export type CreateDestinationInput = {
  slug: string
  name: string
  destination_kind: string
  description?: string | null
}

/**
 * One thing as a destination sees it. `properties` and `location` arrive
 * already projected through the per-audience allowlist — a field nobody
 * approved for this audience is absent rather than null — so the console
 * shows what is there and never fills a gap in.
 */
export const zPublishedThing = z.looseObject({
  thing_id: z.number(),
  data_types: z.array(z.string()),
  properties: z.record(z.string(), z.unknown()).default({}),
  location: z.record(z.string(), z.unknown()).default({}),
})

export const zPublishedThingList = z.array(zPublishedThing)

export type PublishedThing = z.infer<typeof zPublishedThing>

export type DestinationFormErrors = Partial<Record<'slug' | 'name', string>>

/** The API caps slug at 50 and name at 255, and answers 409 on a taken slug. */
export const SLUG_MAX_LENGTH = 50
export const NAME_MAX_LENGTH = 255

export const validateDestinationForm = (form: {
  slug: string
  name: string
}): DestinationFormErrors => {
  const errors: DestinationFormErrors = {}
  const slug = form.slug.trim()

  if (!slug) {
    errors.slug = 'A slug is required.'
  } else if (slug.length > SLUG_MAX_LENGTH) {
    errors.slug = `Slug must be ${SLUG_MAX_LENGTH} characters or fewer.`
  } else if (!/^[a-z0-9][a-z0-9_-]*$/.test(slug)) {
    // The slug goes in a URL path (`/access/destination/{slug}/thing`), so it
    // is checked here rather than discovered as a 404 later.
    errors.slug =
      'Slug may use lower-case letters, digits, hyphens, and underscores.'
  }

  if (!form.name.trim()) {
    errors.name = 'A name is required.'
  } else if (form.name.trim().length > NAME_MAX_LENGTH) {
    errors.name = `Name must be ${NAME_MAX_LENGTH} characters or fewer.`
  }

  return errors
}

export const toCreateDestinationInput = (form: {
  slug: string
  name: string
  destination_kind: string
  description: string
}): CreateDestinationInput => ({
  slug: form.slug.trim(),
  name: form.name.trim(),
  destination_kind: form.destination_kind,
  description: form.description.trim() || null,
})

/** Active first, then by slug — a retired destination is history, not a choice. */
export const sortDestinations = (destinations: Destination[]): Destination[] =>
  [...destinations].sort(
    (a, b) =>
      Number(b.active) - Number(a.active) || a.slug.localeCompare(b.slug)
  )

export const destinationLabel = (destination: Destination): string =>
  `${destination.name} (${destination.slug})`

/**
 * Consent rows carry `destination_id`, not a slug, so the consent tab has to
 * resolve names through the destination list it already loads.
 */
export const indexDestinationsById = (
  destinations: Destination[] | undefined
): Map<number, Destination> =>
  new Map((destinations ?? []).map((row) => [row.id, row]))
