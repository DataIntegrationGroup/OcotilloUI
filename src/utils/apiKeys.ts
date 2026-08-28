/**
 * Client-side model for personal API keys.
 *
 * There is no API behind this yet: the settings page renders the full
 * generate / rename / revoke flow against local state so the interaction can
 * be reviewed before the endpoints exist. Nothing here talks to a server, and
 * nothing here should be treated as a real credential — see `ApiKeysCard`,
 * which says so on screen.
 *
 * When the backend lands, the shapes below are what the page expects; swap the
 * local state for the real calls and keep the helpers. Field names are
 * snake_case to match what the API serialises, so a real response can be
 * dropped in without a translation layer in between.
 */

export type ApiKey = {
  id: string
  name: string
  /** Full token. Only ever held for a freshly generated key, never stored. */
  token?: string
  /** The leading characters, which is all a server would return afterwards. */
  token_preview: string
  created_at: string
  expires_at: string
  last_used_at?: string | null
  revoked_at?: string | null
}

/** What a key is worth at a glance: usable, nearly stale, or finished. */
export type ApiKeyStatus = 'active' | 'expiring' | 'expired' | 'revoked'

const TOKEN_PREFIX = 'ocot'
const TOKEN_BODY_LENGTH = 32
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** How long an issued key lasts. The API will own this; the page mirrors it. */
export const API_KEY_LIFETIME_DAYS = 90

/**
 * How early the page starts warning. Long enough that someone who only opens
 * settings occasionally still sees the warning before the key stops working.
 */
export const API_KEY_EXPIRY_WARNING_DAYS = 14

const MS_PER_DAY = 24 * 60 * 60 * 1000

const randomValues = (length: number): number[] => {
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  return [...values]
}

/**
 * A token that looks like what the API will issue, so the reveal dialog and
 * the copy affordance can be judged at the right length.
 */
export const generateApiKeyToken = (): string => {
  const body = randomValues(TOKEN_BODY_LENGTH)
    .map((value) => ALPHABET[value % ALPHABET.length])
    .join('')

  return `${TOKEN_PREFIX}_${body}`
}

/** What a server would show after creation: enough to recognise, not to use. */
export const previewOfToken = (token: string): string =>
  // Prefix, separator, five characters — enough to tell two keys apart.
  `${token.slice(0, TOKEN_PREFIX.length + 6)}…${token.slice(-4)}`

export const createApiKey = ({
  name,
  now,
  token = generateApiKeyToken(),
  id,
  lifetimeDays = API_KEY_LIFETIME_DAYS,
}: {
  name: string
  now: Date
  token?: string
  id?: string
  lifetimeDays?: number
}): ApiKey => ({
  id: id ?? token.slice(-12),
  name: name.trim() || 'Untitled key',
  token,
  token_preview: previewOfToken(token),
  created_at: now.toISOString(),
  expires_at: new Date(now.getTime() + lifetimeDays * MS_PER_DAY).toISOString(),
  last_used_at: null,
  revoked_at: null,
})

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

export const revokeApiKey = (key: ApiKey, now: Date): ApiKey => ({
  ...key,
  token: undefined,
  revoked_at: now.toISOString(),
})

export const renameApiKey = (key: ApiKey, name: string): ApiKey => ({
  ...key,
  name: name.trim() || key.name,
})

/** Active keys first, newest first within each group. */
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
