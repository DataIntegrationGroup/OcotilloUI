/**
 * Client model for personal API keys (`/api_key` on the Ocotillo API).
 *
 * Hand-written, like `accessGrants.ts`: the committed `openapi-auth.json`
 * snapshot predates the route, so `src/generated` cannot describe it. The
 * shapes mirror `schemas/api_key.py`; refresh the spec and regenerate once
 * `/api_key` is in it.
 *
 * A key authorizes `/ogcapi-internal` and nothing else, which is why the card
 * is gated on the group that mount is gated on.
 */

import { z } from 'zod'

export const zApiKey = z.looseObject({
  id: z.number(),
  name: z.string(),
  /** The leading characters, which is all the server returns after creation. */
  token_preview: z.string(),
  scope: z.string(),
  created_at: z.string(),
  expires_at: z.string(),
  last_used_at: z.string().nullable().default(null),
  revoked_at: z.string().nullable().default(null),
})

export const zApiKeyList = z.array(zApiKey)

/**
 * The create response, and the only one that ever carries the token. Nothing
 * re-reads it: only the digest is stored, so a client that loses this response
 * has to issue another key.
 */
export const zNewApiKey = zApiKey.extend({ token: z.string() })

export type ApiKey = z.infer<typeof zApiKey>
export type NewApiKey = z.infer<typeof zNewApiKey>

/** What a key is worth at a glance: usable, nearly stale, or finished. */
export type ApiKeyStatus = 'active' | 'expiring' | 'expired' | 'revoked'

/**
 * How early the page starts warning. Long enough that someone who only opens
 * settings occasionally still sees the warning before the key stops working.
 * The lifetime itself is the API's to decide — it clamps what it is asked for.
 */
export const API_KEY_EXPIRY_WARNING_DAYS = 14

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Whole days left, rounded up, so a key with any part of a day left still
 * reads as "1 day" rather than "0".
 */
export const daysUntilExpiry = (key: ApiKey, now: Date): number =>
  Math.ceil((new Date(key.expires_at).getTime() - now.getTime()) / MS_PER_DAY)

export const apiKeyStatus = (key: ApiKey, now: Date): ApiKeyStatus => {
  // Revocation is deliberate and outranks expiry, which merely happens.
  if (key.revoked_at) return 'revoked'

  const remaining = daysUntilExpiry(key, now)
  if (remaining <= 0) return 'expired'
  if (remaining <= API_KEY_EXPIRY_WARNING_DAYS) return 'expiring'
  return 'active'
}

/** An expired key is as dead as a revoked one — neither can be used again. */
export const isApiKeyActive = (key: ApiKey, now: Date): boolean => {
  const status = apiKeyStatus(key, now)
  return status === 'active' || status === 'expiring'
}

/**
 * Active keys first, newest first within each group.
 *
 * The route already returns this order. Sorting again costs nothing and keeps
 * the table right when a mutation puts a fresh row in the cache before the
 * refetch lands.
 */
export const sortApiKeys = (keys: ApiKey[], now: Date): ApiKey[] =>
  [...keys].sort((a, b) => {
    if (isApiKeyActive(a, now) !== isApiKeyActive(b, now))
      return isApiKeyActive(a, now) ? -1 : 1
    return b.created_at.localeCompare(a.created_at)
  })

export const describeLastUsed = (key: ApiKey): string => {
  if (key.revoked_at) return 'Revoked'
  if (!key.last_used_at) return 'Never used'
  return new Date(key.last_used_at).toLocaleDateString()
}

/**
 * The expiry column. A key close to its end says how long is left, in the
 * units someone would act on; anything further out is just a date.
 */
export const describeExpiry = (key: ApiKey, now: Date): string => {
  const status = apiKeyStatus(key, now)
  if (status === 'expired') return 'Expired'
  if (status === 'expiring') {
    const remaining = daysUntilExpiry(key, now)
    return remaining === 1 ? 'Expires in 1 day' : `Expires in ${remaining} days`
  }
  return new Date(key.expires_at).toLocaleDateString()
}
