import type { Table } from '@tanstack/react-table'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * Pager for a DataTable. Reads the row count from the table instance, so it
 * reports server totals on manual-pagination tables and filtered row counts on
 * client-side ones.
 */

const PAGE_SIZE_OPTIONS = [25, 50, 100]

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}: {
  table: Table<TData>
  pageSizeOptions?: number[]
}) {
  const { pageIndex, pageSize } = table.getState().pagination
  const rowCount = table.getRowCount()
  const pageCount = Math.max(1, table.getPageCount())

  const rangeStart = rowCount === 0 ? 0 : pageIndex * pageSize + 1
  const rangeEnd = Math.min(rowCount, (pageIndex + 1) * pageSize)

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">
        {rowCount === 0
          ? 'No results'
          : `${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()} of ${rowCount.toLocaleString()}`}
      </span>

      <div className="flex items-center gap-2">
        <Select
          value={String(pageSize)}
          onValueChange={(value) => table.setPageSize(Number(value))}
        >
          <SelectTrigger
            className="h-8 w-28 text-sm"
            aria-label="Rows per page"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {pageSizeOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          <ChevronLeftIcon className="size-3.5" aria-hidden />
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          Page {pageIndex + 1} of {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          Next
          <ChevronRightIcon className="size-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
