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
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ component: 'ak-stage-identification' })
      )
      .mockResolvedValueOnce(jsonResponse({ component: 'ak-stage-password' }))
      .mockResolvedValueOnce(
        jsonResponse({ component: 'ak-stage-authenticator-validate' })
      )
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

    const otp = await submitAuthentikOtp('123456')

    expect(otp).toEqual({
      status: 'redirect',
      to: 'http://localhost:3000/callback?code=abc&state=state',
    })
    expect(authentikFlowStore.transaction).toBeNull()
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining(
        '/api/v3/flows/executor/default-authentication-flow/'
      ),
      expect.objectContaining({
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

  it('supports identification stages that collect password directly', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          component: 'ak-stage-identification',
          password_fields: true,
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({ component: 'ak-stage-authenticator-validate' })
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
    ).resolves.toMatchObject({ status: 'otp_required' })

    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          component: 'ak-stage-identification',
          uid_field: 'user@example.com',
          password: 'password',
        }),
      })
    )
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
})
