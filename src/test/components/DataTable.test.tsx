// @vitest-environment jsdom

import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

const navigate = vi.fn()

vi.mock('react-router', () => ({
  useNavigate: () => navigate,
}))

import { DataTable } from '@/components/DataTable/DataTable'

type Row = { id: number; name: string; depth: number | null }

const rows: Row[] = [
  { id: 1, name: 'Well A', depth: 120 },
  { id: 2, name: 'Well B', depth: null },
]

const columns = [
  {
    id: 'name',
    accessorFn: (row: Row) => row.name,
    header: 'Name',
    meta: { label: 'Name' },
  },
  {
    id: 'depth',
    accessorFn: (row: Row) => row.depth,
    header: 'Depth',
    cell: ({ getValue }: { getValue: () => unknown }) =>
      (getValue() as number | null) ?? '—',
    meta: { label: 'Depth', align: 'right' as const },
  },
]

function Harness({
  data = rows,
  ...props
}: { data?: Row[] } & Omit<
  React.ComponentProps<typeof DataTable<Row>>,
  'table'
>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
  })

  return <DataTable table={table} {...props} />
}

describe('DataTable', () => {
  it('renders a row per record with the column cells', () => {
    render(<Harness />)

    const [, firstRow, secondRow] = screen.getAllByRole('row')

    expect(within(firstRow).getByText('Well A')).toBeInTheDocument()
    expect(within(firstRow).getByText('120')).toBeInTheDocument()
    // Null values fall back to the placeholder rather than rendering blank.
    expect(within(secondRow).getByText('—')).toBeInTheDocument()
  })

  it('shows the empty message when there are no rows', () => {
    render(<Harness data={[]} emptyMessage="No wells match these filters." />)

    expect(
      screen.getByText('No wells match these filters.')
    ).toBeInTheDocument()
  })

  it('renders skeleton rows instead of data while loading', () => {
    render(<Harness isLoading skeletonRowCount={3} />)

    // Header plus the three placeholder rows, and no record content.
    expect(screen.getAllByRole('row')).toHaveLength(4)
    expect(screen.queryByText('Well A')).not.toBeInTheDocument()
  })

  it('navigates to the row href on click', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()

    render(
      <Harness
        rowHref={(row) => `/ocotillo/well/show/${row.id}`}
        onRowClick={onRowClick}
      />
    )

    await user.click(screen.getByText('Well A'))

    expect(onRowClick).toHaveBeenCalledWith(rows[0])
    expect(navigate).toHaveBeenCalledWith('/ocotillo/well/show/1')
  })

  it('opens the row in a new window for a modifier click', async () => {
    const user = userEvent.setup()
    const open = vi.fn().mockReturnValue({ opener: {} })
    vi.stubGlobal('open', open)
    navigate.mockClear()

    render(<Harness rowHref={(row) => `/ocotillo/well/show/${row.id}`} />)

    await user.keyboard('{Meta>}')
    await user.click(screen.getByText('Well B'))
    await user.keyboard('{/Meta}')

    expect(open).toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()

    vi.unstubAllGlobals()
  })

  it('marks the selected row', () => {
    render(<Harness isRowSelected={(row) => row.id === 2} />)

    const [, firstRow, secondRow] = screen.getAllByRole('row')

    expect(firstRow).not.toHaveAttribute('data-state', 'selected')
    expect(secondRow).toHaveAttribute('data-state', 'selected')
  })
})
