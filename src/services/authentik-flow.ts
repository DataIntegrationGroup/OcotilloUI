import {
  AUTHENTIK_AUTH_FLOW_SLUG,
  AUTHENTIK_API_BASE_URL,
  AUTHENTIK_PASSWORD_RECOVERY_FLOW_SLUG,
  AUTHENTIK_SCOPE,
  AUTHENTIK_BASE_URL,
  buildAuthentikApiUrl,
  buildAuthentikUrl,
  CLIENT_ID,
  REDIRECT_URI,
  STORAGE_KEYS,
} from '@/config'
import {
  clearPkceFallbacks,
  persistPkceFallback,
  transientStore,
} from '@/providers/authentik-provider'
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateOAuthState,
} from '@/utils/Auth'

export type AuthentikFlowComponent =
  | 'ak-stage-identification'
  | 'ak-stage-password'
  | 'ak-stage-authenticator-validate'
  | 'ak-stage-user-login'
  | 'ak-stage-access-denied'
  | 'ak-stage-flow-error'
  | 'xak-flow-redirect'
  | string

type ResponseErrorDetail = {
  string?: string
  code?: string
}

type FlowInfo = {
  title?: string
  cancel_url?: string
}

export type AuthentikChallenge = {
  component: AuthentikFlowComponent
  type?: string
  flow_info?: FlowInfo
  response_errors?: Record<string, ResponseErrorDetail[] | string[]>
  error_message?: string
  to?: string
  final_redirect?: boolean
  password_fields?: boolean
  allow_show_password?: boolean
  user_fields?: string[]
  flow_designation?: string
  device_challenges?: Array<Record<string, unknown>>
}

export type AuthentikFlowTransaction = {
  flowSlug: string
  query: string
  state: string
  username?: string
  currentChallenge?: AuthentikChallenge
  selectedOtpChallenge?: Record<string, unknown>
}

export type LoginFlowResult =
  | { status: 'password_required'; transaction: AuthentikFlowTransaction }
  | { status: 'otp_required'; transaction: AuthentikFlowTransaction }
  | { status: 'redirect'; to: string }
  | { status: 'error'; message: string }

export type OtpFlowResult =
  | { status: 'redirect'; to: string }
  | { status: 'expired'; message: string }
  | { status: 'error'; message: string }

const GENERIC_AUTH_ERROR = 'The username or password is incorrect.'
const GENERIC_OTP_ERROR = 'The verification code is incorrect or expired.'
const GENERIC_NETWORK_ERROR =
  'Authentik is unavailable. Check your connection and try again.'
const AUTHENTIK_BROWSER_SECURITY_ERROR =
  'The browser blocked the Authentik flow request. Check Authentik CORS/credentialed cookie settings or use a same-origin proxy for /api/v3/flows/executor.'
const OTP_DEVICE_CLASSES = new Set(['totp', 'static', 'sms', 'email'])
const MAX_FLOW_CONTINUATIONS = 8
const MAX_HTTP_REDIRECTS = 4

export class AuthentikFlowError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthentikFlowError'
  }
}

const getTransaction = (): AuthentikFlowTransaction | null => {
  const raw = sessionStorage.getItem(STORAGE_KEYS.authentikFlowTransaction)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<AuthentikFlowTransaction>
    if (
      typeof parsed.flowSlug !== 'string' ||
      typeof parsed.query !== 'string' ||
      typeof parsed.state !== 'string'
    ) {
      return null
    }

    return {
      flowSlug: parsed.flowSlug,
      query: parsed.query,
      state: parsed.state,
      username:
        typeof parsed.username === 'string' ? parsed.username : undefined,
      currentChallenge:
        parsed.currentChallenge && typeof parsed.currentChallenge === 'object'
          ? (parsed.currentChallenge as AuthentikChallenge)
          : undefined,
      selectedOtpChallenge:
        parsed.selectedOtpChallenge &&
        typeof parsed.selectedOtpChallenge === 'object'
          ? parsed.selectedOtpChallenge
          : undefined,
    }
  } catch {
    return null
  }
}

export const authentikFlowStore = {
  get transaction() {
    return getTransaction()
  },
  set transaction(value: AuthentikFlowTransaction | null) {
    if (!value) {
      sessionStorage.removeItem(STORAGE_KEYS.authentikFlowTransaction)
      return
    }

    sessionStorage.setItem(
      STORAGE_KEYS.authentikFlowTransaction,
      JSON.stringify(value)
    )
  },
}

export const clearAuthentikFlowTransaction = (): void => {
  authentikFlowStore.transaction = null
}

const buildAuthorizeQuery = async (): Promise<{
  query: string
  state: string
}> => {
  clearPkceFallbacks()

  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = generateOAuthState()

  transientStore.pkceVerifier = verifier
  transientStore.pkceState = state
  persistPkceFallback({ verifier, state })

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: AUTHENTIK_SCOPE,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  })

  return { query: params.toString(), state }
}

export const buildAuthentikPasswordRecoveryUrl = async (): Promise<string> => {
  clearAuthentikFlowTransaction()
  const { query } = await buildAuthorizeQuery()
  const url = buildAuthentikUrl(
    `/if/flow/${AUTHENTIK_PASSWORD_RECOVERY_FLOW_SLUG}/`,
    AUTHENTIK_BASE_URL
  )
  const params = new URLSearchParams(query)
  params.forEach((value, key) => {
    url.searchParams.set(key, value)
  })

  return url.toString()
}

const executorUrl = (transaction: AuthentikFlowTransaction): URL => {
  const url = buildAuthentikApiUrl(
    `/api/v3/flows/executor/${transaction.flowSlug}/`
  )
  url.searchParams.set('query', transaction.query)
  return url
}

const getCookieValue = (name: string): string | null => {
  if (typeof document === 'undefined') return null

  const encodedName = `${encodeURIComponent(name)}=`
  const cookie = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(encodedName))

  if (!cookie) return null

  return decodeURIComponent(cookie.slice(encodedName.length))
}

const flowRequestHeaders = (body?: Record<string, unknown>): HeadersInit => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (!body) return headers

  headers['Content-Type'] = 'application/json'

  const csrf = getCookieValue('authentik_csrf')
  if (csrf) {
    headers['X-CSRFToken'] = csrf
    headers['X-Authentik-CSRF'] = csrf
  }

  return headers
}

const currentOrigin = (): string =>
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'http://localhost:5173'

const resolveProxyRedirectUrl = (
  location: string,
  currentUrl: string
): string => {
  const url = new URL(location, currentUrl)
  const authentikOrigin = new URL(AUTHENTIK_BASE_URL).origin
  const proxyPath = AUTHENTIK_API_BASE_URL.replace(/\/+$/, '')

  if (
    AUTHENTIK_API_BASE_URL.startsWith('/') &&
    url.origin === new URL(AUTHENTIK_BASE_URL).origin &&
    url.pathname.startsWith('/api/')
  ) {
    return new URL(`${proxyPath}${url.pathname}${url.search}`, currentOrigin())
      .href
  }

  if (
    AUTHENTIK_API_BASE_URL.startsWith('/') &&
    url.origin === currentOrigin() &&
    (url.pathname.startsWith('/application/') ||
      url.pathname.startsWith('/if/') ||
      url.pathname.startsWith('/flows/'))
  ) {
    return new URL(`${url.pathname}${url.search}`, authentikOrigin).href
  }

  if (
    AUTHENTIK_API_BASE_URL.startsWith('/') &&
    !url.pathname.startsWith(AUTHENTIK_API_BASE_URL) &&
    url.origin === currentOrigin() &&
    url.pathname.startsWith('/api/')
  ) {
    url.pathname = `${proxyPath}${url.pathname}`
  }

  return url.toString()
}

const isCallbackRedirect = (url: string): boolean => {
  const redirectUrl = new URL(url)
  const expectedRedirect = new URL(REDIRECT_URI, currentOrigin())
  return (
    redirectUrl.origin === expectedRedirect.origin &&
    redirectUrl.pathname === expectedRedirect.pathname &&
    redirectUrl.searchParams.has('code')
  )
}

const isExecutorApiRedirect = (url: string): boolean => {
  const redirectUrl = new URL(url)
  return redirectUrl.pathname.includes('/api/v3/flows/executor/')
}

const isOidcAuthorizeRedirect = (url: string): boolean => {
  const redirectUrl = new URL(url)
  return redirectUrl.pathname.includes('/authorize')
}

const redirectChallengeResponse = (to: string): Response =>
  new Response(
    JSON.stringify({
      component: 'xak-flow-redirect',
      to,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )

const oidcAuthorizeUrl = (transaction: AuthentikFlowTransaction): string => {
  const url = buildAuthentikUrl('authorize/')
  const params = new URLSearchParams(transaction.query)
  params.forEach((value, key) => {
    url.searchParams.set(key, value)
  })
  return url.toString()
}

const fetchChallengeResponse = async (
  url: string,
  body?: Record<string, unknown>
): Promise<Response> => {
  let nextUrl = url
  let nextBody = body

  for (let i = 0; i < MAX_HTTP_REDIRECTS; i++) {
    let response: Response
    try {
      response = await fetch(nextUrl, {
        method: nextBody ? 'POST' : 'GET',
        credentials: 'include',
        redirect: 'manual',
        headers: flowRequestHeaders(nextBody),
        body: nextBody ? JSON.stringify(nextBody) : undefined,
      })
    } catch (error) {
      if (error instanceof TypeError) {
        throw new AuthentikFlowError(AUTHENTIK_BROWSER_SECURITY_ERROR)
      }
      throw error
    }

    if (response.type === 'opaqueredirect' || response.status === 0) {
      nextUrl = url
      nextBody = undefined
      continue
    }

    if (response.status < 300 || response.status >= 400) return response

    const location = response.headers.get('Location')
    if (!location) {
      nextUrl = url
      nextBody = undefined
      continue
    }

    const redirectUrl = resolveProxyRedirectUrl(location, nextUrl)
    if (isCallbackRedirect(redirectUrl)) {
      return redirectChallengeResponse(redirectUrl)
    }

    if (isOidcAuthorizeRedirect(redirectUrl)) {
      return redirectChallengeResponse(redirectUrl)
    }

    nextUrl = isExecutorApiRedirect(redirectUrl) ? redirectUrl : url
    nextBody = undefined
  }

  throw new AuthentikFlowError('Authentik redirected too many times.')
}

const requestChallenge = async (
  transaction: AuthentikFlowTransaction,
  body?: Record<string, unknown>
): Promise<AuthentikChallenge> => {
  const response = await fetchChallengeResponse(
    executorUrl(transaction).toString(),
    body
  )

  if (!response.ok) {
    if (response.status === 400 || response.status === 403) {
      throw new AuthentikFlowError('This sign-in session has expired.')
    }
    throw new AuthentikFlowError(GENERIC_NETWORK_ERROR)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new AuthentikFlowError(GENERIC_NETWORK_ERROR)
  }

  const challenge = (await response.json()) as AuthentikChallenge
  debugChallenge(challenge)
  return challenge
}

const debugChallenge = (challenge: AuthentikChallenge): void => {
  if (!import.meta.env.DEV || import.meta.env.MODE === 'test') return

  console.debug('Authentik flow component:', challenge.component, {
    component: challenge.component,
    type: challenge.type,
    flow_designation: challenge.flow_designation,
    user_fields: challenge.user_fields,
    password_fields: challenge.password_fields,
    allow_show_password: challenge.allow_show_password,
    response_error_fields: challenge.response_errors
      ? Object.keys(challenge.response_errors)
      : [],
    device_challenge_count: challenge.device_challenges?.length ?? 0,
    device_challenge_classes:
      challenge.device_challenges?.map((device) => device.device_class) ?? [],
    has_redirect: challenge.component === 'xak-flow-redirect',
  })
}

const getFirstResponseError = (
  challenge: AuthentikChallenge
): string | null => {
  const errors = challenge.response_errors
  if (!errors) return null

  for (const value of Object.values(errors)) {
    const [first] = value
    if (!first) continue
    if (typeof first === 'string') return first
    if (typeof first.string === 'string') return first.string
  }

  return null
}

const publicErrorForChallenge = (
  challenge: AuthentikChallenge,
  fallback: string
): string => {
  if (challenge.component === 'ak-stage-access-denied') {
    return 'Access was denied by the configured authentication policy.'
  }

  if (challenge.component === 'ak-stage-flow-error') {
    return 'Authentik could not complete this sign-in request.'
  }

  return getFirstResponseError(challenge) ?? challenge.error_message ?? fallback
}

const normalizeRedirect = (to: string): string => {
  try {
    return new URL(to, currentOrigin()).toString()
  } catch {
    return to
  }
}

const resolveRedirect = (challenge: AuthentikChallenge): string | null =>
  challenge.component === 'xak-flow-redirect' &&
  typeof challenge.to === 'string' &&
  (isCallbackRedirect(normalizeRedirect(challenge.to)) ||
    isOidcAuthorizeRedirect(normalizeRedirect(challenge.to)))
    ? normalizeRedirect(challenge.to)
    : null

const isHostedUiRedirectChallenge = (challenge: AuthentikChallenge): boolean =>
  challenge.component === 'xak-flow-redirect' &&
  typeof challenge.to === 'string' &&
  !isCallbackRedirect(normalizeRedirect(challenge.to)) &&
  !isOidcAuthorizeRedirect(normalizeRedirect(challenge.to))

const isFinalFlowRedirectChallenge = (challenge: AuthentikChallenge): boolean =>
  challenge.component === 'xak-flow-redirect' &&
  challenge.final_redirect === true

const unsupportedComponentMessage = (challenge: AuthentikChallenge): string =>
  `Authentik returned unsupported flow component "${challenge.component}".`

const isOtpDeviceChallenge = (device: Record<string, unknown>): boolean =>
  typeof device.device_class === 'string' &&
  OTP_DEVICE_CLASSES.has(device.device_class)

const prepareOtpTransaction = (
  transaction: AuthentikFlowTransaction,
  challenge: AuthentikChallenge
): LoginFlowResult => {
  const compatible =
    challenge.device_challenges?.filter(isOtpDeviceChallenge) ?? []

  if (challenge.device_challenges && compatible.length === 0) {
    return {
      status: 'error',
      message:
        'This sign-in requires an authenticator type this page does not support yet.',
    }
  }

  if (compatible.length > 1) {
    return {
      status: 'error',
      message:
        'Multiple authenticator choices are available. This page does not support choosing one yet.',
    }
  }

  authentikFlowStore.transaction = {
    ...transaction,
    selectedOtpChallenge: compatible[0],
  }
  return {
    status: 'otp_required',
    transaction: authentikFlowStore.transaction ?? transaction,
  }
}

const preparePasswordTransaction = (
  transaction: AuthentikFlowTransaction,
  challenge: AuthentikChallenge
): LoginFlowResult => {
  authentikFlowStore.transaction = {
    ...transaction,
    currentChallenge: challenge,
  }

  return {
    status: 'password_required',
    transaction: authentikFlowStore.transaction ?? transaction,
  }
}

const continueFlowAfterChallenge = async (
  transaction: AuthentikFlowTransaction,
  challenge: AuthentikChallenge
): Promise<LoginFlowResult> => {
  let current = challenge

  for (let i = 0; i < MAX_FLOW_CONTINUATIONS; i++) {
    if (isFinalFlowRedirectChallenge(current)) {
      clearAuthentikFlowTransaction()
      return { status: 'redirect', to: oidcAuthorizeUrl(transaction) }
    }

    const redirect = resolveRedirect(current)
    if (redirect) {
      clearAuthentikFlowTransaction()
      return { status: 'redirect', to: redirect }
    }

    if (isHostedUiRedirectChallenge(current)) {
      current = await requestChallenge(transaction)
      continue
    }

    if (current.component === 'ak-stage-authenticator-validate') {
      return prepareOtpTransaction(transaction, current)
    }

    if (current.component === 'ak-stage-password') {
      return preparePasswordTransaction(transaction, current)
    }

    if (
      current.component === 'ak-stage-identification' &&
      current.password_fields
    ) {
      return preparePasswordTransaction(transaction, current)
    }

    if (current.component === 'ak-stage-user-login') {
      current = await requestChallenge(transaction, {
        component: 'ak-stage-user-login',
      })
      continue
    }

    if (
      current.component === 'ak-stage-access-denied' ||
      current.component === 'ak-stage-flow-error' ||
      current.response_errors
    ) {
      return {
        status: 'error',
        message: publicErrorForChallenge(current, GENERIC_AUTH_ERROR),
      }
    }

    return {
      status: 'error',
      message: unsupportedComponentMessage(current),
    }
  }

  return {
    status: 'error',
    message: 'Authentik did not complete the sign-in flow.',
  }
}

export const startAuthentikIdentification = async (
  username: string
): Promise<LoginFlowResult> => {
  const trimmedUsername = username.trim()
  if (!trimmedUsername) {
    return {
      status: 'error',
      message: 'Enter your username or email.',
    }
  }

  try {
    const { query, state } = await buildAuthorizeQuery()
    const transaction: AuthentikFlowTransaction = {
      flowSlug: AUTHENTIK_AUTH_FLOW_SLUG,
      query,
      state,
      username: trimmedUsername,
    }

    authentikFlowStore.transaction = transaction

    let challenge = await requestChallenge(transaction)
    if (challenge.component !== 'ak-stage-identification') {
      return continueFlowAfterChallenge(transaction, challenge)
    }

    if (challenge.password_fields) {
      return preparePasswordTransaction(transaction, challenge)
    }

    challenge = await requestChallenge(transaction, {
      component: 'ak-stage-identification',
      uid_field: trimmedUsername,
    })

    if (challenge.response_errors) {
      return {
        status: 'error',
        message: publicErrorForChallenge(challenge, GENERIC_AUTH_ERROR),
      }
    }

    return continueFlowAfterChallenge(transaction, challenge)
  } catch (error) {
    return {
      status: 'error',
      message:
        error instanceof AuthentikFlowError
          ? error.message
          : GENERIC_NETWORK_ERROR,
    }
  }
}

export const submitAuthentikPassword = async (
  password: string
): Promise<LoginFlowResult> => {
  const transaction = authentikFlowStore.transaction
  if (!transaction) {
    return {
      status: 'error',
      message: 'This sign-in session has expired. Start again to continue.',
    }
  }

  if (!password) {
    return {
      status: 'error',
      message: 'Enter your password.',
    }
  }

  const challenge = transaction.currentChallenge

  try {
    let nextChallenge: AuthentikChallenge

    if (challenge?.component === 'ak-stage-password') {
      nextChallenge = await requestChallenge(transaction, {
        component: 'ak-stage-password',
        password,
      })
    } else if (
      challenge?.component === 'ak-stage-identification' &&
      challenge.password_fields
    ) {
      nextChallenge = await requestChallenge(transaction, {
        component: 'ak-stage-identification',
        uid_field: transaction.username,
        password,
      })
    } else {
      return {
        status: 'error',
        message: 'Authentik did not request a password challenge.',
      }
    }

    if (nextChallenge.response_errors) {
      return {
        status: 'error',
        message: publicErrorForChallenge(nextChallenge, GENERIC_AUTH_ERROR),
      }
    }

    return continueFlowAfterChallenge(transaction, nextChallenge)
  } catch (error) {
    return {
      status: 'error',
      message:
        error instanceof AuthentikFlowError
          ? error.message
          : GENERIC_NETWORK_ERROR,
    }
  }
}

export const startAuthentikLoginFlow = async ({
  username,
  password,
}: {
  username: string
  password: string
}): Promise<LoginFlowResult> => {
  const trimmedUsername = username.trim()
  if (!trimmedUsername || !password) {
    return {
      status: 'error',
      message: 'Enter your username or email and password.',
    }
  }

  const identification = await startAuthentikIdentification(trimmedUsername)
  if (identification.status !== 'password_required') return identification
  return submitAuthentikPassword(password)
}

export const submitAuthentikOtp = async (
  code: string
): Promise<OtpFlowResult> => {
  const transaction = authentikFlowStore.transaction
  if (!transaction) {
    return {
      status: 'expired',
      message: 'This sign-in session has expired. Start again to continue.',
    }
  }

  if (!/^\d{6}$/.test(code)) {
    return {
      status: 'error',
      message: 'Enter the 6-digit verification code.',
    }
  }

  try {
    let challenge = await requestChallenge(transaction, {
      component: 'ak-stage-authenticator-validate',
      code,
      ...(transaction.selectedOtpChallenge
        ? { selected_challenge: transaction.selectedOtpChallenge }
        : {}),
    })

    for (let i = 0; i < MAX_FLOW_CONTINUATIONS; i++) {
      if (isFinalFlowRedirectChallenge(challenge)) {
        clearAuthentikFlowTransaction()
        return { status: 'redirect', to: oidcAuthorizeUrl(transaction) }
      }

      const redirect = resolveRedirect(challenge)
      if (redirect) {
        clearAuthentikFlowTransaction()
        return { status: 'redirect', to: redirect }
      }

      if (isHostedUiRedirectChallenge(challenge)) {
        challenge = await requestChallenge(transaction)
        continue
      }

      if (challenge.component === 'ak-stage-user-login') {
        challenge = await requestChallenge(transaction, {
          component: 'ak-stage-user-login',
        })
        continue
      }

      if (
        challenge.component === 'ak-stage-authenticator-validate' ||
        challenge.response_errors
      ) {
        return {
          status: 'error',
          message: publicErrorForChallenge(challenge, GENERIC_OTP_ERROR),
        }
      }

      if (
        challenge.component === 'ak-stage-access-denied' ||
        challenge.component === 'ak-stage-flow-error'
      ) {
        clearAuthentikFlowTransaction()
        return {
          status: 'expired',
          message: publicErrorForChallenge(
            challenge,
            'This sign-in session has expired. Start again to continue.'
          ),
        }
      }

      clearAuthentikFlowTransaction()
      return {
        status: 'expired',
        message: unsupportedComponentMessage(challenge),
      }
    }

    clearAuthentikFlowTransaction()
    return {
      status: 'expired',
      message: publicErrorForChallenge(
        challenge,
        'This sign-in session has expired. Start again to continue.'
      ),
    }
  } catch (error) {
    const message =
      error instanceof AuthentikFlowError
        ? error.message
        : GENERIC_NETWORK_ERROR
    return {
      status: message.includes('expired') ? 'expired' : 'error',
      message,
    }
  }
}
