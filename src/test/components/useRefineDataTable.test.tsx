// @vitest-environment jsdom

import type { CrudFilter } from '@refinedev/core'
import type { ColumnDef } from '@tanstack/react-table'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const captureEvent = vi.fn()

vi.mock('@/analytics/posthog', () => ({
  captureEvent: (...args: unknown[]) => captureEvent(...args),
}))

import { useRefineDataTable } from '@/components/DataTable/useRefineDataTable'

type Well = { id: number; name: string; well_depth: number | null }

const columns: ColumnDef<Well, unknown>[] = [
  {
    id: 'name',
    accessorFn: (well) => well.name,
    meta: { label: 'Name', filter: { type: 'text' } },
  },
  {
    id: 'thing_type',
    accessorFn: (well) => well.name,
    meta: {
      label: 'Type',
      filter: { type: 'select', options: [{ label: 'Well', value: 'well' }] },
    },
  },
  {
    id: 'well_depth',
    accessorFn: (well) => well.well_depth,
    meta: {
      label: 'Depth',
      filter: { type: 'number', defaultOperator: 'gte' },
    },
  },
]

function makeRefineTable(overrides: Record<string, unknown> = {}) {
  return {
    sorters: [],
    setSorters: vi.fn(),
    filters: [] as CrudFilter[],
    setFilters: vi.fn(),
    currentPage: 1,
    setCurrentPage: vi.fn(),
    pageSize: 50,
    setPageSize: vi.fn(),
    result: { data: [], total: 137 },
    ...overrides,
    // biome-ignore lint/suspicious/noExplicitAny: test double for Refine's useTable
  } as any
}

const renderGlue = (refineTable: ReturnType<typeof makeRefineTable>) =>
  renderHook(() =>
    useRefineDataTable<Well>({
      refineTable,
      columns,
      permanentFilters: [{ field: 'groups', operator: 'eq', value: '42' }],
      analyticsPrefix: 'wells',
    })
  )

describe('useRefineDataTable', () => {
  beforeEach(() => {
    captureEvent.mockClear()
  })

  it('maps Refine sorters and pagination into table state', () => {
    const refineTable = makeRefineTable({
      sorters: [{ field: 'created_at', order: 'desc' }],
      currentPage: 3,
    })

    const { result } = renderGlue(refineTable)

    expect(result.current.state.sorting).toEqual([
      { id: 'created_at', desc: true },
    ])
    expect(result.current.state.pagination).toEqual({
      pageIndex: 2,
      pageSize: 50,
    })
    expect(result.current.rowCount).toBe(137)
    expect(result.current.manualPagination).toBe(true)
  })

  it('hides permanent filters from the column filter state', () => {
    const refineTable = makeRefineTable({
      filters: [
        { field: 'groups', operator: 'eq', value: '42' },
        { field: 'name', operator: 'contains', value: 'SR-' },
      ],
    })

    const { result } = renderGlue(refineTable)

    expect(result.current.state.columnFilters).toEqual([
      { id: 'name', value: 'SR-' },
    ])
  })

  it('rebuilds comparison filters as operator/value pairs', () => {
    const refineTable = makeRefineTable({
      filters: [{ field: 'well_depth', operator: 'gte', value: 100 }],
    })

    const { result } = renderGlue(refineTable)

    expect(result.current.state.columnFilters).toEqual([
      { id: 'well_depth', value: { operator: 'gte', value: '100' } },
    ])
  })

  it('sends sorting changes to Refine and reports them', () => {
    const refineTable = makeRefineTable()
    const { result } = renderGlue(refineTable)

    act(() => {
      result.current.onSortingChange([{ id: 'name', desc: true }])
    })

    expect(refineTable.setSorters).toHaveBeenCalledWith([
      { field: 'name', order: 'desc' },
    ])
    expect(captureEvent).toHaveBeenCalledWith('wells_sorted', {
      field: 'name',
      direction: 'desc',
    })
    // Re-ordering invalidates the page the user was on.
    expect(refineTable.setCurrentPage).toHaveBeenCalledWith(1)
  })

  it('converts column filters to CrudFilters using the column operator', () => {
    const refineTable = makeRefineTable()
    const { result } = renderGlue(refineTable)

    act(() => {
      result.current.onColumnFiltersChange([
        { id: 'name', value: 'SR-' },
        { id: 'thing_type', value: 'well' },
        { id: 'well_depth', value: { operator: 'lte', value: '250' } },
      ])
    })

    expect(refineTable.setFilters).toHaveBeenCalledWith(
      [
        { field: 'name', operator: 'contains', value: 'SR-' },
        { field: 'thing_type', operator: 'eq', value: 'well' },
        { field: 'well_depth', operator: 'lte', value: '250' },
      ],
      'replace'
    )
    // Filtering changes the result set, so paging restarts.
    expect(refineTable.setCurrentPage).toHaveBeenCalledWith(1)
  })

  it('resets to the first page when the page size changes', () => {
    const refineTable = makeRefineTable({ currentPage: 4 })
    const { result } = renderGlue(refineTable)

    act(() => {
      result.current.onPaginationChange({ pageIndex: 3, pageSize: 100 })
    })

    expect(refineTable.setPageSize).toHaveBeenCalledWith(100)
    expect(refineTable.setCurrentPage).toHaveBeenCalledWith(1)
  })

  it('moves pages without touching the page size', () => {
    const refineTable = makeRefineTable()
    const { result } = renderGlue(refineTable)

    act(() => {
      result.current.onPaginationChange({ pageIndex: 2, pageSize: 50 })
    })

    expect(refineTable.setPageSize).not.toHaveBeenCalled()
    expect(refineTable.setCurrentPage).toHaveBeenCalledWith(3)
  })

  it('reports hidden columns when visibility changes', () => {
    const { result } = renderGlue(makeRefineTable())

    act(() => {
      result.current.onColumnVisibilityChange({ well_depth: false })
    })

    expect(captureEvent).toHaveBeenCalledWith(
      'wells_column_visibility_changed',
      { hidden_count: 1, hidden_columns: ['well_depth'] }
    )
    expect(result.current.state.columnVisibility).toEqual({
      well_depth: false,
    })
  })
})
