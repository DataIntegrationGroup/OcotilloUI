import type { Table } from '@tanstack/react-table'
import { SearchIcon, XIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { DataTableViewOptions } from '@/components/DataTable/DataTableViewOptions'
import {
  COMPARISON_OPERATOR_LABELS,
  isComparisonValue,
} from '@/components/DataTable/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Toolbar above a DataTable: free-text search, page-supplied actions, the
 * column visibility menu and a row of dismissible chips for the active column
 * filters. Mirrors what the MUI DataGrid toolbar offered on the older list
 * pages, minus the density selector.
 */

export interface DataTableToolbarProps<TData> {
  table: Table<TData>
  /** Search is only rendered when a change handler is supplied. */
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  searchAriaLabel?: string
  /** Right-aligned summary, typically the total record count. */
  summary?: ReactNode
  /** Extra controls rendered next to the search input. */
  children?: ReactNode
  /** Chips rendered before the column filter chips, e.g. a project filter. */
  leadingChips?: ReactNode
  hideViewOptions?: boolean
}

export function DataTableToolbar<TData>({
  table,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  summary,
  children,
  leadingChips,
  hideViewOptions = false,
}: DataTableToolbarProps<TData>) {
  const columnFilters = table.getState().columnFilters
  const hasChips = columnFilters.length > 0 || Boolean(leadingChips)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {onSearchChange ? (
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={searchValue ?? ''}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder ?? 'Search all records…'}
              aria-label={searchAriaLabel ?? 'Search all records'}
              className="h-8 w-80 pl-8 text-sm"
            />
          </div>
        ) : null}

        {children}

        <div className="ml-auto flex items-center gap-2">
          {summary ? (
            <span className="text-xs text-muted-foreground">{summary}</span>
          ) : null}
          {hideViewOptions ? null : <DataTableViewOptions table={table} />}
        </div>
      </div>

      {hasChips ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {leadingChips}

          {columnFilters.map((filter) => {
            const column = table.getColumn(filter.id)
            const label = column?.columnDef.meta?.label ?? filter.id
            const display = isComparisonValue(filter.value)
              ? `${COMPARISON_OPERATOR_LABELS[filter.value.operator]} ${filter.value.value}`
              : `: ${String(filter.value)}`

            return (
              <Badge
                key={filter.id}
                variant="filter"
                className="h-7 gap-1 py-0 pl-2.5 pr-1"
                asChild
              >
                <span className="inline-flex items-center">
                  <span>
                    {label}
                    {display}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="size-5 rounded-full text-primary/70 hover:bg-primary/10 hover:text-primary"
                    aria-label={`Clear ${label} filter`}
                    onClick={() => column?.setFilterValue(undefined)}
                  >
                    <XIcon />
                  </Button>
                </span>
              </Badge>
            )
          })}

          {columnFilters.length > 1 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={() => table.resetColumnFilters()}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
