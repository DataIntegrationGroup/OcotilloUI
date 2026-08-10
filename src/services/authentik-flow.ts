import {
  AUTHENTIK_AUTH_FLOW_SLUG,
  AUTHENTIK_SCOPE,
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
  flow_info?: FlowInfo
  response_errors?: Record<string, ResponseErrorDetail[] | string[]>
  error_message?: string
  to?: string
  password_fields?: boolean
  device_challenges?: Array<Record<string, unknown>>
}

export type AuthentikFlowTransaction = {
  flowSlug: string
  query: string
  state: string
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

  return (await response.json()) as AuthentikChallenge
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

const submitCredentials = async (
  transaction: AuthentikFlowTransaction,
  username: string,
  password: string
): Promise<AuthentikChallenge> => {
  let challenge = await requestChallenge(transaction)

  if (challenge.component === 'ak-stage-identification') {
    challenge = await requestChallenge(transaction, {
      component: 'ak-stage-identification',
      uid_field: username,
      ...(challenge.password_fields ? { password } : {}),
    })
  }

  if (challenge.component !== 'ak-stage-password') return challenge

  return requestChallenge(transaction, {
    component: 'ak-stage-password',
    password,
  })
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

    const nextChallenge = await submitCredentials(
      transaction,
      trimmedUsername,
      password
    )

    const redirect = resolveRedirect(nextChallenge)
    if (redirect) {
      clearAuthentikFlowTransaction()
      return { status: 'redirect', to: redirect }
    }

    if (nextChallenge.component === 'ak-stage-authenticator-validate') {
      authentikFlowStore.transaction = transaction
      return { status: 'otp_required', transaction }
    }

    return {
      status: 'error',
      message: publicErrorForChallenge(nextChallenge, GENERIC_AUTH_ERROR),
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
    const challenge = await requestChallenge(transaction, {
      component: 'ak-stage-authenticator-validate',
      code,
    })

    const redirect = resolveRedirect(challenge)
    if (redirect) {
      clearAuthentikFlowTransaction()
      return { status: 'redirect', to: redirect }
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
