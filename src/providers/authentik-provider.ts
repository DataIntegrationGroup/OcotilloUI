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
  getStatusCode,
  hasError,
  isJwtExpired,
} from '@/utils'
import { HttpStatus } from '@/enums'
import {
  AUTHENTIK_URL,
  CLIENT_ID,
  REDIRECT_URI,
  STORAGE_KEYS,
  IS_TESTING_AUTH,
} from '@/config'

const gravatarUrl = (email: string) => {
  let hash = email.trim().toLowerCase()
  return `https://www.gravatar.com/avatar/${sha256(hash)}`
}

interface AuthentikJwtPayload extends JwtPayload {
  email: string
}

export interface AuthentikIdentity {
  id: string
  email: string
  avatar: string
}

export type AuthentikPermissions = string[]

export const getAccessToken = async (
  refresh?: boolean
): Promise<string | null> => {
  const currentAccess = localStorage.getItem(STORAGE_KEYS.accessToken)

  if (!refresh) return currentAccess

  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken)
  if (!refreshToken) return null

  const url = new URL(`${AUTHENTIK_URL}/token/`)

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
    return ['OcotilloAdmin']
  }

  const idToken = localStorage.getItem(STORAGE_KEYS.idToken)
  if (!idToken) return null

  try {
    const decoded = jwtDecode<{ groups?: string[] }>(idToken)
    return decoded.groups ?? []
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
      const codeVerifier = generateCodeVerifier()
      const codeChallenge = await generateCodeChallenge(codeVerifier)

      transientStore.pkceVerifier = codeVerifier

      const state = generateOAuthState()
      transientStore.pkceState = state

      const RESPONSE_TYPE = 'code'
      const SCOPE = 'openid profile email offline_access permissions'

      const authUrl = new URL(`${AUTHENTIK_URL}/authorize/`)
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

    return { success: true, redirectTo: '/login' }
  },

  // Called on page load / route change
  check: async (): Promise<CheckResponse> => {
    const access = tokenStore.accessToken
    if (!access) return { authenticated: false, redirectTo: '/login' }

    // If a JWT is present, then validate expiry.
    if (isJwtExpired(access) && !IS_TESTING_AUTH) {
      tokenStore.accessToken = null
      tokenStore.idToken = null
      tokenStore.refreshToken = null
      return { authenticated: false, redirectTo: '/login' }
    }

    return { authenticated: true }
  },

  // Returns the current user's profile
  getIdentity: async (): Promise<AuthentikIdentity | null> => {
    if (!import.meta.env.PROD && import.meta.env.VITE_TEST_AUTH) {
      return {
        id: 'test',
        avatar: gravatarUrl(''),
        email: '',
      }
    }
    const idToken = tokenStore.idToken
    if (!idToken) return null
    if (isJwtExpired(idToken) && !IS_TESTING_AUTH) return null

    try {
      const profile = jwtDecode<AuthentikJwtPayload>(idToken)
      return {
        id: profile.sub,
        avatar: gravatarUrl(profile.email),
        email: profile.email,
      }
    } catch {
      return null
    }
  },

  getPermissions: async (): Promise<AuthentikPermissions | null> => {
    const idToken = tokenStore.idToken
    if (!idToken) return null

    try {
      const decoded = jwtDecode<AuthentikJwtPayload>(idToken)
      return decoded['groups'] ?? []
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
      tokenStore.accessToken = null
      tokenStore.idToken = null
      tokenStore.refreshToken = null

      transientStore.pkceVerifier = null
      transientStore.pkceState = null

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
