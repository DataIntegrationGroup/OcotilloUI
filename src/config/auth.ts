export const AUTHENTIK_URL =
  import.meta.env.VITE_AUTHENTIK_URL || 'http://localhost:8000/'

export const buildAuthentikUrl = (
  path: string,
  baseUrl = AUTHENTIK_URL
): URL => new URL(path.replace(/^\/+/, ''), `${baseUrl.replace(/\/+$/, '')}/`)

export const CLIENT_ID = import.meta.env.VITE_AUTHENTIK_CLIENT_ID || 'authentik'

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
