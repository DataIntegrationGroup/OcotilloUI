// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccessConsentPage } from '@/pages/access/consent'
import {
  type PublicationConsent,
  zPublicationConsent,
} from '@/utils/accessConsent'
import { type Destination, zDestination } from '@/utils/accessDestinations'

const {
  useCanMock,
  useAccessConsentMock,
  useAccessDestinationsMock,
  createMutateMock,
  revokeMutateMock,
} = vi.hoisted(() => ({
  useCanMock: vi.fn(),
  useAccessConsentMock: vi.fn(),
  useAccessDestinationsMock: vi.fn(),
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
    Link: forwardRef<HTMLAnchorElement, { children: React.ReactNode }>(
      ({ children, ...props }, ref) => (
        <a href="/" ref={ref} {...props}>
          {children}
        </a>
      )
    ),
    useLocation: () => ({ pathname: '/access/consent' }),
  }
})

vi.mock('@/hooks', () => ({
  useAccessConsent: (...args: unknown[]) => useAccessConsentMock(...args),
  useThingSearch: () => ({
    options: [
      { id: 512, name: 'MG-030' },
      { id: 513, name: 'MG-031' },
    ],
    loading: false,
  }),
  useAccessDestinations: (...args: unknown[]) =>
    useAccessDestinationsMock(...args),
  useCreateConsent: () => ({
    mutate: createMutateMock,
    isPending: false,
    isError: false,
    error: null,
  }),
  useRevokeConsent: () => ({
    mutate: revokeMutateMock,
    isPending: false,
    isError: false,
    error: null,
    variables: undefined,
  }),
}))

const destination = (overrides: Partial<Destination> = {}): Destination =>
  zDestination.parse({
    id: 3,
    slug: 'ngwmn',
    name: 'NGWMN',
    destination_kind: 'harvester',
    description: null,
    active: true,
    ...overrides,
  })

const consent = (
  overrides: Partial<PublicationConsent> = {}
): PublicationConsent =>
  zPublicationConsent.parse({
    id: 5,
    thing_id: 42,
    destination_id: 3,
    data_type: 'water level',
    contact_id: null,
    recorded_by: 'admin@example.org',
    notes: 'agreed by phone',
    starts_at: '2026-01-01',
    ends_at: null,
    revoked_at: null,
    revoked_by: null,
    ...overrides,
  })

const ok = <T,>(data: T) => ({
  data,
  isLoading: false,
  isError: false,
  error: null,
})

const loadThing = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('Thing (PointID)'), '42')
  await user.keyboard('{Enter}')
}

beforeEach(() => {
  useCanMock.mockReset().mockReturnValue({
    data: { can: true },
    isLoading: false,
  })
  useAccessDestinationsMock.mockReset().mockReturnValue(ok([destination()]))
  useAccessConsentMock.mockReset().mockReturnValue(ok([]))
  createMutateMock.mockReset()
  revokeMutateMock.mockReset()
})

describe('AccessConsentPage', () => {
  it('asks for a thing id before querying, because the API requires one', () => {
    render(<AccessConsentPage />)

    expect(screen.getByText('Enter a thing id to begin')).toBeInTheDocument()
    expect(useAccessConsentMock).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ includeRevoked: false })
    )
  })

  it('loads consent for the entered thing on Enter', async () => {
    const user = userEvent.setup()
    useAccessConsentMock.mockReturnValue(ok([consent()]))
    render(<AccessConsentPage />)

    await loadThing(user)

    expect(useAccessConsentMock).toHaveBeenCalledWith(
      '42',
      expect.objectContaining({ includeRevoked: false })
    )
    expect(screen.getByText('water level')).toBeInTheDocument()
  })

  it('resolves the destination name from the id the row carries', async () => {
    const user = userEvent.setup()
    useAccessConsentMock.mockReturnValue(ok([consent()]))
    render(<AccessConsentPage />)

    await loadThing(user)

    expect(screen.getByText('NGWMN')).toBeInTheDocument()
  })

  it('falls back to the id when the destination is unknown', async () => {
    const user = userEvent.setup()
    useAccessDestinationsMock.mockReturnValue(ok([]))
    useAccessConsentMock.mockReturnValue(ok([consent()]))
    render(<AccessConsentPage />)

    await loadThing(user)

    expect(screen.getByText('Destination 3')).toBeInTheDocument()
  })

  it('names Bureau ownership rather than showing an empty contact', async () => {
    const user = userEvent.setup()
    useAccessConsentMock.mockReturnValue(ok([consent()]))
    render(<AccessConsentPage />)

    await loadThing(user)

    expect(screen.getByText('Bureau-owned')).toBeInTheDocument()
  })

  it('confirms before withdrawing, and says harvested copies stay', async () => {
    const user = userEvent.setup()
    useAccessConsentMock.mockReturnValue(ok([consent()]))
    render(<AccessConsentPage />)

    await loadThing(user)
    await user.click(screen.getByRole('button', { name: 'Withdraw' }))

    expect(revokeMutateMock).not.toHaveBeenCalled()
    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByText(/already harvested are not recalled/)
    ).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Withdraw' }))
    expect(revokeMutateMock).toHaveBeenCalledWith(5)
  })

  it('offers no withdraw control for consent already withdrawn', async () => {
    const user = userEvent.setup()
    useAccessConsentMock.mockReturnValue(
      ok([consent({ revoked_at: '2026-02-01T00:00:00Z' })])
    )
    render(<AccessConsentPage />)

    await loadThing(user)

    expect(screen.getByText('Revoked')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Withdraw' })
    ).not.toBeInTheDocument()
  })

  it('blocks recording consent when no destination exists', () => {
    useAccessDestinationsMock.mockReturnValue(ok([]))
    render(<AccessConsentPage />)

    expect(screen.getByText(/register one first/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /record consent/i })
    ).toBeDisabled()
  })

  it('records consent with a blank contact as Bureau-owned', async () => {
    const user = userEvent.setup()
    render(<AccessConsentPage />)

    await user.click(screen.getByRole('button', { name: /record consent/i }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Thing (PointID)'), '42')
    await user.click(within(dialog).getByRole('button', { name: 'Record' }))

    expect(createMutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        thing_id: 42,
        destination_slug: 'ngwmn',
        contact_id: null,
      }),
      expect.anything()
    )
  })

  it('blocks a consent when the typed text resolved to no thing', async () => {
    const user = userEvent.setup()
    render(<AccessConsentPage />)

    await user.click(screen.getByRole('button', { name: /record consent/i }))
    const dialog = screen.getByRole('dialog')
    // Half a PointID is not an id, and nothing was chosen from the list.
    await user.type(within(dialog).getByLabelText('Thing (PointID)'), 'abc')
    await user.click(within(dialog).getByRole('button', { name: 'Record' }))

    expect(createMutateMock).not.toHaveBeenCalled()
    expect(
      within(dialog).getByText(/thing id is required/i)
    ).toBeInTheDocument()
  })

  it('records consent against a thing chosen by PointID', async () => {
    const user = userEvent.setup()
    render(<AccessConsentPage />)

    await user.click(screen.getByRole('button', { name: /record consent/i }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Thing (PointID)'), 'MG-0')
    await user.click(await screen.findByRole('option', { name: 'MG-030' }))
    await user.click(within(dialog).getByRole('button', { name: 'Record' }))

    expect(createMutateMock).toHaveBeenCalledWith(
      expect.objectContaining({ thing_id: 512 }),
      expect.anything()
    )
  })
})
