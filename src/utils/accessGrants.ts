import { z } from 'zod'
import {
  type AccessStatus,
  accessStatusOf,
  compareByLifecycle,
  validateDateWindow,
} from '@/utils/accessLifecycle'

/**
 * Client model for ADR5 permission grants (`/access/*` on the Ocotillo API).
 *
 * Hand-written, like `gisArtifacts.ts`: the committed `openapi-auth.json`
 * snapshot predates the access-control routes, so `src/generated` cannot
 * describe them. The shapes below mirror `schemas/access.py` on OcotilloAPI
 * exactly. Once `/access` is in the deployed spec, refresh it, regenerate, and
 * replace these with the generated zod schemas.
 *
 * The four enums are built from the API's lexicon at runtime, so their values
 * are data rather than code on that side. They are pinned here because the
 * console has to render a fixed set of choices; a value the API adds later
 * parses fine (see `zGrantEnum`) and simply shows as itself.
 */

/**
 * Lexicon-backed enums arrive as plain strings. Parsing them as a bare string
 * rather than a zod enum is deliberate: a term added to the API's lexicon must
 * not make an entire grant list fail to load.
 */
const zGrantEnum = z.string()

export const PRINCIPAL_TYPES = ['user', 'role', 'api key'] as const
export const CAPABILITIES = [
  'read',
  'enter',
  'correct',
  'administer',
  'view',
] as const

/**
 * `view` is the screen verb and the rest are data verbs; the API keeps them
 * apart and rejects either used over the wrong subject, so the form offers
 * only the ones that can succeed.
 */
export const SURFACE_CAPABILITY = 'view'

export const DATA_CAPABILITIES = CAPABILITIES.filter(
  (capability) => capability !== SURFACE_CAPABILITY
)
export const GRANT_SCOPE_TYPES = ['global', 'group', 'thing'] as const
export const ACCESS_DATA_TYPES = [
  'water chemistry',
  'water level',
  'well construction',
  'site metadata',
] as const

/**
 * Screens a grant may open, mirroring the API's `ui_surface` lexicon category.
 * These are resource ids, the same strings `accessControl` policies key on,
 * because that is what the nav item asks `/access/decision` about.
 */
export const UI_SURFACES = [
  'ocotillo.map',
  'ocotillo.thing-well',
  'ocotillo.thing-well-projects',
  'ocotillo.thing-well-batch-export',
  'ocotillo.contact',
  'ocotillo.collections',
  'ocotillo.asset-unassociated',
  'ocotillo.location',
  'ocotillo.lexicon',
  'ocotillo.hydrograph-correction',
  'ocotillo.access-grants',
] as const

/**
 * What a grant is about: data the principal may reach, or a screen it may
 * open. The API stores exactly one of the two and rejects both or neither, so
 * the form picks between them rather than offering both at once.
 */
export const GRANT_SUBJECTS = ['data_type', 'ui_surface'] as const

export type PrincipalType = (typeof PRINCIPAL_TYPES)[number]
export type Capability = (typeof CAPABILITIES)[number]
export type GrantScopeType = (typeof GRANT_SCOPE_TYPES)[number]
export type AccessDataType = (typeof ACCESS_DATA_TYPES)[number]
export type UiSurface = (typeof UI_SURFACES)[number]
export type GrantSubject = (typeof GRANT_SUBJECTS)[number]

export const zPermissionGrant = z.looseObject({
  id: z.number(),
  principal_type: zGrantEnum,
  principal_id: z.string(),
  capability: zGrantEnum,
  scope_type: zGrantEnum,
  scope_id: z.number().nullable(),
  // Exactly one of these is set on any row the API returns.
  data_type: zGrantEnum.nullable(),
  ui_surface: zGrantEnum.nullable().default(null),
  starts_at: z.string(),
  ends_at: z.string().nullable(),
  granted_by: z.string(),
  reason: z.string().nullable(),
  revoked_at: z.string().nullable(),
  revoked_by: z.string().nullable(),
})

export const zPermissionGrantList = z.array(zPermissionGrant)

/**
 * `GET /access/grant` answers with a page, not a list: `{items, total, page,
 * size, pages}`. Everything but `items` is read loosely — the console needs
 * the total to know whether it is looking at everything.
 */
export const zPermissionGrantPage = z.looseObject({
  items: zPermissionGrantList,
  total: z.number().nullable(),
  page: z.number().nullable(),
  size: z.number().nullable(),
})

export type PermissionGrantPage = z.infer<typeof zPermissionGrantPage>

export type PermissionGrant = z.infer<typeof zPermissionGrant>

export type CreateGrantInput = {
  principal_type: string
  principal_id: string
  capability: string
  scope_type: string
  scope_id?: number | null
  data_type?: string | null
  ui_surface?: string | null
  starts_at: string
  ends_at?: string | null
  reason?: string | null
}

/**
 * What a grant is doing right now. The API stores dates and a revocation
 * stamp, not a status, because a grant's meaning depends on the day it is
 * read — so the console derives this rather than caching it.
 */
export type GrantFilters = {
  principalId?: string
  capability?: string
  /**
   * Which kind of grant to show. The API filters on an exact `ui_surface`, not
   * on "any screen", so this one narrows the fetched rows rather than the
   * query — see `grantQueryParams`, which deliberately does not send it.
   */
  subject?: string
  dataType?: string
  scopeType?: string
  includeRevoked?: boolean
}

export type GrantQueryParams = {
  principal_id?: string
  capability?: string
  data_type?: string
  scope_type?: string
  include_revoked: boolean
  size: number
}

/**
 * How many grants the console asks for at once.
 *
 * The route pages at 25 by default and caps at 10000. Sorting by lifecycle and
 * the screen/data filter both run over the whole result here, so asking for one
 * page at a time would sort and filter a slice rather than the set. This asks
 * for more than any principal will have and says so when the answer is short —
 * see `isPartialPage`.
 */
export const GRANT_PAGE_SIZE = 500

/**
 * Only set filters are sent. Every one is optional on the API, and an empty
 * string is not the same question as "any" — it would match grants whose
 * field is literally empty, which is none of them.
 */
export const grantQueryParams = (filters: GrantFilters): GrantQueryParams => {
  const params: GrantQueryParams = {
    include_revoked: filters.includeRevoked ?? false,
    size: GRANT_PAGE_SIZE,
  }

  const principalId = filters.principalId?.trim()
  if (principalId) params.principal_id = principalId
  if (filters.capability) params.capability = filters.capability
  if (filters.dataType) params.data_type = filters.dataType
  if (filters.scopeType) params.scope_type = filters.scopeType

  return params
}

/**
 * Whether a grant would appear under the filters currently applied.
 *
 * Used after a create: the list refetches either way, but a grant written
 * outside the slice on screen would otherwise land nowhere visible, and
 * "I granted it and nothing happened" is the report that follows. Revocation
 * state is not considered — a grant is never born revoked.
 */
export const matchesFilters = (
  grant: PermissionGrant,
  filters: GrantFilters
): boolean => {
  const principalId = filters.principalId?.trim()

  if (principalId && grant.principal_id !== principalId) return false
  if (filters.capability && grant.capability !== filters.capability)
    return false
  if (filters.subject === 'ui_surface' && !grant.ui_surface) return false
  if (filters.subject === 'data_type' && !grant.data_type) return false
  if (filters.dataType && grant.data_type !== filters.dataType) return false
  if (filters.scopeType && grant.scope_type !== filters.scopeType) return false

  return true
}

/**
 * Whether the API held back rows the console never saw. Silence here would be
 * a table that looks complete and is not.
 */
export const isPartialPage = (page: PermissionGrantPage | undefined): boolean =>
  page !== undefined && page.total !== null && page.items.length < page.total

/** True when the console is showing the unfiltered admin-wide audit view. */
export const isUnfiltered = (filters: GrantFilters): boolean =>
  !filters.principalId?.trim() &&
  !filters.capability &&
  !filters.subject &&
  !filters.dataType &&
  !filters.scopeType

export type GrantStatus = AccessStatus

export const grantStatusOf = (
  grant: PermissionGrant,
  today: Date
): GrantStatus => accessStatusOf(grant, today)

/**
 * A global grant covers everything and names no scope; a group- or
 * thing-scoped one is meaningless without its id. The API enforces this in
 * `domain/access.py` and answers 422 on `scope_id`; the console checks first
 * so the form can say so before the round trip.
 */
export const scopeIdRequired = (scopeType: string): boolean =>
  scopeType === 'group' || scopeType === 'thing'

/**
 * The scope, as an admin would say it. A group is stored by id but known by
 * name, so a name is used when one is to hand — and the id stands in when it
 * is not, since a row that cannot resolve its group should still say which
 * group it means.
 */
export const describeScope = (
  grant: PermissionGrant,
  groupNames?: Record<number, string>
): string => {
  if (!scopeIdRequired(grant.scope_type)) return grant.scope_type

  if (grant.scope_type === 'group' && grant.scope_id !== null) {
    const name = groupNames?.[grant.scope_id]
    if (name) return `group ${name}`
  }

  return `${grant.scope_type} ${grant.scope_id ?? '?'}`
}

export type GrantFormErrors = Partial<
  Record<
    'principal_id' | 'scope_id' | 'ends_at' | 'ui_surface' | 'capability',
    string
  >
>

/** True for a grant that opens a screen rather than reaching data. */
export const isUiSurfaceGrant = (grant: PermissionGrant): boolean =>
  Boolean(grant.ui_surface)

/**
 * What the grant is about, for the table. A row always has one of the two, but
 * an API that grows a third subject should not render an empty cell.
 */
export const describeSubject = (grant: PermissionGrant): string =>
  grant.data_type ?? grant.ui_surface ?? 'unknown'

/**
 * A screen grant is app-wide: navigation is not scoped to a group or a thing,
 * and the API answers 422 on `scope_type` for anything else. The form forces
 * global rather than letting someone build a grant the API will refuse.
 */
export const scopeTypeFor = (subject: string, scopeType: string): string =>
  subject === 'ui_surface' ? 'global' : scopeType

/**
 * A screen grant carries `view` and nothing else — `read` over a screen is a
 * second spelling of the same permission, and the API answers 422 for it.
 */
export const capabilityFor = (subject: string, capability: string): string =>
  subject === 'ui_surface' ? SURFACE_CAPABILITY : capability

/**
 * Validates what the console can know locally. Everything else — whether the
 * principal exists, whether the scope id resolves — is the API's answer to
 * give, and is surfaced from its 422 rather than guessed at here.
 */
export const validateGrantForm = (form: {
  principal_id: string
  subject: string
  capability: string
  ui_surface: string
  scope_type: string
  scope_id: string
  starts_at: string
  ends_at: string
}): GrantFormErrors => {
  const errors: GrantFormErrors = {}
  const scopeType = scopeTypeFor(form.subject, form.scope_type)

  if (form.subject === 'data_type' && form.capability === SURFACE_CAPABILITY) {
    errors.capability = `'${SURFACE_CAPABILITY}' opens a screen, not a data type.`
  }

  if (!form.principal_id.trim()) {
    errors.principal_id = 'A principal is required.'
  }

  if (form.subject === 'ui_surface' && !form.ui_surface) {
    errors.ui_surface = 'A screen is required for a UI surface grant.'
  }

  if (scopeIdRequired(scopeType)) {
    if (!form.scope_id.trim()) {
      errors.scope_id = `A ${scopeType} id is required for a ${scopeType}-scoped grant.`
    } else if (!/^\d+$/.test(form.scope_id.trim())) {
      errors.scope_id = 'Scope id must be a whole number.'
    }
  }

  return { ...errors, ...validateDateWindow(form) }
}

export const toCreateGrantInput = (form: {
  principal_type: string
  principal_id: string
  capability: string
  scope_type: string
  scope_id: string
  subject: string
  data_type: string
  ui_surface: string
  starts_at: string
  ends_at: string
  reason: string
}): CreateGrantInput => {
  const isSurface = form.subject === 'ui_surface'
  const scopeType = scopeTypeFor(form.subject, form.scope_type)

  return {
    principal_type: form.principal_type,
    principal_id: form.principal_id.trim(),
    capability: capabilityFor(form.subject, form.capability),
    scope_type: scopeType,
    scope_id: scopeIdRequired(scopeType) ? Number(form.scope_id) : null,
    // Exactly one subject reaches the API; sending both is a 422.
    data_type: isSurface ? null : form.data_type,
    ui_surface: isSurface ? form.ui_surface : null,
    starts_at: form.starts_at,
    ends_at: form.ends_at || null,
    reason: form.reason.trim() || null,
  }
}

/**
 * Grants sort by lifecycle first. The list spans principals now, so
 * equal-dated rows group by who holds them rather than landing in insertion
 * order.
 */
export const sortGrants = (
  grants: PermissionGrant[],
  today: Date
): PermissionGrant[] =>
  [...grants].sort(
    (a, b) =>
      compareByLifecycle(a, b, today) ||
      a.principal_id.localeCompare(b.principal_id) ||
      b.id - a.id
  )
