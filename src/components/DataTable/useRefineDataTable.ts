import type {
  BaseRecord,
  CrudFilter,
  CrudOperators,
  HttpError,
  LogicalFilter,
  useTableReturnType,
} from '@refinedev/core'
import {
  type ColumnDef,
  type ColumnFiltersState,
  functionalUpdate,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { useCallback, useMemo, useState } from 'react'
import { captureEvent } from '@/analytics/posthog'
import {
  type DataTableComparisonOperator,
  DEFAULT_SELECT_FILTER_OPERATOR,
  DEFAULT_TEXT_FILTER_OPERATOR,
  isComparisonValue,
} from '@/components/DataTable/types'

/**
 * Bridges Refine's `useTable` server state to the TanStack table options the
 * DataTable expects, and reports the same PostHog events the MUI DataGrid list
 * pages did (`<prefix>_sorted`, `<prefix>_filter_applied`,
 * `<prefix>_column_visibility_changed`).
 *
 * Refine keeps permanent filters inside its filter state; those are dropped
 * from the column filter state so a page-level pin (a project id, say) never
 * shows up as a removable column filter chip.
 */

const isLogicalFilter = (filter: CrudFilter): filter is LogicalFilter =>
  'field' in filter

type ColumnDefs<TData> = ColumnDef<TData, unknown>[]

type ColumnFilterKind = {
  /** Operator used when the filter value is a bare string. */
  operator: CrudOperators
  /** Comparison filters carry their own operator alongside the value. */
  isComparison: boolean
}

function filterLookup<TData>(columns: ColumnDefs<TData>) {
  const kinds = new Map<string, ColumnFilterKind>()

  for (const column of columns) {
    const id = (column.id ??
      (column as { accessorKey?: string }).accessorKey) as string | undefined
    const filter = column.meta?.filter
    if (!id || !filter) continue

    if (filter.type === 'text') {
      kinds.set(id, {
        operator: filter.operator ?? DEFAULT_TEXT_FILTER_OPERATOR,
        isComparison: false,
      })
      continue
    }

    if (filter.type === 'select') {
      kinds.set(id, {
        operator: filter.operator ?? DEFAULT_SELECT_FILTER_OPERATOR,
        isComparison: false,
      })
      continue
    }

    kinds.set(id, {
      operator: filter.defaultOperator ?? 'eq',
      isComparison: true,
    })
  }

  return kinds
}

export interface UseRefineDataTableOptions<TData extends BaseRecord> {
  /** Return value of Refine's `useTable`. */
  refineTable: useTableReturnType<TData, HttpError>
  columns: ColumnDefs<TData>
  /** Filters the page pins; hidden from the column filter state. */
  permanentFilters?: CrudFilter[]
  /** PostHog event prefix, e.g. `wells`. Omit to skip analytics. */
  analyticsPrefix?: string
  initialColumnVisibility?: VisibilityState
}

export function useRefineDataTable<TData extends BaseRecord>({
  refineTable,
  columns,
  permanentFilters = [],
  analyticsPrefix,
  initialColumnVisibility,
}: UseRefineDataTableOptions<TData>) {
  const {
    sorters,
    setSorters,
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    result,
  } = refineTable

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility ?? {}
  )

  const filterKinds = useMemo(() => filterLookup(columns), [columns])

  const sorting = useMemo<SortingState>(
    () =>
      sorters.map((sorter) => ({
        id: sorter.field,
        desc: sorter.order === 'desc',
      })),
    [sorters]
  )

  const columnFilters = useMemo<ColumnFiltersState>(
    () =>
      filters
        .filter(isLogicalFilter)
        .filter(
          (filter) =>
            !permanentFilters
              .filter(isLogicalFilter)
              .some(
                (permanent) =>
                  permanent.field === filter.field &&
                  permanent.operator === filter.operator
              )
        )
        .map((filter) => ({
          id: filter.field,
          value: filterKinds.get(filter.field)?.isComparison
            ? {
                operator: filter.operator as DataTableComparisonOperator,
                value: String(filter.value),
              }
            : filter.value,
        })),
    [filterKinds, filters, permanentFilters]
  )

  const pagination = useMemo<PaginationState>(
    () => ({ pageIndex: Math.max(0, currentPage - 1), pageSize }),
    [currentPage, pageSize]
  )

  const onSortingChange = useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      const next = functionalUpdate(updater, sorting)

      if (analyticsPrefix && next.length > 0) {
        captureEvent(`${analyticsPrefix}_sorted`, {
          field: next[0].id,
          direction: next[0].desc ? 'desc' : 'asc',
        })
      }

      setSorters(
        next.map((sort) => ({
          field: sort.id,
          order: sort.desc ? ('desc' as const) : ('asc' as const),
        }))
      )

      // Re-ordering the collection makes the current page meaningless.
      setCurrentPage(1)
    },
    [analyticsPrefix, setCurrentPage, setSorters, sorting]
  )

  const onColumnFiltersChange = useCallback<OnChangeFn<ColumnFiltersState>>(
    (updater) => {
      const next = functionalUpdate(updater, columnFilters)

      const crudFilters = next.map((filter) =>
        isComparisonValue(filter.value)
          ? {
              field: filter.id,
              operator: filter.value.operator,
              value: filter.value.value,
            }
          : {
              field: filter.id,
              operator:
                filterKinds.get(filter.id)?.operator ??
                DEFAULT_TEXT_FILTER_OPERATOR,
              value: filter.value,
            }
      ) as CrudFilter[]

      if (analyticsPrefix && crudFilters.length > 0) {
        captureEvent(`${analyticsPrefix}_filter_applied`, {
          filter_count: crudFilters.length,
          filter_fields: crudFilters
            .filter(isLogicalFilter)
            .map((filter) => filter.field),
          filter_operators: crudFilters.map((filter) => filter.operator),
        })
      }

      setFilters(crudFilters, 'replace')

      // A narrower result set invalidates the current page.
      setCurrentPage(1)
    },
    [analyticsPrefix, columnFilters, filterKinds, setCurrentPage, setFilters]
  )

  const onPaginationChange = useCallback<OnChangeFn<PaginationState>>(
    (updater) => {
      const next = functionalUpdate(updater, pagination)

      if (next.pageSize !== pagination.pageSize) {
        setPageSize(next.pageSize)
        setCurrentPage(1)
        return
      }

      setCurrentPage(next.pageIndex + 1)
    },
    [pagination, setCurrentPage, setPageSize]
  )

  const onColumnVisibilityChange = useCallback<OnChangeFn<VisibilityState>>(
    (updater) => {
      const next = functionalUpdate(updater, columnVisibility)
      const hidden = Object.entries(next)
        .filter(([, visible]) => !visible)
        .map(([field]) => field)

      if (analyticsPrefix) {
        captureEvent(`${analyticsPrefix}_column_visibility_changed`, {
          hidden_count: hidden.length,
          hidden_columns: hidden,
        })
      }

      setColumnVisibility(next)
    },
    [analyticsPrefix, columnVisibility]
  )

  return {
    state: { sorting, columnFilters, pagination, columnVisibility },
    onSortingChange,
    onColumnFiltersChange,
    onPaginationChange,
    onColumnVisibilityChange,
    manualSorting: true as const,
    manualFiltering: true as const,
    manualPagination: true as const,
    rowCount: result.total ?? 0,
  }
}
