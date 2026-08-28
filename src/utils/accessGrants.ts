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
export const CAPABILITIES = ['read', 'enter', 'correct', 'administer'] as const
export const GRANT_SCOPE_TYPES = ['global', 'group', 'thing'] as const
export const ACCESS_DATA_TYPES = [
  'water chemistry',
  'water level',
  'well construction',
  'site metadata',
] as const

export type PrincipalType = (typeof PRINCIPAL_TYPES)[number]
export type Capability = (typeof CAPABILITIES)[number]
export type GrantScopeType = (typeof GRANT_SCOPE_TYPES)[number]
export type AccessDataType = (typeof ACCESS_DATA_TYPES)[number]

export const zPermissionGrant = z.looseObject({
  id: z.number(),
  principal_type: zGrantEnum,
  principal_id: z.string(),
  capability: zGrantEnum,
  scope_type: zGrantEnum,
  scope_id: z.number().nullable(),
  data_type: zGrantEnum,
  starts_at: z.string(),
  ends_at: z.string().nullable(),
  granted_by: z.string(),
  reason: z.string().nullable(),
  revoked_at: z.string().nullable(),
  revoked_by: z.string().nullable(),
})

export const zPermissionGrantList = z.array(zPermissionGrant)

export type PermissionGrant = z.infer<typeof zPermissionGrant>

export type CreateGrantInput = {
  principal_type: string
  principal_id: string
  capability: string
  scope_type: string
  scope_id?: number | null
  data_type: string
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
}

/**
 * Only set filters are sent. Every one is optional on the API, and an empty
 * string is not the same question as "any" — it would match grants whose
 * field is literally empty, which is none of them.
 */
export const grantQueryParams = (filters: GrantFilters): GrantQueryParams => {
  const params: GrantQueryParams = {
    include_revoked: filters.includeRevoked ?? false,
  }

  const principalId = filters.principalId?.trim()
  if (principalId) params.principal_id = principalId
  if (filters.capability) params.capability = filters.capability
  if (filters.dataType) params.data_type = filters.dataType
  if (filters.scopeType) params.scope_type = filters.scopeType

  return params
}

/** True when the console is showing the unfiltered admin-wide audit view. */
export const isUnfiltered = (filters: GrantFilters): boolean =>
  !filters.principalId?.trim() &&
  !filters.capability &&
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

export const describeScope = (grant: PermissionGrant): string => {
  if (!scopeIdRequired(grant.scope_type)) return grant.scope_type
  return `${grant.scope_type} ${grant.scope_id ?? '?'}`
}

export type GrantFormErrors = Partial<
  Record<'principal_id' | 'scope_id' | 'ends_at', string>
>

/**
 * Validates what the console can know locally. Everything else — whether the
 * principal exists, whether the scope id resolves — is the API's answer to
 * give, and is surfaced from its 422 rather than guessed at here.
 */
export const validateGrantForm = (form: {
  principal_id: string
  scope_type: string
  scope_id: string
  starts_at: string
  ends_at: string
}): GrantFormErrors => {
  const errors: GrantFormErrors = {}

  if (!form.principal_id.trim()) {
    errors.principal_id = 'A principal is required.'
  }

  if (scopeIdRequired(form.scope_type)) {
    if (!form.scope_id.trim()) {
      errors.scope_id = `A ${form.scope_type} id is required for a ${form.scope_type}-scoped grant.`
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
  data_type: string
  starts_at: string
  ends_at: string
  reason: string
}): CreateGrantInput => ({
  principal_type: form.principal_type,
  principal_id: form.principal_id.trim(),
  capability: form.capability,
  scope_type: form.scope_type,
  scope_id: scopeIdRequired(form.scope_type) ? Number(form.scope_id) : null,
  data_type: form.data_type,
  starts_at: form.starts_at,
  ends_at: form.ends_at || null,
  reason: form.reason.trim() || null,
})

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
