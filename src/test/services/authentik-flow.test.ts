// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.doMock('@/utils/Auth', () => ({
  generateCodeChallenge: vi.fn(async () => 'challenge'),
  generateCodeVerifier: vi.fn(() => 'verifier'),
  generateOAuthState: vi.fn(() => 'state'),
}))

vi.doUnmock('@/providers/authentik-provider')

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

describe('authentik flow service', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('submits username and password, preserves transaction, and accepts OTP', async () => {
    const selectedChallenge = {
      device_class: 'totp',
      device_uid: 'device-1',
      challenge: {},
      last_used: null,
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ component: 'ak-stage-identification' })
      )
      .mockResolvedValueOnce(jsonResponse({ component: 'ak-stage-password' }))
      .mockResolvedValueOnce(
        jsonResponse({
          component: 'ak-stage-authenticator-validate',
          device_challenges: [selectedChallenge],
        })
      )
      .mockResolvedValueOnce(jsonResponse({ component: 'ak-stage-user-login' }))
      .mockResolvedValueOnce(
        jsonResponse({
          component: 'xak-flow-redirect',
          to: 'http://localhost:3000/callback?code=abc&state=state',
        })
      )
    vi.stubGlobal('fetch', fetchMock)

    const { authentikFlowStore, startAuthentikLoginFlow, submitAuthentikOtp } =
      await import('@/services/authentik-flow')

    const login = await startAuthentikLoginFlow({
      username: 'user@example.com',
      password: 'password',
    })

    expect(login.status).toBe('otp_required')
    expect(authentikFlowStore.transaction?.state).toBe('state')
    expect(authentikFlowStore.transaction?.selectedOtpChallenge).toEqual(
      selectedChallenge
    )

    const otp = await submitAuthentikOtp('123456')

    expect(otp).toEqual({
      status: 'redirect',
      to: 'http://localhost:3000/callback?code=abc&state=state',
    })
    expect(authentikFlowStore.transaction).toBeNull()
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining(
        '/api/v3/flows/executor/default-authentication-flow/'
      ),
      expect.objectContaining({
        body: JSON.stringify({
          component: 'ak-stage-authenticator-validate',
          code: '123456',
          selected_challenge: selectedChallenge,
        }),
        credentials: 'include',
        method: 'POST',
      })
    )
  })

  it('returns a public error for bad credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({ component: 'ak-stage-identification' })
        )
        .mockResolvedValueOnce(jsonResponse({ component: 'ak-stage-password' }))
        .mockResolvedValueOnce(
          jsonResponse({
            component: 'ak-stage-password',
            response_errors: {
              password: [{ string: 'Invalid password', code: 'invalid' }],
            },
          })
        )
    )

    const { startAuthentikLoginFlow } = await import(
      '@/services/authentik-flow'
    )

    const result = await startAuthentikLoginFlow({
      username: 'user@example.com',
      password: 'bad',
    })

    expect(result).toEqual({
      status: 'error',
      message: 'Invalid password',
    })
  })

  it('does not submit password to the identification stage', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          component: 'ak-stage-identification',
          password_fields: true,
        })
      )
      .mockResolvedValueOnce(jsonResponse({ component: 'ak-stage-password' }))
      .mockResolvedValueOnce(jsonResponse({ component: 'ak-stage-user-login' }))
      .mockResolvedValueOnce(
        jsonResponse({
          component: 'xak-flow-redirect',
          to: 'http://localhost:3000/callback?code=abc&state=state',
        })
      )
    vi.stubGlobal('fetch', fetchMock)

    const { startAuthentikLoginFlow } = await import(
      '@/services/authentik-flow'
    )

    await expect(
      startAuthentikLoginFlow({
        username: 'user@example.com',
        password: 'password',
      })
    ).resolves.toMatchObject({ status: 'redirect' })

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          component: 'ak-stage-identification',
          uid_field: 'user@example.com',
        }),
      })
    )
  })

  it('reports multiple authenticator choices without guessing', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({ component: 'ak-stage-identification' })
        )
        .mockResolvedValueOnce(jsonResponse({ component: 'ak-stage-password' }))
        .mockResolvedValueOnce(
          jsonResponse({
            component: 'ak-stage-authenticator-validate',
            device_challenges: [
              { device_class: 'totp', device_uid: 'totp-1' },
              { device_class: 'email', device_uid: 'email-1' },
            ],
          })
        )
    )

    const { startAuthentikLoginFlow } = await import(
      '@/services/authentik-flow'
    )

    await expect(
      startAuthentikLoginFlow({
        username: 'user@example.com',
        password: 'password',
      })
    ).resolves.toEqual({
      status: 'error',
      message:
        'Multiple authenticator choices are available. This page does not support choosing one yet.',
    })
  })

  it('returns an OTP error for invalid codes', async () => {
    sessionStorage.setItem(
      'authentik_flow_transaction',
      JSON.stringify({
        flowSlug: 'default-authentication-flow',
        query: 'client_id=authentik&state=state',
        state: 'state',
      })
    )
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(
        jsonResponse({
          component: 'ak-stage-authenticator-validate',
          response_errors: {
            code: [{ string: 'Invalid code', code: 'invalid' }],
          },
        })
      )
    )

    const { submitAuthentikOtp } = await import('@/services/authentik-flow')

    await expect(submitAuthentikOtp('123456')).resolves.toEqual({
      status: 'error',
      message: 'Invalid code',
    })
  })

  it('detects an expired OTP transaction', async () => {
    const { submitAuthentikOtp } = await import('@/services/authentik-flow')

    await expect(submitAuthentikOtp('123456')).resolves.toEqual({
      status: 'expired',
      message: 'This sign-in session has expired. Start again to continue.',
    })
  })

  it('handles network failures without leaking details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('CORS')))

    const { startAuthentikLoginFlow } = await import(
      '@/services/authentik-flow'
    )

    await expect(
      startAuthentikLoginFlow({
        username: 'user@example.com',
        password: 'password',
      })
    ).resolves.toEqual({
      status: 'error',
      message: 'Authentik is unavailable. Check your connection and try again.',
    })
  })

  it('builds a password recovery URL with PKCE authorize parameters', async () => {
    const { buildAuthentikPasswordRecoveryUrl } = await import(
      '@/services/authentik-flow'
    )

    const recoveryUrl = new URL(await buildAuthentikPasswordRecoveryUrl())

    expect(recoveryUrl.pathname).toBe('/if/flow/password-recovery-flow/')
    expect(recoveryUrl.searchParams.get('client_id')).toBeTruthy()
    expect(recoveryUrl.searchParams.get('redirect_uri')).toContain('/callback')
    expect(recoveryUrl.searchParams.get('response_type')).toBe('code')
    expect(recoveryUrl.searchParams.get('code_challenge')).toBe('challenge')
    expect(recoveryUrl.searchParams.get('code_challenge_method')).toBe('S256')
    expect(recoveryUrl.searchParams.get('state')).toBe('state')
    expect(sessionStorage.getItem('pkce_code_verifier')).toBe('verifier')
  })
})
