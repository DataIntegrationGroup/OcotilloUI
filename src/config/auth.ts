export const AUTHENTIK_URL =
  import.meta.env.VITE_AUTHENTIK_URL || 'http://localhost:8000/'

export const CLIENT_ID = import.meta.env.VITE_AUTHENTIK_CLIENT_ID || 'authentik'

export const REDIRECT_URI =
  import.meta.env.VITE_AUTHENTIK_REDIRECT_URI ||
  'http://localhost:3000/callback'

export const IS_TESTING_AUTH =
  !import.meta.env.PROD && import.meta.env.VITE_TEST_AUTH
