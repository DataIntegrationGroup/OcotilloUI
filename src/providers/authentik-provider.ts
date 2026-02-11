import { AuthActionResponse, AuthProvider } from '@refinedev/core'
import { generateCodeChallenge, generateCodeVerifier } from '@/utils'
import { sha256 } from 'js-sha256'
import { jwtDecode, JwtPayload } from 'jwt-decode'

const AUTHENTIK_URL =
  import.meta.env.VITE_AUTHENTIK_URL || 'http://localhost:8000/'
const CLIENT_ID = import.meta.env.VITE_AUTHENTIK_CLIENT_ID || 'authentik'
const REDIRECT_URI =
  import.meta.env.VITE_AUTHENTIK_REDIRECT_URI ||
  'http://localhost:3000/callback'

const gravatarUrl = (email: string) => {
  let hash = email.trim().toLowerCase()
  return `https://www.gravatar.com/avatar/${sha256(hash)}`
}

interface AuthentikJwtPayload extends JwtPayload {
  email: string
}

export const getAccessToken = async (refresh?: boolean) => {
  if (refresh) {
    const refresh_token = localStorage.getItem('refresh_token')
    const url = new URL(`${AUTHENTIK_URL}/token/`)
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
        client_id: CLIENT_ID,
      }),
    })
    const data = await response.json()
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('id_token', data.id_token)
    localStorage.setItem('refresh_token', data.refresh_token)
  }
  return localStorage.getItem('access_token')
}

export const getAccessControlGroups = (): string[] => {
  if (!import.meta.env.PROD && import.meta.env.VITE_TEST_AUTH) {
    return ['OcotilloAdmin']
  }
  const id_token = localStorage.getItem('id_token')

  if (!id_token) return null
  const token = jwtDecode(id_token)

  return token['groups'] || []
}

export const authentikAuthProvider: AuthProvider = {
  login: async (params) => {
    if (!import.meta.env.PROD && import.meta.env.VITE_TEST_AUTH) {
      localStorage.setItem('access_token', 'fake_token')
      localStorage.setItem('id_token', 'fake_token')
      return { success: true }
    }

    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    localStorage.setItem('pkce_code_verifier', codeVerifier)

    const RESPONSE_TYPE = 'code'
    const SCOPE = 'openid profile email offline_access permissions'

    const authUrl = new URL(`${AUTHENTIK_URL}/authorize/`)
    authUrl.searchParams.set('client_id', CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.set('response_type', RESPONSE_TYPE)
    authUrl.searchParams.set('scope', SCOPE)
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')

    window.location.assign(authUrl.toString())

    // Tell Refine to stay on /login while the browser redirects
    // to Authentik. This prevents Refine's post-login navigation
    // from interfering with the external OAuth redirect.
    return { success: true, redirectTo: '/login' }
  },

  // Called when user logs out
  logout: async () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('id_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('pkce_code_verifier')

    return { success: true }
  },

  // Called on page load / route change
  check: async () => {
    const token = localStorage.getItem('access_token')
    return token
      ? { authenticated: true }
      : { authenticated: false, redirectTo: '/login' }
  },

  // Returns the current user's profile
  getIdentity: async () => {
    if (!import.meta.env.PROD && import.meta.env.VITE_TEST_AUTH) {
      return {
        id: 'test',
        avatar: gravatarUrl(''),
        email: '',
      }
    }
    const token = localStorage.getItem('id_token')
    if (!token) return null

    const profile = jwtDecode<AuthentikJwtPayload>(token)
    return {
      id: profile.sub,
      avatar: gravatarUrl(profile.email),
      email: profile.email,
    }
  },

  // Called to check permissions (optional)
  getPermissions: async () => {
    const id_token = localStorage.getItem('id_token')
    if (!id_token) return null
    const token = jwtDecode(id_token)
    return token['groups'] || []
  },

  onError: async (params) => ({}) as AuthActionResponse,
  register: async (params) => ({}) as AuthActionResponse,
  forgotPassword: async (params) => ({}) as AuthActionResponse,
  updatePassword: async (params) => ({}) as AuthActionResponse,
}
