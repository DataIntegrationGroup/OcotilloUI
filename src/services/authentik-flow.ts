import {
  AUTHENTIK_AUTH_FLOW_SLUG,
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
  selectedOtpChallenge?: Record<string, unknown>
}

export type LoginFlowResult =
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
const OTP_DEVICE_CLASSES = new Set(['totp', 'static', 'sms', 'email'])
const MAX_FLOW_CONTINUATIONS = 8

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

const requestChallenge = async (
  transaction: AuthentikFlowTransaction,
  body?: Record<string, unknown>
): Promise<AuthentikChallenge> => {
  const response = await fetch(executorUrl(transaction).toString(), {
    method: body ? 'POST' : 'GET',
    credentials: 'include',
    redirect: 'follow',
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

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
    return new URL(to, buildAuthentikUrl('').origin).toString()
  } catch {
    return to
  }
}

const resolveRedirect = (challenge: AuthentikChallenge): string | null =>
  challenge.component === 'xak-flow-redirect' &&
  typeof challenge.to === 'string'
    ? normalizeRedirect(challenge.to)
    : null

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

const continueFlowAfterChallenge = async (
  transaction: AuthentikFlowTransaction,
  challenge: AuthentikChallenge
): Promise<LoginFlowResult> => {
  let current = challenge

  for (let i = 0; i < MAX_FLOW_CONTINUATIONS; i++) {
    const redirect = resolveRedirect(current)
    if (redirect) {
      clearAuthentikFlowTransaction()
      return { status: 'redirect', to: redirect }
    }

    if (current.component === 'ak-stage-authenticator-validate') {
      return prepareOtpTransaction(transaction, current)
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

  try {
    const { query, state } = await buildAuthorizeQuery()
    const transaction: AuthentikFlowTransaction = {
      flowSlug: AUTHENTIK_AUTH_FLOW_SLUG,
      query,
      state,
    }

    authentikFlowStore.transaction = transaction

    let challenge = await requestChallenge(transaction)

    for (let i = 0; i < MAX_FLOW_CONTINUATIONS; i++) {
      if (challenge.component === 'ak-stage-identification') {
        challenge = await requestChallenge(transaction, {
          component: 'ak-stage-identification',
          uid_field: trimmedUsername,
        })
        continue
      }

      if (challenge.component === 'ak-stage-password') {
        challenge = await requestChallenge(transaction, {
          component: 'ak-stage-password',
          password,
        })
        return continueFlowAfterChallenge(transaction, challenge)
      }

      return continueFlowAfterChallenge(transaction, challenge)
    }

    return {
      status: 'error',
      message: 'Authentik did not request the expected password challenge.',
    }
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
      const redirect = resolveRedirect(challenge)
      if (redirect) {
        clearAuthentikFlowTransaction()
        return { status: 'redirect', to: redirect }
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
