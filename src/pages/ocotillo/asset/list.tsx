import { useMemo, useState } from 'react'
import { ShowButton, EditButton, useDataGrid } from '@refinedev/mui'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { IAsset } from '@/interfaces/ocotillo/IAsset'
import { List } from '@refinedev/mui'
import { Card, CardHeader, Typography } from '@mui/material'
import { ListPage } from '@/components/ListPage'
import { Box } from '@mui/system'
import { actionColumnDef, idColumnDef } from '@/components/CommonColumnDefs'

export const AssetList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IAsset>({
    resource: 'asset',
    dataProviderName: 'ocotillo',

    // it would be great to use staleTime and cacheTime here, but it seems
    // that when staleTime is set, the data is not refetched when the component is remounted
    // after editing a record.

    // queryOptions: {
    //   cacheTime: 60000, // Cache for 1 minute
    // staleTime: 30000, // Consider data fresh for 30 seconds
    // },
  })

  const columns = useMemo<GridColDef<IAsset>[]>(
    () => [
      idColumnDef(),
      {
        field: 'label',
        headerName: 'Label',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'name',
        headerName: 'Name',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'storage_path',
        headerName: 'Storage Path',
        type: 'string',
      },
      {
        field: 'created_at',
        headerName: 'Created At',
        type: 'dateTime',
        minWidth: 180,
        valueGetter: (params) => new Date(params),
      },
      actionColumnDef(),
    ],
    []
  )

  return (
    <ListPage
      columns={columns}
      dataGridProps={dataGridProps}
      getRowId={(row) => row.id}
      children={
        <Card sx={{ margin: 1, padding: 1 }}>
          <Typography>
            Assets are digital files (.e.g PDFs and images) that are associated
            with "Things".
          </Typography>
        </Card>
      }
    />
  )
}
