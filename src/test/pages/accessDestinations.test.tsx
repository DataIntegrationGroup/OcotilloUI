// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccessDestinationsPage } from '@/pages/access/destinations'
import { type Destination, zDestination } from '@/utils/accessDestinations'

const {
  useCanMock,
  useAccessDestinationsMock,
  usePublishedThingsMock,
  createMutateMock,
} = vi.hoisted(() => ({
  useCanMock: vi.fn(),
  useAccessDestinationsMock: vi.fn(),
  usePublishedThingsMock: vi.fn(),
  createMutateMock: vi.fn(),
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
    useLocation: () => ({ pathname: '/access/destinations' }),
  }
})

vi.mock('@/hooks', () => ({
  useAccessDestinations: (...args: unknown[]) =>
    useAccessDestinationsMock(...args),
  usePublishedThings: (...args: unknown[]) => usePublishedThingsMock(...args),
  useCreateDestination: () => ({
    mutate: createMutateMock,
    isPending: false,
    isError: false,
    error: null,
  }),
}))

const destination = (overrides: Partial<Destination> = {}): Destination =>
  zDestination.parse({
    id: 1,
    slug: 'ngwmn',
    name: 'National Ground-Water Monitoring Network',
    destination_kind: 'harvester',
    description: 'Federal harvesting network.',
    active: true,
    ...overrides,
  })

const ok = <T,>(data: T) => ({
  data,
  isLoading: false,
  isError: false,
  error: null,
})

beforeEach(() => {
  useCanMock.mockReset().mockReturnValue({
    data: { can: true },
    isLoading: false,
  })
  useAccessDestinationsMock.mockReset().mockReturnValue(ok([destination()]))
  usePublishedThingsMock.mockReset().mockReturnValue(ok([]))
  createMutateMock.mockReset()
})

describe('AccessDestinationsPage', () => {
  it('refuses the console to a non-admin', () => {
    useCanMock.mockReturnValue({ data: { can: false }, isLoading: false })
    render(<AccessDestinationsPage />)

    expect(screen.getByText('not authorized')).toBeInTheDocument()
  })

  it('lists registered destinations', () => {
    render(<AccessDestinationsPage />)

    expect(
      screen.getByText('National Ground-Water Monitoring Network')
    ).toBeInTheDocument()
    expect(screen.getByText('ngwmn')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('marks a retired destination', () => {
    useAccessDestinationsMock.mockReturnValue(
      ok([destination({ active: false })])
    )
    render(<AccessDestinationsPage />)

    expect(screen.getByText('Retired')).toBeInTheDocument()
  })

  it('points at consent when nothing is published yet', async () => {
    const user = userEvent.setup()
    render(<AccessDestinationsPage />)

    await user.click(screen.getByRole('button', { name: 'Show' }))

    expect(
      screen.getByText(/Consent is what opens this up/)
    ).toBeInTheDocument()
  })

  it('explains an empty list for a retired destination differently', async () => {
    const user = userEvent.setup()
    useAccessDestinationsMock.mockReturnValue(
      ok([destination({ active: false })])
    )
    render(<AccessDestinationsPage />)

    await user.click(screen.getByRole('button', { name: 'Show' }))

    expect(
      screen.getByText(/retired, so it may read nothing/)
    ).toBeInTheDocument()
  })

  it('shows what a destination may read', async () => {
    const user = userEvent.setup()
    usePublishedThingsMock.mockReturnValue(
      ok([
        {
          thing_id: 42,
          data_types: ['water level', 'site metadata'],
          properties: {},
          location: {},
        },
      ])
    )
    render(<AccessDestinationsPage />)

    await user.click(screen.getByRole('button', { name: 'Show' }))

    expect(screen.getByText('thing 42')).toBeInTheDocument()
    expect(screen.getByText('water level')).toBeInTheDocument()
    expect(screen.getByText(/1 thing published to ngwmn/)).toBeInTheDocument()
  })

  it('registers a destination', async () => {
    const user = userEvent.setup()
    render(<AccessDestinationsPage />)

    await user.click(
      screen.getByRole('button', { name: /register destination/i })
    )
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Slug'), 'usgs')
    await user.type(within(dialog).getByLabelText('Name'), 'USGS')
    await user.click(within(dialog).getByRole('button', { name: 'Register' }))

    expect(createMutateMock).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'usgs', name: 'USGS' }),
      expect.anything()
    )
  })

  it('blocks a slug that would not survive a URL path', async () => {
    const user = userEvent.setup()
    render(<AccessDestinationsPage />)

    await user.click(
      screen.getByRole('button', { name: /register destination/i })
    )
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Slug'), 'Not A Slug')
    await user.type(within(dialog).getByLabelText('Name'), 'x')
    await user.click(within(dialog).getByRole('button', { name: 'Register' }))

    expect(createMutateMock).not.toHaveBeenCalled()
    expect(within(dialog).getByText(/lower-case letters/i)).toBeInTheDocument()
  })
})
