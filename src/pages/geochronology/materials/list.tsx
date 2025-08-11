import { useMany } from '@refinedev/core'
import { ShowButton, EditButton, List, useDataGrid } from '@refinedev/mui'
import React from 'react'

import { DataGrid, type GridColDef } from '@mui/x-data-grid'

import type { IMaterial } from '../../../interfaces/geochronology'
import { Chip } from '@mui/material'
import { settings } from '../../../settings'
import { idColumnDef } from '@/components/CommonColumnDefs'

export const MaterialList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IMaterial>()

  const columns = React.useMemo<GridColDef<IMaterial>[]>(
    () => [
      idColumnDef(),
      {
        field: 'name',
        headerName: 'Name',
        type: 'string',
        minWidth: 300,
      },
      {
        field: 'grainsizex',
        headerName: 'Grain Size',
        type: 'string',
        minWidth: 200,
      },
      {
        field: 'actions',
        headerName: 'Actions',
        renderCell: function render({ row }) {
          return (
            <>
              <EditButton hideText recordItemId={row.id} />
              <ShowButton hideText recordItemId={row.id} />
            </>
          )
        },
        align: 'center',
        headerAlign: 'center',
        minWidth: 80,
      },
    ],
    []
  )

  return (
    <List>
      <DataGrid
        {...dataGridProps}
        rowHeight={settings.rowHeight}
        getRowId={(row) => row.id}
        columns={columns}
        autoHeight
      />
    </List>
  )
}
