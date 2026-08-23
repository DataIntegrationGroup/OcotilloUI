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
 * local state for the real calls and keep the helpers.
 */

export type ApiKey = {
  id: string
  name: string
  /** Full token. Only ever held for a freshly generated key, never stored. */
  token?: string
  /** The leading characters, which is all a server would return afterwards. */
  tokenPreview: string
  createdAt: string
  lastUsedAt?: string | null
  revokedAt?: string | null
}

const TOKEN_PREFIX = 'ocot'
const TOKEN_BODY_LENGTH = 32
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

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
}: {
  name: string
  now: Date
  token?: string
  id?: string
}): ApiKey => ({
  id: id ?? token.slice(-12),
  name: name.trim() || 'Untitled key',
  token,
  tokenPreview: previewOfToken(token),
  createdAt: now.toISOString(),
  lastUsedAt: null,
  revokedAt: null,
})

export const isApiKeyActive = (key: ApiKey): boolean => !key.revokedAt

export const revokeApiKey = (key: ApiKey, now: Date): ApiKey => ({
  ...key,
  token: undefined,
  revokedAt: now.toISOString(),
})

export const renameApiKey = (key: ApiKey, name: string): ApiKey => ({
  ...key,
  name: name.trim() || key.name,
})

/** Active keys first, newest first within each group. */
export const sortApiKeys = (keys: ApiKey[]): ApiKey[] =>
  [...keys].sort((a, b) => {
    if (isApiKeyActive(a) !== isApiKeyActive(b))
      return isApiKeyActive(a) ? -1 : 1
    return b.createdAt.localeCompare(a.createdAt)
  })

export const describeLastUsed = (key: ApiKey): string => {
  if (key.revokedAt) return 'Revoked'
  if (!key.lastUsedAt) return 'Never used'
  return new Date(key.lastUsedAt).toLocaleDateString()
}
