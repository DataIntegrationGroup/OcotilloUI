// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccessGrantsPage } from '@/pages/access/grants'
import { type PermissionGrant, zPermissionGrant } from '@/utils/accessGrants'

const { useCanMock, useAccessGrantsMock, createMutateMock, revokeMutateMock } =
  vi.hoisted(() => ({
    useCanMock: vi.fn(),
    useAccessGrantsMock: vi.fn(),
    createMutateMock: vi.fn(),
    revokeMutateMock: vi.fn(),
  }))

vi.mock('@refinedev/core', () => ({
  useCan: (...args: unknown[]) => useCanMock(...args),
}))

vi.mock('@refinedev/mui', () => ({
  ErrorComponent: () => <div>not authorized</div>,
}))

vi.mock('react-router', async () => {
  const { forwardRef } = await import('react')

  return {
    // MUI's Tab passes a ref through `component`, and the real react-router
    // Link is a forwardRef. A plain function here warns instead of rendering.
    Link: forwardRef<HTMLAnchorElement, { children: React.ReactNode }>(
      ({ children, ...props }, ref) => (
        <a href="/" ref={ref} {...props}>
          {children}
        </a>
      )
    ),
    useLocation: () => ({ pathname: '/access/grants' }),
  }
})

vi.mock('@/hooks', () => ({
  useAccessGrants: (...args: unknown[]) => useAccessGrantsMock(...args),
  useCreateGrant: () => ({
    mutate: createMutateMock,
    isPending: false,
    isError: false,
    error: null,
  }),
  useRevokeGrant: () => ({
    mutate: revokeMutateMock,
    isPending: false,
    isError: false,
    error: null,
    variables: undefined,
  }),
}))

const grant = (overrides: Partial<PermissionGrant> = {}): PermissionGrant =>
  zPermissionGrant.parse({
    id: 7,
    principal_type: 'user',
    principal_id: 'ak-subject-1',
    capability: 'read',
    scope_type: 'thing',
    scope_id: 42,
    data_type: 'water level',
    starts_at: '2026-01-01',
    ends_at: null,
    granted_by: 'admin@example.org',
    reason: 'monitoring agreement',
    revoked_at: null,
    revoked_by: null,
    ...overrides,
  })

const listResult = (rows: PermissionGrant[]) => ({
  data: rows,
  isLoading: false,
  isError: false,
  error: null,
})

beforeEach(() => {
  useCanMock.mockReset().mockReturnValue({
    data: { can: true },
    isLoading: false,
  })
  useAccessGrantsMock.mockReset().mockReturnValue(listResult([]))
  createMutateMock.mockReset()
  revokeMutateMock.mockReset()
})

describe('AccessGrantsPage', () => {
  it('refuses the page to a non-admin', () => {
    useCanMock.mockReturnValue({ data: { can: false }, isLoading: false })
    render(<AccessGrantsPage />)

    expect(screen.getByText('not authorized')).toBeInTheDocument()
  })

  it('loads every grant with no filters applied', () => {
    useAccessGrantsMock.mockReturnValue(listResult([grant()]))
    render(<AccessGrantsPage />)

    expect(useAccessGrantsMock).toHaveBeenCalledWith({})
    expect(screen.getByText('ak-subject-1')).toBeInTheDocument()
  })

  it('applies the typed principal only on Enter', async () => {
    const user = userEvent.setup()
    render(<AccessGrantsPage />)

    await user.type(screen.getByLabelText('Principal'), 'ak-subject-1')
    expect(useAccessGrantsMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ principalId: 'ak-subject-1' })
    )

    await user.keyboard('{Enter}')
    expect(useAccessGrantsMock).toHaveBeenCalledWith(
      expect.objectContaining({ principalId: 'ak-subject-1' })
    )
  })

  it('applies a dropdown filter immediately', async () => {
    const user = userEvent.setup()
    render(<AccessGrantsPage />)

    await user.click(screen.getByLabelText('Capability'))
    await user.click(screen.getByRole('option', { name: 'correct' }))

    expect(useAccessGrantsMock).toHaveBeenCalledWith(
      expect.objectContaining({ capability: 'correct' })
    )
  })

  it('sends no filter for the "Any" option', async () => {
    const user = userEvent.setup()
    render(<AccessGrantsPage />)

    await user.click(screen.getByLabelText('Data type'))
    await user.click(screen.getByRole('option', { name: 'water level' }))
    await user.click(screen.getByLabelText('Data type'))
    await user.click(screen.getByRole('option', { name: 'Any' }))

    expect(useAccessGrantsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ dataType: undefined })
    )
  })

  it('clears every filter at once', async () => {
    const user = userEvent.setup()
    render(<AccessGrantsPage />)

    await user.click(screen.getByLabelText('Scope'))
    await user.click(screen.getByRole('option', { name: 'group' }))
    await user.click(screen.getByRole('button', { name: /clear filters/i }))

    expect(useAccessGrantsMock).toHaveBeenLastCalledWith({})
  })

  it('renders a grant row with its principal, scope and status', () => {
    useAccessGrantsMock.mockReturnValue(listResult([grant()]))
    render(<AccessGrantsPage />)

    expect(screen.getByText('ak-subject-1')).toBeInTheDocument()
    expect(screen.getByText('thing 42')).toBeInTheDocument()
    expect(screen.getByText('monitoring agreement')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('says nothing matches when filters exclude everything', async () => {
    const user = userEvent.setup()
    render(<AccessGrantsPage />)

    await user.click(screen.getByLabelText('Capability'))
    await user.click(screen.getByRole('option', { name: 'administer' }))

    expect(screen.getByText('No grants match')).toBeInTheDocument()
  })

  it('distinguishes an empty catalogue from an empty filter result', () => {
    render(<AccessGrantsPage />)

    expect(screen.getByText('No grants yet')).toBeInTheDocument()
  })

  it('confirms before revoking, and revokes on confirmation', async () => {
    const user = userEvent.setup()
    useAccessGrantsMock.mockReturnValue(listResult([grant()]))
    render(<AccessGrantsPage />)

    await user.click(screen.getByRole('button', { name: 'Revoke' }))

    expect(revokeMutateMock).not.toHaveBeenCalled()
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Revoke this grant?')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Revoke' }))
    expect(revokeMutateMock).toHaveBeenCalledWith(7)
  })

  it('does not revoke when the confirmation is cancelled', async () => {
    const user = userEvent.setup()
    useAccessGrantsMock.mockReturnValue(listResult([grant()]))
    render(<AccessGrantsPage />)

    await user.click(screen.getByRole('button', { name: 'Revoke' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(revokeMutateMock).not.toHaveBeenCalled()
  })

  it('offers no revoke control for a grant already revoked', () => {
    useAccessGrantsMock.mockReturnValue(
      listResult([grant({ revoked_at: '2026-02-01T00:00:00Z' })])
    )
    render(<AccessGrantsPage />)

    expect(screen.getByText('Revoked')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Revoke' })
    ).not.toBeInTheDocument()
  })

  it('passes the include-revoked toggle through to the query', async () => {
    const user = userEvent.setup()
    render(<AccessGrantsPage />)

    await user.click(screen.getByRole('checkbox', { name: /include revoked/i }))

    await waitFor(() => {
      expect(useAccessGrantsMock).toHaveBeenCalledWith(
        expect.objectContaining({ includeRevoked: true })
      )
    })
  })

  it('submits a grant from the dialog', async () => {
    const user = userEvent.setup()
    render(<AccessGrantsPage />)

    await user.click(screen.getByRole('button', { name: 'Grant access' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Principal'), 'ak-subject-9')
    await user.click(within(dialog).getByRole('button', { name: 'Grant' }))

    expect(createMutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        principal_id: 'ak-subject-9',
        scope_type: 'global',
        scope_id: null,
      }),
      expect.anything()
    )
  })

  it('blocks a scoped grant that names no scope id', async () => {
    const user = userEvent.setup()
    render(<AccessGrantsPage />)

    await user.click(screen.getByRole('button', { name: 'Grant access' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Principal'), 'ak-subject-9')

    await user.click(within(dialog).getByLabelText('Scope'))
    await user.click(screen.getByRole('option', { name: 'thing' }))
    await user.click(within(dialog).getByRole('button', { name: 'Grant' }))

    expect(createMutateMock).not.toHaveBeenCalled()
    expect(
      within(dialog).getByText(/thing id is required/i)
    ).toBeInTheDocument()
  })
})
