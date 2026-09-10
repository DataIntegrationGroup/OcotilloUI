// @vitest-environment jsdom
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiKeysCard } from '@/pages/settings/ApiKeysCard'
import { type ApiKey, zApiKey } from '@/utils/apiKeys'

const { useApiKeysMock, createMutateMock, renameMutateMock, revokeMutateMock } =
  vi.hoisted(() => ({
    useApiKeysMock: vi.fn(),
    createMutateMock: vi.fn(),
    renameMutateMock: vi.fn(),
    revokeMutateMock: vi.fn(),
  }))

vi.mock('@/hooks', () => ({
  useApiKeys: () => useApiKeysMock(),
  useCreateApiKey: () => ({
    mutate: createMutateMock,
    isPending: false,
    isError: false,
    error: null,
  }),
  useRenameApiKey: () => ({
    mutate: renameMutateMock,
    isPending: false,
    isError: false,
    error: null,
  }),
  useRevokeApiKey: () => ({
    mutate: revokeMutateMock,
    isPending: false,
    isError: false,
    error: null,
  }),
}))

const now = new Date('2026-08-23T12:00:00Z')

const key = (overrides: Partial<ApiKey> = {}): ApiKey =>
  zApiKey.parse({
    id: 1,
    name: 'Field laptop',
    token_preview: 'ocot_abcde…mnop',
    scope: 'ogc_internal',
    created_at: '2026-08-23T12:00:00.000Z',
    expires_at: '2026-11-21T12:00:00.000Z',
    last_used_at: null,
    revoked_at: null,
    ...overrides,
  })

const listed = (rows: ApiKey[]) => ({
  data: rows,
  isLoading: false,
  isError: false,
  error: null,
})

beforeEach(() => {
  useApiKeysMock.mockReset().mockReturnValue(listed([]))
  createMutateMock.mockReset()
  renameMutateMock.mockReset()
  revokeMutateMock.mockReset()
})

describe('ApiKeysCard', () => {
  it('explains the missing group instead of hiding the card', () => {
    useApiKeysMock.mockReturnValue(listed([key()]))
    render(<ApiKeysCard canManageKeys={false} />)

    expect(screen.getByText(/limited to accounts in the/)).toBeInTheDocument()
    expect(screen.getByText('OGC.Internal')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Generate key' })
    ).not.toBeInTheDocument()
    // No key data leaks into the gated state either.
    expect(screen.queryByText('Field laptop')).not.toBeInTheDocument()
  })

  it('says what a key reaches', () => {
    render(<ApiKeysCard canManageKeys />)

    expect(
      screen.getByText(/internal OGC collections and nothing else/)
    ).toBeInTheDocument()
    expect(screen.getByText(/No keys yet/)).toBeInTheDocument()
  })

  it('surfaces a failure to load rather than showing an empty table', () => {
    useApiKeysMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('404 Not Found'),
    })
    render(<ApiKeysCard canManageKeys />)

    expect(screen.getByText(/Failed to load your keys/)).toBeInTheDocument()
    expect(screen.getByText(/404 Not Found/)).toBeInTheDocument()
  })

  it('lists existing keys by preview, never a full token', () => {
    useApiKeysMock.mockReturnValue(listed([key()]))
    render(<ApiKeysCard canManageKeys now={() => now} />)

    expect(screen.getByText('Field laptop')).toBeInTheDocument()
    expect(screen.getByText('ocot_abcde…mnop')).toBeInTheDocument()
    expect(screen.getByText('Never used')).toBeInTheDocument()
  })

  it('issues a key and shows the token once', async () => {
    const user = userEvent.setup()
    render(<ApiKeysCard canManageKeys now={() => now} />)

    await user.click(screen.getByRole('button', { name: 'Generate key' }))
    await user.type(screen.getByLabelText('Key name'), 'QGIS at the office')
    await user.click(screen.getByRole('button', { name: 'Generate' }))

    expect(createMutateMock).toHaveBeenCalledWith(
      { name: 'QGIS at the office' },
      expect.anything()
    )

    // The card shows what the create response carried, which is the only time
    // the token exists outside the server.
    const [, options] = createMutateMock.mock.calls.at(-1) ?? []
    const created = {
      ...key({ id: 2, name: 'QGIS at the office' }),
      token: 'ocot_abcdefghijklmnopqrstuvwxyz012345',
    }
    // The state this drives is React's, so it has to settle before the reveal
    // dialog can be queried.
    await act(async () => {
      options.onSuccess(created)
    })

    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText(/only time the full key/)
    ).toBeInTheDocument()
    expect(within(dialog).getByText(created.token)).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Done' }))

    expect(screen.queryByText(created.token)).not.toBeInTheDocument()
  })

  it('will not generate a key without a name', async () => {
    const user = userEvent.setup()
    render(<ApiKeysCard canManageKeys now={() => now} />)

    await user.click(screen.getByRole('button', { name: 'Generate key' }))

    expect(screen.getByRole('button', { name: 'Generate' })).toBeDisabled()
    expect(createMutateMock).not.toHaveBeenCalled()
  })

  it('renames a key by id', async () => {
    const user = userEvent.setup()
    useApiKeysMock.mockReturnValue(listed([key({ id: 7 })]))
    render(<ApiKeysCard canManageKeys now={() => now} />)

    await user.click(
      screen.getByRole('button', { name: 'Rename Field laptop' })
    )
    const field = screen.getByLabelText('Key name')
    await user.clear(field)
    await user.type(field, 'Field tablet')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(renameMutateMock).toHaveBeenCalledWith(
      { id: 7, name: 'Field tablet' },
      expect.anything()
    )
  })

  it('revokes a key only after confirmation', async () => {
    const user = userEvent.setup()
    useApiKeysMock.mockReturnValue(listed([key({ id: 7 })]))
    render(<ApiKeysCard canManageKeys now={() => now} />)

    await user.click(
      screen.getByRole('button', { name: 'Revoke Field laptop' })
    )
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
    expect(revokeMutateMock).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', { name: 'Revoke Field laptop' })
    )
    await user.click(screen.getByRole('button', { name: 'Revoke key' }))

    expect(revokeMutateMock).toHaveBeenCalledWith(7, expect.anything())
  })

  it('explains the ArcGIS Pro connection, URL and all', async () => {
    const user = userEvent.setup()
    render(<ApiKeysCard canManageKeys now={() => now} />)

    await user.click(
      screen.getByRole('button', { name: 'Connecting from ArcGIS Pro' })
    )

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/\/ogcapi-internal$/)).toBeInTheDocument()
    expect(
      within(dialog).getByText(/Server Authentication/)
    ).toBeInTheDocument()
    // The fallback, and why it is the fallback.
    expect(
      within(dialog).getByText(/custom request parameter/)
    ).toBeInTheDocument()
  })

  it('warns on a key that is close to expiring', () => {
    useApiKeysMock.mockReturnValue(
      listed([key({ expires_at: '2026-08-26T12:00:00.000Z' })])
    )
    render(<ApiKeysCard canManageKeys now={() => now} />)

    expect(screen.getByText('Expires in 3 days')).toBeInTheDocument()
  })

  it('marks an expired key and disables its actions', () => {
    useApiKeysMock.mockReturnValue(
      listed([key({ name: 'Old key', expires_at: '2026-01-31T00:00:00.000Z' })])
    )
    render(<ApiKeysCard canManageKeys now={() => now} />)

    expect(screen.getByText('Expired')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Rename Old key' })
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Revoke Old key' })
    ).toBeDisabled()
  })

  it('disables the actions on an already revoked key', () => {
    useApiKeysMock.mockReturnValue(
      listed([key({ revoked_at: '2026-08-24T09:00:00.000Z' })])
    )
    render(<ApiKeysCard canManageKeys now={() => now} />)

    expect(
      screen.getByRole('button', { name: 'Rename Field laptop' })
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Revoke Field laptop' })
    ).toBeDisabled()
  })
})
