import { flexRender, type Table as TanstackTable } from '@tanstack/react-table'
import type { MouseEvent } from 'react'
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
  skeletonRowCount = 8,
  className,
}: DataTableProps<TData>) {
  const navigate = useNavigate()
  const visibleColumnCount = table.getVisibleLeafColumns().length

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
                colSpan={visibleColumnCount}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={
                  isRowSelected?.(row.original) ? 'selected' : undefined
                }
                onClick={(event) => handleRowClick(event, row.original)}
                onAuxClick={(event) => {
                  // Middle click: open elsewhere without following the row.
                  if (event.button === 1) handleRowClick(event, row.original)
                }}
                className={cn(
                  rowHref || onRowClick ? 'cursor-pointer' : undefined
                )}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta

                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        meta?.align ? ALIGNMENT_CLASS[meta.align] : undefined,
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
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
