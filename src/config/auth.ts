export const AUTHENTIK_URL =
  import.meta.env.VITE_AUTHENTIK_URL || 'http://localhost:8000/'

export const AUTHENTIK_BASE_URL =
  import.meta.env.VITE_AUTHENTIK_BASE_URL ||
  (typeof window !== 'undefined'
    ? new URL(AUTHENTIK_URL, window.location.origin).origin
    : AUTHENTIK_URL)

export const buildAuthentikUrl = (path: string, baseUrl = AUTHENTIK_URL): URL =>
  new URL(path.replace(/^\/+/, ''), `${baseUrl.replace(/\/+$/, '')}/`)

export const buildAuthentikApiUrl = (path: string): URL =>
  buildAuthentikUrl(path, AUTHENTIK_BASE_URL)

export const CLIENT_ID = import.meta.env.VITE_AUTHENTIK_CLIENT_ID || 'authentik'

export const AUTHENTIK_AUTH_FLOW_SLUG =
  import.meta.env.VITE_AUTHENTIK_AUTH_FLOW_SLUG || 'default-authentication-flow'

export const AUTHENTIK_SCOPE =
  import.meta.env.VITE_AUTHENTIK_SCOPE ||
  'openid profile email offline_access permissions'

const envRedirect = import.meta.env.VITE_AUTHENTIK_REDIRECT_URI

export const REDIRECT_URI =
  envRedirect ||
  (typeof window !== 'undefined' && window.location?.origin
    ? `${window.location.origin}/callback`
    : 'http://localhost:3000/callback')

const isTruthyEnvValue = (value: unknown): boolean =>
  typeof value === 'string' &&
  ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())

export const IS_TESTING_AUTH = isTruthyEnvValue(import.meta.env.VITE_TEST_AUTH)
