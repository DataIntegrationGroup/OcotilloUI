import { useMemo, useState } from 'react'
import { useDataGrid } from '@refinedev/mui'
import { GridColDef } from '@mui/x-data-grid'
import { IWellScreen } from '@/interfaces/ocotillo/IWellScreen'

import { ListPage } from '@/components/ListPage'
import { actionColumnDef, idColumnDef } from '@/components/CommonColumnDefs'
import { useLink } from '@refinedev/core'
import { linkColumn } from '@/utils/link'

export const WellScreenList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IWellScreen>({
    resource: 'thing/well-screen',
    dataProviderName: 'ocotillo',

    // it would be great to use staleTime and cacheTime here, but it seems
    // that when staleTime is set, the data is not refetched when the component is remounted
    // after editing a record.

    // queryOptions: {
    //   cacheTime: 60000, // Cache for 1 minute
    // staleTime: 30000, // Consider data fresh for 30 seconds
    // },
  })

  const columns = useMemo<GridColDef<IWellScreen>[]>(
    () => [
      idColumnDef(),
      linkColumn(
        'ocotillo.thing-well',
        {
          field: 'thing_id',
          headerName: 'Well',
          type: 'string',
          minWidth: 150,
        },
        (params) => {
          return params.row.thing.name
        }
      ),
      {
        field: 'screen_type',
        headerName: 'Type',
        type: 'string',
        minWidth: 50,
      },
      {
        field: 'screen_depth_top',
        headerName: 'Depth Top (ft)',
        type: 'number',
        minWidth: 150,
      },
      {
        field: 'screen_depth_bottom',
        headerName: 'Depth Bottom (ft)',
        type: 'number',
        minWidth: 150,
      },
      {
        field: 'screen_description',
        headerName: 'Description',
        type: 'string',
        minWidth: 150,
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
      description={'please add me'}
    />
  )
}
