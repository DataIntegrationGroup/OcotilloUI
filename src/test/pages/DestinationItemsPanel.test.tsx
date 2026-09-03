// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DestinationItemsPanel } from '@/pages/access/destinations/DestinationItemsPanel'
import { type Destination, zDestination } from '@/utils/accessDestinations'

const { usePublishedThingsMock } = vi.hoisted(() => ({
  usePublishedThingsMock: vi.fn(),
}))

vi.mock('@/hooks', () => ({
  usePublishedThings: (...args: unknown[]) => usePublishedThingsMock(...args),
}))

// The map is not exercised in jsdom — stub the renderer and its layers so the
// panel's data plumbing is what the test sees.
vi.mock('@/components', () => ({
  MapComponent: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="map">{children}</div>
  ),
}))

vi.mock('react-map-gl/maplibre', () => ({
  Source: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Layer: () => null,
  Popup: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

vi.mock('@refinedev/core', () => ({
  Link: ({ children }: { children?: React.ReactNode }) => (
    <a href="/">{children}</a>
  ),
}))

const destination = (): Destination =>
  zDestination.parse({
    id: 1,
    slug: 'ngwmn',
    name: 'National Ground-Water Monitoring Network',
    destination_kind: 'harvester',
    description: null,
    active: true,
  })

const items = (over: Partial<Record<string, unknown>> = {}) => ({
  data: undefined,
  isLoading: false,
  isError: false,
  error: null,
  ...over,
})

beforeEach(() => {
  usePublishedThingsMock.mockReset()
})

describe('DestinationItemsPanel', () => {
  it('shows a loading state', () => {
    usePublishedThingsMock.mockReturnValue(items({ isLoading: true }))
    render(<DestinationItemsPanel destination={destination()} />)

    expect(screen.getByText('Loading published items...')).toBeInTheDocument()
  })

  it('reports an empty destination without a grid', () => {
    usePublishedThingsMock.mockReturnValue(items({ data: [] }))
    render(<DestinationItemsPanel destination={destination()} />)

    expect(screen.getByText(/Nothing is published/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export csv/i })).toBeDisabled()
  })

  it('renders the map, the item count, and grid rows', () => {
    usePublishedThingsMock.mockReturnValue(
      items({
        data: [
          {
            thing_id: 7,
            data_types: ['water level'],
            properties: { name: 'Well 7' },
            location: { longitude: -106, latitude: 35 },
          },
        ],
      })
    )
    render(<DestinationItemsPanel destination={destination()} />)

    expect(screen.getByTestId('map')).toBeInTheDocument()
    expect(screen.getByText('1 items')).toBeInTheDocument()
    expect(screen.getByText('Well 7')).toBeInTheDocument()
  })

  it('exports a CSV of the published items', async () => {
    const user = userEvent.setup()
    const createObjectURL = vi.fn(() => 'blob:published')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    })
    usePublishedThingsMock.mockReturnValue(
      items({
        data: [
          {
            thing_id: 7,
            data_types: ['water level'],
            properties: { name: 'Well 7' },
            location: { longitude: -106, latitude: 35 },
          },
        ],
      })
    )
    render(<DestinationItemsPanel destination={destination()} />)

    await user.click(screen.getByRole('button', { name: /export csv/i }))
    expect(createObjectURL).toHaveBeenCalledTimes(1)

    vi.unstubAllGlobals()
  })
})
