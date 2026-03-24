export const AUTHENTIK_URL =
  import.meta.env.VITE_AUTHENTIK_URL || 'http://localhost:8000/'

export const CLIENT_ID = import.meta.env.VITE_AUTHENTIK_CLIENT_ID || 'authentik'

export const REDIRECT_URI =
  import.meta.env.VITE_AUTHENTIK_REDIRECT_URI ||
  'http://localhost:3000/callback'

const isTruthyEnvValue = (value: unknown): boolean =>
  typeof value === 'string' &&
  ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())

export const IS_TESTING_AUTH = isTruthyEnvValue(import.meta.env.VITE_TEST_AUTH)
