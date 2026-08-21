import {
  AuthActionResponse,
  AuthProvider,
  CheckResponse,
  OnErrorResponse,
} from '@refinedev/core'
import { sha256 } from 'js-sha256'
import { jwtDecode, JwtPayload } from 'jwt-decode'
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateOAuthState,
} from '@/utils/Auth'
import { getStatusCode, hasError } from '@/utils/Http'
import { isJwtExpired } from '@/utils/Jwt'
import { HttpStatus } from '@/enums'
import {
  buildAuthentikUrl,
  CLIENT_ID,
  REDIRECT_URI,
  STORAGE_KEYS,
  IS_TESTING_AUTH,
} from '@/config'
import { normalizeAccessControlGroups } from '@/utils/accessControl'

const gravatarUrl = (email: string) => {
  const hash = email.trim().toLowerCase()
  return `https://www.gravatar.com/avatar/${sha256(hash)}`
}

interface AuthentikJwtPayload extends JwtPayload {
  email: string
  name?: string
  preferred_username?: string
  given_name?: string
  family_name?: string
  groups?: string[]
}

export interface AuthentikIdentity {
  id: string
  email: string
  avatar: string
  name: string
}

export type AuthentikPermissions = string[]
const TEST_AUTH_GROUPS: AuthentikPermissions = [
  'AMP.Viewer',
  'AMP.Editor',
  'AMP.Admin',
  // Not implied by AMP.Admin, so the local test identity has to hold it
  // explicitly or staging-gated screens are unreachable in dev.
  'AMP.Staging',
  'Geothermal.Viewer',
  'Geothermal.Editor',
]
const PKCE_LOCAL_FALLBACK_TTL_MS = 5 * 60 * 1000

type PkceFallbackRecord = {
  verifier: string
  state: string
  expiresAt: number
}

const getPkceFallbackKey = (state: string): string =>
  `${STORAGE_KEYS.pkceTransactionPrefix}${state}`

const isPkceFallbackRecord = (v: unknown): v is PkceFallbackRecord => {
  if (!v || typeof v !== 'object') return false

  const record = v as Partial<PkceFallbackRecord>
  return (
    typeof record.verifier === 'string' &&
    typeof record.state === 'string' &&
    typeof record.expiresAt === 'number'
  )
}

export const persistPkceFallback = ({
  verifier,
  state,
}: {
  verifier: string
  state: string
}): void => {
  const key = getPkceFallbackKey(state)
  const payload: PkceFallbackRecord = {
    verifier,
    state,
    expiresAt: Date.now() + PKCE_LOCAL_FALLBACK_TTL_MS,
  }

  localStorage.setItem(key, JSON.stringify(payload))
}

export const consumePkceFallbackByState = (
  state: string
): { verifier: string; state: string } | null => {
  const key = getPkceFallbackKey(state)
  const raw = localStorage.getItem(key)
  if (!raw) return null

  // One-time consume: delete before parse/validate.
  localStorage.removeItem(key)

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!isPkceFallbackRecord(parsed)) return null
    if (parsed.state !== state) return null
    if (Date.now() > parsed.expiresAt) return null

    return { verifier: parsed.verifier, state: parsed.state }
  } catch {
    return null
  }
}

export const clearPkceFallbacks = (): void => {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)
    if (key?.startsWith(STORAGE_KEYS.pkceTransactionPrefix)) {
      localStorage.removeItem(key)
    }
  }

  // Remove legacy keys from prior implementation if present.
  localStorage.removeItem(STORAGE_KEYS.pkceVerifier)
  localStorage.removeItem(STORAGE_KEYS.pkceState)
}

export const getAccessToken = async ({
  refresh,
}: { refresh?: boolean } = {}): Promise<string | null> => {
  const currentAccess = localStorage.getItem(STORAGE_KEYS.accessToken)

  if (!refresh) return currentAccess

  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken)
  if (!refreshToken) return null

  const url = buildAuthentikUrl('token/')

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    }),
  })

  if (!response.ok) {
    // refresh failed — clear tokens
    localStorage.removeItem(STORAGE_KEYS.accessToken)
    localStorage.removeItem(STORAGE_KEYS.idToken)
    localStorage.removeItem(STORAGE_KEYS.refreshToken)
    return null
  }

  const data = await response.json()

  localStorage.setItem(STORAGE_KEYS.accessToken, data.access_token)
  localStorage.setItem(STORAGE_KEYS.idToken, data.id_token)
  localStorage.setItem(STORAGE_KEYS.refreshToken, data.refresh_token)

  return data.access_token
}

export const getAccessControlGroups = (): string[] | null => {
  if (IS_TESTING_AUTH) {
    return TEST_AUTH_GROUPS
  }

  const idToken = localStorage.getItem(STORAGE_KEYS.idToken)
  if (!idToken) return null

  try {
    const decoded = jwtDecode<{ groups?: string[] }>(idToken)
    return normalizeAccessControlGroups(decoded.groups)
  } catch {
    return null
  }
}

export const authentikAuthProvider: AuthProvider = {
  login: async (_params): Promise<AuthActionResponse> => {
    if (IS_TESTING_AUTH) {
      tokenStore.accessToken = 'fake_token'
      tokenStore.idToken = 'fake_token'
      return { success: true, redirectTo: '/' }
    }

    try {
      clearPkceFallbacks()

      const codeVerifier = generateCodeVerifier()
      const codeChallenge = await generateCodeChallenge(codeVerifier)

      transientStore.pkceVerifier = codeVerifier

      const state = generateOAuthState()
      transientStore.pkceState = state
      persistPkceFallback({ verifier: codeVerifier, state })

      const RESPONSE_TYPE = 'code'
      const SCOPE = 'openid profile email offline_access permissions'

      const authUrl = buildAuthentikUrl('authorize/')
      authUrl.searchParams.set('client_id', CLIENT_ID)
      authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
      authUrl.searchParams.set('response_type', RESPONSE_TYPE)
      authUrl.searchParams.set('scope', SCOPE)
      authUrl.searchParams.set('code_challenge', codeChallenge)
      authUrl.searchParams.set('code_challenge_method', 'S256')
      authUrl.searchParams.set('state', state)

      window.location.assign(authUrl.toString())

      return { success: true }
    } catch (e) {
      transientStore.pkceVerifier = null
      transientStore.pkceState = null
      clearPkceFallbacks()

      return {
        success: false,
        error: {
          name: 'LoginError',
          message:
            e instanceof Error ? e.message : 'Failed to start Authentik login',
        },
      }
    }
  },

  logout: async (): Promise<AuthActionResponse> => {
    tokenStore.accessToken = null
    tokenStore.idToken = null
    tokenStore.refreshToken = null

    transientStore.pkceVerifier = null
    transientStore.pkceState = null
    clearPkceFallbacks()

    return { success: true, redirectTo: '/login' }
  },

  /**
   * Called by Refine on route changes and page load to verify whether
   * the current user session is still authenticated.
   *
   * If no access token exists, the user is redirected to the login page.
   *
   * If the access token exists but is expired, we attempt a silent
   * refresh using the refresh token.
   *
   * If the refresh succeeds, the session continues normally.
   * If the refresh fails, all auth state is cleared and the user
   * must log in again.
   */
  check: async (): Promise<CheckResponse> => {
    if (IS_TESTING_AUTH) {
      return { authenticated: true }
    }

    let access = tokenStore.accessToken
    if (!access) {
      return { authenticated: false, redirectTo: '/login' }
    }

    if (isJwtExpired(access)) {
      access = await getAccessToken({ refresh: true })

      if (!access) {
        tokenStore.accessToken = null
        tokenStore.idToken = null
        tokenStore.refreshToken = null

        transientStore.pkceVerifier = null
        transientStore.pkceState = null
        clearPkceFallbacks()

        return { authenticated: false, redirectTo: '/login' }
      }
    }

    return { authenticated: true }
  },

  // Returns the current user's profile
  getIdentity: async (): Promise<AuthentikIdentity | null> => {
    if (IS_TESTING_AUTH) {
      return {
        id: 'test',
        avatar: gravatarUrl(''),
        email: '',
        name: 'Test User',
      }
    }
    const idToken = tokenStore.idToken
    if (!idToken) return null
    if (isJwtExpired(idToken) && !IS_TESTING_AUTH) return null

    try {
      const profile = jwtDecode<AuthentikJwtPayload>(idToken)
      const name =
        profile.name ||
        [profile.given_name, profile.family_name].filter(Boolean).join(' ') ||
        profile.preferred_username ||
        profile.email
      return {
        id: profile.sub ?? '',
        avatar: gravatarUrl(profile.email),
        email: profile.email ?? '',
        name: name ?? '',
      }
    } catch {
      return null
    }
  },

  getPermissions: async (): Promise<AuthentikPermissions | null> => {
    if (IS_TESTING_AUTH) {
      return TEST_AUTH_GROUPS
    }

    const idToken = tokenStore.idToken
    if (!idToken) return null

    try {
      const decoded = jwtDecode<AuthentikJwtPayload>(idToken)
      return normalizeAccessControlGroups(decoded.groups)
    } catch {
      return null
    }
  },

  /**
   * Called automatically by Refine when a data hook throws.
   *
   * This is triggered by hooks like:
   *   - useList
   *   - useOne
   *   - useCreate / useUpdate / useDelete
   *
   * Even though we use FastAPI (backend), fetch (HTTP client),
   * and React Query under Refine, the error shape is not guaranteed.
   *
   * Refine forwards whatever the dataProvider throws, so we treat
   * `params` as `unknown` and narrow it safely.
   */
  onError: async (params: unknown): Promise<OnErrorResponse> => {
    const err = hasError(params) ? params.error : params
    const status = getStatusCode(err)

    if (status === HttpStatus.UNAUTHORIZED) {
      /**
       * If the backend returns 401 (Unauthorized), the most common cause
       * is an expired access token. In that case we attempt a silent
       * refresh using the refresh token.
       *
       * If the refresh succeeds, we allow the request flow to continue
       * without logging the user out.
       *
       * If the refresh fails (refresh token expired or invalid), we clear
       * all stored tokens and force a logout so the user must authenticate
       * again.
       */
      const refreshed = await getAccessToken({ refresh: true })

      if (refreshed) {
        return {}
      }

      tokenStore.accessToken = null
      tokenStore.idToken = null
      tokenStore.refreshToken = null

      transientStore.pkceVerifier = null
      transientStore.pkceState = null
      clearPkceFallbacks()

      return {
        logout: true,
        redirectTo: '/login',
      }
    }

    if (status === HttpStatus.FORBIDDEN) {
      // TODO: Build an "Access denied" page and send them to it
      return {}
    }

    // Anything else: no auth action.
    return {}
  },

  // TODO: Impl these features
  register: async (_params): Promise<AuthActionResponse> => ({
    success: false,
  }),
  forgotPassword: async (_params): Promise<AuthActionResponse> => ({
    success: false,
  }),
  updatePassword: async (_params): Promise<AuthActionResponse> => ({
    success: false,
  }),
}

export const tokenStore = {
  get accessToken() {
    return localStorage.getItem(STORAGE_KEYS.accessToken)
  },
  set accessToken(v: string | null) {
    if (v == null) localStorage.removeItem(STORAGE_KEYS.accessToken)
    else localStorage.setItem(STORAGE_KEYS.accessToken, v)
  },

  get idToken() {
    return localStorage.getItem(STORAGE_KEYS.idToken)
  },
  set idToken(v: string | null) {
    if (v == null) localStorage.removeItem(STORAGE_KEYS.idToken)
    else localStorage.setItem(STORAGE_KEYS.idToken, v)
  },

  get refreshToken() {
    return localStorage.getItem(STORAGE_KEYS.refreshToken)
  },
  set refreshToken(v: string | null) {
    if (v == null) localStorage.removeItem(STORAGE_KEYS.refreshToken)
    else localStorage.setItem(STORAGE_KEYS.refreshToken, v)
  },
}

export const transientStore = {
  get pkceVerifier() {
    return sessionStorage.getItem(STORAGE_KEYS.pkceVerifier)
  },
  set pkceVerifier(v: string | null) {
    if (v == null) sessionStorage.removeItem(STORAGE_KEYS.pkceVerifier)
    else sessionStorage.setItem(STORAGE_KEYS.pkceVerifier, v)
  },

  get pkceState() {
    return sessionStorage.getItem(STORAGE_KEYS.pkceState)
  },
  set pkceState(v: string | null) {
    if (v == null) sessionStorage.removeItem(STORAGE_KEYS.pkceState)
    else sessionStorage.setItem(STORAGE_KEYS.pkceState, v)
  },
}
