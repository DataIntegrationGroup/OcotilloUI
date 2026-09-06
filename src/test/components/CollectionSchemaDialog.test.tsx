// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CollectionSchemaDialog } from '@/components/CollectionSchemaDialog'
import { zCollectionSchema } from '@/utils/collectionSchema'

const { useCollectionSchemaMock } = vi.hoisted(() => ({
  useCollectionSchemaMock: vi.fn(),
}))

vi.mock('@/hooks', () => ({
  useCollectionSchema: (...args: unknown[]) => useCollectionSchemaMock(...args),
}))

const schema = zCollectionSchema.parse({
  type: 'object',
  title: 'Latest TDS (Water Wells)',
  properties: {
    geometry: { format: 'geometry-any', 'x-ogc-role': 'primary-geometry' },
    latest_tds_value: {
      type: 'number',
      title: 'Total dissolved solids',
      description: 'Most recent measured concentration.',
    },
    thing_type: {
      type: 'string',
      enum: ['water well', 'spring', 'piezometer'],
    },
  },
})

const loaded = {
  data: schema,
  isLoading: false,
  isError: false,
  error: null,
}

beforeEach(() => {
  useCollectionSchemaMock.mockReset()
  useCollectionSchemaMock.mockReturnValue(loaded)
})

const renderDialog = (overrides?: { open?: boolean }) =>
  render(
    <CollectionSchemaDialog
      open={overrides?.open ?? true}
      onClose={() => {}}
      collectionId="latest_tds_wells"
      title="Latest TDS"
    />
  )

describe('CollectionSchemaDialog', () => {
  it('renders the schema as a field table with titles and descriptions', () => {
    renderDialog()

    expect(screen.getByText('Latest TDS (Water Wells)')).toBeInTheDocument()
    expect(screen.getByText('latest_tds_value')).toBeInTheDocument()
    expect(screen.getByText('Total dissolved solids')).toBeInTheDocument()
    expect(
      screen.getByText('Most recent measured concentration.')
    ).toBeInTheDocument()
    expect(screen.getByText('3 fields')).toBeInTheDocument()
  })

  it('labels the geometry property from its format alone', () => {
    renderDialog()

    expect(screen.getByText('Geometry')).toBeInTheDocument()
    // Both the property name and its derived type label read `geometry`.
    expect(screen.getAllByText('geometry')).toHaveLength(2)
  })

  it('lists enum values as chips', () => {
    renderDialog()

    expect(screen.getByText('water well')).toBeInTheDocument()
    expect(screen.getByText('spring')).toBeInTheDocument()
  })

  it('switches to the raw JSON view', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: 'Raw JSON view' }))

    expect(
      screen.getByText(/"x-ogc-role": "primary-geometry"/)
    ).toBeInTheDocument()
  })

  it('shows a spinner while loading', () => {
    useCollectionSchemaMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    })
    renderDialog()

    expect(screen.getByText('Loading schema...')).toBeInTheDocument()
  })

  it('surfaces a fetch failure', () => {
    useCollectionSchemaMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('404 Not Found'),
    })
    renderDialog()

    expect(
      screen.getByText(/Failed to load the schema for this dataset/)
    ).toBeInTheDocument()
  })

  it('skips fetching while closed', () => {
    renderDialog({ open: false })

    expect(useCollectionSchemaMock).toHaveBeenCalledWith('latest_tds_wells', {
      enabled: false,
    })
  })
})
