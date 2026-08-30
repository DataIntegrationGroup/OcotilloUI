import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useGroups } from '@/hooks'
import { cn } from '@/lib/utils'
import {
  describeScope,
  describeSubject,
  grantStatusOf,
  isUiSurfaceGrant,
  type PermissionGrant,
  scopeIdRequired,
} from '@/utils/accessGrants'
import {
  type AccessStatus,
  ACCESS_STATUS_LABELS,
  isRevocable,
} from '@/utils/accessLifecycle'

const PAGE_SIZES = [10, 25, 50, 100]

/**
 * Status colours as Tailwind tokens rather than MUI palette names. The four
 * statuses are the same four `accessLifecycle` derives; only the paint differs.
 */
const STATUS_CLASSES: Record<AccessStatus, string> = {
  active: 'border-success/30 bg-success/10 text-success',
  scheduled: 'border-primary/30 bg-primary/10 text-primary',
  expired: 'border-border bg-muted text-muted-foreground',
  revoked: 'border-destructive/30 bg-destructive/10 text-destructive',
}

/**
 * The grants table, on the shadcn table primitive with TanStack for the row
 * model. Sorting stays in `sortGrants`, which orders by lifecycle first — that
 * is a domain rule, not a column the reader should be able to undo.
 */
export const GrantsTable = ({
  rows,
  today,
  onRevoke,
  revokingId,
}: {
  rows: PermissionGrant[]
  today: Date
  onRevoke: (grant: PermissionGrant) => void
  revokingId: number | null
}) => {
  const { groups } = useGroups()
  const groupNames = useMemo(
    () => Object.fromEntries(groups.map((group) => [group.id, group.name])),
    [groups]
  )

  const columns = useMemo<ColumnDef<PermissionGrant>[]>(
    () => [
      {
        id: 'principal',
        header: 'Principal',
        cell: ({ row }) => (
          <div className="min-w-40">
            <div className="font-semibold break-words">
              {row.original.principal_id}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.original.principal_type}
            </div>
          </div>
        ),
      },
      {
        id: 'capability',
        header: 'Capability',
        cell: ({ row }) => row.original.capability,
      },
      {
        id: 'covers',
        header: 'Covers',
        cell: ({ row }) => {
          const surface = isUiSurfaceGrant(row.original)

          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  tabIndex={0}
                  variant="outline"
                  className={cn(
                    'max-w-65',
                    surface && 'border-primary/30 bg-primary/10 text-primary'
                  )}
                >
                  <span className="truncate">
                    {describeSubject(row.original)}
                  </span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {surface
                  ? 'Screen grant: opens this nav item. Grants no write access.'
                  : 'Data grant: reaches this data type.'}
              </TooltipContent>
            </Tooltip>
          )
        },
      },
      {
        id: 'scope',
        header: 'Scope',
        cell: ({ row }) => describeScope(row.original, groupNames),
      },
      {
        id: 'dates',
        header: 'Dates',
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {row.original.starts_at} → {row.original.ends_at ?? 'no end'}
          </span>
        ),
      },
      {
        id: 'granted_by',
        header: 'Granted by',
        cell: ({ row }) => (
          // One line each, whatever the length: a long reason used to set the
          // height of the whole row.
          <div className="max-w-55 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <div tabIndex={0} className="truncate">
                  {row.original.granted_by}
                </div>
              </TooltipTrigger>
              <TooltipContent>{row.original.granted_by}</TooltipContent>
            </Tooltip>
            {row.original.reason ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    tabIndex={0}
                    className="truncate text-xs text-muted-foreground"
                  >
                    {row.original.reason}
                  </div>
                </TooltipTrigger>
                <TooltipContent>{row.original.reason}</TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = grantStatusOf(row.original, today)

          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  tabIndex={0}
                  variant="outline"
                  className={cn('border', STATUS_CLASSES[status])}
                >
                  {ACCESS_STATUS_LABELS[status]}
                </Badge>
              </TooltipTrigger>
              {row.original.revoked_at ? (
                <TooltipContent>
                  Revoked by {row.original.revoked_by ?? 'unknown'}
                </TooltipContent>
              ) : null}
            </Tooltip>
          )
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right">
            {isRevocable(row.original, today) ? (
              <Button
                size="sm"
                variant="destructive"
                disabled={revokingId === row.original.id}
                onClick={() => onRevoke(row.original)}
              >
                {revokingId === row.original.id ? 'Revoking...' : 'Revoke'}
              </Button>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        ),
      },
    ],
    [groupNames, today, onRevoke, revokingId]
  )

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  })

  const table = useReactTable({
    data: rows,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    // Filtering happens before the rows arrive here, so a page that no longer
    // exists is reset rather than left showing nothing.
    autoResetPageIndex: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const pageCount = table.getPageCount()

  return (
    <TooltipProvider>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                // A scoped grant reaches one group or one thing, not the whole
                // portal. The tint is what makes the narrow ones findable.
                className={cn(
                  scopeIdRequired(row.original.scope_type) && 'bg-warning/8'
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page</span>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) =>
                setPagination({ pageIndex: 0, pageSize: Number(value) })
              }
            >
              <SelectTrigger
                size="sm"
                className="w-20"
                aria-label="Rows per page"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              Page {pagination.pageIndex + 1} of {Math.max(pageCount, 1)}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous page
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next page
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
