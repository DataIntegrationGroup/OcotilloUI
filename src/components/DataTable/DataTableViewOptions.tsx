import type { Table } from '@tanstack/react-table'
import { Settings2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Column visibility menu. Replaces the MUI DataGrid "Columns" toolbar button;
 * columns opt out with `enableHiding: false`.
 */
export function DataTableViewOptions<TData>({
  table,
}: {
  table: Table<TData>
}) {
  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide())

  if (hideableColumns.length === 0) return null

  const hiddenCount = hideableColumns.filter(
    (column) => !column.getIsVisible()
  ).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Settings2Icon className="size-3.5" aria-hidden />
          Columns
          {hiddenCount > 0 ? (
            <span className="text-xs text-muted-foreground">
              ({hiddenCount} hidden)
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-96 w-56 overflow-y-auto"
      >
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hideableColumns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
            onSelect={(event) => event.preventDefault()}
          >
            {column.columnDef.meta?.label ?? column.id}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={hiddenCount === 0}
          onSelect={() => table.resetColumnVisibility()}
        >
          Show all columns
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
