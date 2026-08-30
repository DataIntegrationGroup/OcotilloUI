// @vitest-environment jsdom
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
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
  useGroups: () => ({
    groups: [
      { id: 42, name: 'Roswell Basin' },
      { id: 7, name: 'Estancia Basin' },
    ],
    isLoading: false,
    options: [
      { value: '7', label: 'Estancia Basin' },
      { value: '42', label: 'Roswell Basin' },
    ],
  }),
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

  it('submits a UI surface grant as a global grant with no data type', async () => {
    const user = userEvent.setup()
    render(<AccessGrantsPage />)

    await user.click(screen.getByRole('button', { name: 'Grant access' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Principal'), 'ak-subject-9')

    await user.click(within(dialog).getByLabelText('Grant covers'))
    await user.click(screen.getByRole('option', { name: 'a screen' }))
    await user.click(within(dialog).getByLabelText('Screen'))
    await user.click(screen.getByRole('option', { name: 'ocotillo.lexicon' }))
    await user.click(within(dialog).getByRole('button', { name: 'Grant' }))

    expect(createMutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        principal_id: 'ak-subject-9',
        scope_type: 'global',
        scope_id: null,
        data_type: null,
        ui_surface: 'ocotillo.lexicon',
      }),
      expect.anything()
    )
  })

  it('will not submit a surface grant with no screen chosen', async () => {
    const user = userEvent.setup()
    render(<AccessGrantsPage />)

    await user.click(screen.getByRole('button', { name: 'Grant access' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Principal'), 'ak-subject-9')

    await user.click(within(dialog).getByLabelText('Grant covers'))
    await user.click(screen.getByRole('option', { name: 'a screen' }))
    await user.click(within(dialog).getByRole('button', { name: 'Grant' }))

    expect(createMutateMock).not.toHaveBeenCalled()
    expect(within(dialog).getByText(/screen is required/i)).toBeInTheDocument()
  })

  it('keeps the current filters after a grant is created', async () => {
    const user = userEvent.setup()
    render(<AccessGrantsPage />)

    await user.type(screen.getByLabelText('Principal'), 'ak-subject-1')
    await user.keyboard('{Enter}')

    await user.click(screen.getByRole('button', { name: 'Grant access' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Principal'), 'ak-subject-1')
    await user.click(within(dialog).getByRole('button', { name: 'Grant' }))

    const [, options] = createMutateMock.mock.calls.at(-1) ?? []
    await act(async () => {
      options.onSuccess(grant({ id: 9, principal_id: 'ak-subject-1' }))
    })

    // The list refetches under the same question the admin asked.
    expect(useAccessGrantsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ principalId: 'ak-subject-1' })
    )
    expect(screen.queryByText(/current filters do not show it/i)).toBeNull()
  })

  it('says so when the new grant lands outside the current filters', async () => {
    const user = userEvent.setup()
    render(<AccessGrantsPage />)

    await user.type(screen.getByLabelText('Principal'), 'ak-subject-1')
    await user.keyboard('{Enter}')

    await user.click(screen.getByRole('button', { name: 'Grant access' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Principal'), 'ak-subject-2')
    await user.click(within(dialog).getByRole('button', { name: 'Grant' }))

    const [, options] = createMutateMock.mock.calls.at(-1) ?? []
    await act(async () => {
      options.onSuccess(grant({ id: 9, principal_id: 'ak-subject-2' }))
    })

    expect(screen.getByText(/Granted to ak-subject-2/i)).toBeInTheDocument()
    // Still the admin's own filter until they ask for the new one.
    expect(useAccessGrantsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ principalId: 'ak-subject-1' })
    )

    await user.click(screen.getByRole('button', { name: 'Show it' }))

    expect(useAccessGrantsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ principalId: 'ak-subject-2' })
    )
    expect(screen.queryByText(/current filters do not show it/i)).toBeNull()
  })

  it('keeps a long reason on one line and shows it in a tooltip', async () => {
    const user = userEvent.setup()
    const reason = 'a'.repeat(300)
    useAccessGrantsMock.mockReturnValue({
      data: [grant({ id: 11, reason })],
      isLoading: false,
      isError: false,
      error: null,
    })
    render(<AccessGrantsPage />)

    const cell = screen.getByText(reason)
    // Tailwind's `truncate` is what holds the row to one line; jsdom loads no
    // stylesheet, so the class is the thing to assert.
    expect(cell).toHaveClass('truncate')

    // Radix opens on focus as well as hover, and focus is what jsdom drives
    // reliably — hover needs pointer events it does not implement.
    fireEvent.focus(cell)
    expect(await screen.findByRole('tooltip')).toHaveTextContent(reason)
  })

  it('tints a scoped grant row and leaves a global one plain', () => {
    useAccessGrantsMock.mockReturnValue({
      data: [
        grant({ id: 21, principal_id: 'scoped-one', scope_type: 'thing' }),
        grant({
          id: 22,
          principal_id: 'global-one',
          scope_type: 'global',
          scope_id: null,
        }),
      ],
      isLoading: false,
      isError: false,
      error: null,
    })
    render(<AccessGrantsPage />)

    const scopedRow = screen.getByText('scoped-one').closest('tr')
    const globalRow = screen.getByText('global-one').closest('tr')

    expect(scopedRow).toHaveClass('bg-warning/8')
    expect(globalRow).not.toHaveClass('bg-warning/8')
  })

  it('marks a screen grant apart from a data grant', async () => {
    const user = userEvent.setup()
    useAccessGrantsMock.mockReturnValue({
      data: [
        grant({
          id: 31,
          principal_id: 'screen-holder',
          data_type: null,
          ui_surface: 'ocotillo.lexicon',
        }),
        grant({
          id: 32,
          principal_id: 'data-holder',
          data_type: 'water level',
        }),
      ],
      isLoading: false,
      isError: false,
      error: null,
    })
    render(<AccessGrantsPage />)

    const screenRow = screen.getByText('screen-holder').closest('tr')
    const dataRow = screen.getByText('data-holder').closest('tr')

    const screenBadge = within(screenRow as HTMLElement).getByText(
      'ocotillo.lexicon'
    )
    const dataBadge = within(dataRow as HTMLElement).getByText('water level')

    expect(screenBadge).toBeInTheDocument()
    expect(dataBadge).toBeInTheDocument()

    fireEvent.focus(screenBadge)
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      /opens this nav item/i
    )
  })

  it('filters the table down to screen grants', async () => {
    const user = userEvent.setup()
    useAccessGrantsMock.mockReturnValue({
      data: [
        grant({
          id: 41,
          principal_id: 'screen-holder',
          data_type: null,
          ui_surface: 'ocotillo.lexicon',
        }),
        grant({
          id: 42,
          principal_id: 'data-holder',
          data_type: 'water level',
        }),
      ],
      isLoading: false,
      isError: false,
      error: null,
    })
    render(<AccessGrantsPage />)

    await user.click(screen.getByLabelText('Covers'))
    await user.click(screen.getByRole('option', { name: 'screen grants' }))

    expect(screen.getByText('screen-holder')).toBeInTheDocument()
    expect(screen.queryByText('data-holder')).toBeNull()
    expect(screen.getByText('1 shown')).toBeInTheDocument()
    // A screen grant has no data type, so that filter stops applying. MUI
    // renders the select as a combobox div, which carries aria-disabled.
    expect(screen.getByLabelText('Data type')).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })

  it('picks a group by name and sends its id', async () => {
    const user = userEvent.setup()
    render(<AccessGrantsPage />)

    await user.click(screen.getByRole('button', { name: 'Grant access' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Principal'), 'ak-subject-9')

    await user.click(within(dialog).getByLabelText('Scope'))
    await user.click(screen.getByRole('option', { name: 'group' }))
    await user.click(within(dialog).getByLabelText('Group'))
    await user.click(screen.getByRole('option', { name: 'Roswell Basin' }))
    await user.click(within(dialog).getByRole('button', { name: 'Grant' }))

    expect(createMutateMock).toHaveBeenCalledWith(
      expect.objectContaining({ scope_type: 'group', scope_id: 42 }),
      expect.anything()
    )
  })

  it('shows a group scope by name', () => {
    useAccessGrantsMock.mockReturnValue({
      data: [grant({ id: 51, scope_type: 'group', scope_id: 42 })],
      isLoading: false,
      isError: false,
      error: null,
    })
    render(<AccessGrantsPage />)

    expect(screen.getByText('group Roswell Basin')).toBeInTheDocument()
    expect(screen.queryByText('group 42')).toBeNull()
  })

  it('pages the table rather than rendering every grant', async () => {
    const user = userEvent.setup()
    useAccessGrantsMock.mockReturnValue({
      data: Array.from({ length: 30 }, (_, index) =>
        grant({
          id: 100 + index,
          principal_id: `holder-${String(index).padStart(2, '0')}`,
          starts_at: `2026-01-${String((index % 28) + 1).padStart(2, '0')}`,
        })
      ),
      isLoading: false,
      isError: false,
      error: null,
    })
    render(<AccessGrantsPage />)

    // 25 a page, so five rows wait on the second.
    expect(screen.getAllByText(/^holder-/)).toHaveLength(25)
    expect(screen.getByText('30 shown')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /next page/i }))

    expect(screen.getAllByText(/^holder-/)).toHaveLength(5)
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
