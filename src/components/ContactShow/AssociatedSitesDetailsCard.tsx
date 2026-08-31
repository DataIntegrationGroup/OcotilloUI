import { Place } from '@mui/icons-material'
import { Box, Typography } from '@mui/material'
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { DataTable, DataTableColumnHeader } from '@/components/DataTable'
import {
  type AssociatedSiteRow,
  useAssociatedSiteRows,
} from '@/hooks/useAssociatedSiteRows'
import type { IThing } from '@/interfaces/ocotillo'
import { formatAppDateTime } from '@/utils'

const measure = (
  value: number | null,
  unit: string | null,
  fallback: string
) => (value != null ? `${value} ${unit ?? ''}`.trim() : fallback)

export const AssociatedSitesDetailsCard = ({
  things,
}: {
  things?: IThing[] | null
}) => {
  const rows = useAssociatedSiteRows(things)
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<AssociatedSiteRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Site" />
        ),
        cell: ({ row }) => (
          <span className="font-semibold">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'lastCheckedDate',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Last checked" />
        ),
        cell: ({ row }) =>
          row.original.lastCheckedDate
            ? formatAppDateTime(row.original.lastCheckedDate)
            : 'No data',
      },
      {
        accessorKey: 'lastCheckedBy',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Checked by" />
        ),
        cell: ({ row }) => row.original.lastCheckedBy ?? 'Unknown',
      },
      {
        accessorKey: 'depthToWater',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Depth to water" />
        ),
        cell: ({ row }) =>
          row.original.depthToWater != null
            ? `${row.original.depthToWater} ft bgs`
            : 'No measurements',
      },
      {
        accessorKey: 'wellDepth',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Well depth" />
        ),
        cell: ({ row }) =>
          measure(row.original.wellDepth, row.original.wellDepthUnit, 'N/A'),
      },
      {
        accessorKey: 'holeDepth',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Hole depth" />
        ),
        cell: ({ row }) =>
          measure(row.original.holeDepth, row.original.holeDepthUnit, 'N/A'),
      },
    ],
    []
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => String(row.id),
  })

  const isLoading = rows.some((row) => row.isLoading)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Place color="primary" />
        <Typography variant="body1" fontWeight="bold">
          Associated Sites
        </Typography>
      </Box>
      <DataTable
        table={table}
        isLoading={isLoading}
        emptyMessage="No associated sites."
        rowHref={(row) => row.showPath}
        skeletonRowCount={3}
      />
    </Box>
  )
}
