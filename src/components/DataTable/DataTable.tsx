import { flexRender, type Table as TanstackTable } from '@tanstack/react-table'
import { ChevronRightIcon } from 'lucide-react'
import { Fragment, type MouseEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import {
  isNewWindowClick,
  openInNewWindow,
} from '@/components/DataTable/rowNavigation'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Renders a TanStack table instance with the shadcn table primitives. The page
 * owns the table instance, which is what lets the same component back both the
 * client-side lists and the server-paginated ones.
 */

const ALIGNMENT_CLASS = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

export interface DataTableProps<TData> {
  table: TanstackTable<TData>
  isLoading?: boolean
  emptyMessage?: string
  /** Row destination; a modifier click opens it in a new window instead. */
  rowHref?: (row: TData) => string | undefined
  /** Runs before navigation. Use for analytics. */
  onRowClick?: (row: TData) => void
  isRowSelected?: (row: TData) => boolean
  /** Renders content in a full-width row below an expanded record. */
  renderExpandedRow?: (row: TData) => ReactNode
  /** Whether the record's detail row is currently visible. */
  isRowExpanded?: (row: TData) => boolean
  /** Receives the record and its next expanded state after its toggle is used. */
  onExpandedRowChange?: (row: TData, expanded: boolean) => void
  /** Accessible record name used in the expand/collapse button label. */
  getExpandedRowLabel?: (row: TData) => string
  skeletonRowCount?: number
  className?: string
}

export function DataTable<TData>({
  table,
  isLoading = false,
  emptyMessage = 'No records match these filters.',
  rowHref,
  onRowClick,
  isRowSelected,
  renderExpandedRow,
  isRowExpanded,
  onExpandedRowChange,
  getExpandedRowLabel,
  skeletonRowCount = 8,
  className,
}: DataTableProps<TData>) {
  const navigate = useNavigate()
  const visibleColumnCount = table.getVisibleLeafColumns().length
  const hasExpandableRows = Boolean(
    renderExpandedRow && isRowExpanded && onExpandedRowChange
  )

  const handleRowClick = (
    event: MouseEvent<HTMLTableRowElement>,
    row: TData
  ) => {
    onRowClick?.(row)

    const href = rowHref?.(row)
    if (!href) return

    if (isNewWindowClick(event)) {
      openInNewWindow(href)
      return
    }

    navigate(href)
  }

  const rows = table.getRowModel().rows

  return (
    <div className={cn('rounded-md border', className)}>
      {/* Compact rows: shorter header, tighter cell padding than the shadcn
          default. Row height is floored by the tallest cell content, so action
          buttons are icon-xs to keep them under the text line box. */}
      <Table className="[&_td]:py-0.5 [&_th]:h-7">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {hasExpandableRows ? (
                <TableHead className="w-10">
                  <span className="sr-only">Details</span>
                </TableHead>
              ) : null}
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta
                const sorted = header.column.getIsSorted()

                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      meta?.align ? ALIGNMENT_CLASS[meta.align] : undefined,
                      meta?.headClassName
                    )}
                    aria-sort={
                      sorted
                        ? sorted === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {isLoading ? (
            Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
              <TableRow key={`skeleton-${rowIndex}`}>
                {hasExpandableRows ? <TableCell /> : null}
                {table.getVisibleLeafColumns().map((column) => (
                  <TableCell key={column.id}>
                    <Skeleton className="h-4 w-full max-w-40" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumnCount + (hasExpandableRows ? 1 : 0)}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const expanded = isRowExpanded?.(row.original) ?? false
              const rowLabel = getExpandedRowLabel?.(row.original) ?? 'record'

              return (
                <Fragment key={row.id}>
                  <TableRow
                    data-state={
                      isRowSelected?.(row.original) ? 'selected' : undefined
                    }
                    onClick={(event) => handleRowClick(event, row.original)}
                    onAuxClick={(event) => {
                      // Middle click: open elsewhere without following the row.
                      if (event.button === 1)
                        handleRowClick(event, row.original)
                    }}
                    className={cn(
                      rowHref || onRowClick ? 'cursor-pointer' : undefined
                    )}
                  >
                    {hasExpandableRows ? (
                      <TableCell className="w-10">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-expanded={expanded}
                          aria-label={`${expanded ? 'Collapse' : 'Expand'} details for ${rowLabel}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            onExpandedRowChange?.(row.original, !expanded)
                          }}
                        >
                          <ChevronRightIcon
                            className={cn(
                              'transition-transform',
                              expanded ? 'rotate-90' : undefined
                            )}
                            aria-hidden
                          />
                        </Button>
                      </TableCell>
                    ) : null}
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta

                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            meta?.align
                              ? ALIGNMENT_CLASS[meta.align]
                              : undefined,
                            meta?.cellClassName
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                  {expanded ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={visibleColumnCount + 1}
                        className="whitespace-normal p-0"
                      >
                        {renderExpandedRow?.(row.original)}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
