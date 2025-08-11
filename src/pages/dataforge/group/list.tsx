import { useMemo, useState } from 'react'
import { ShowButton, EditButton, useDataGrid } from '@refinedev/mui'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { IGroup } from '@/interfaces/dataforge/IGroup'
import { List } from '@refinedev/mui'
import { Card, CardHeader } from '@mui/material'
import { ListPage } from '@/components/ListPage'
import { actionColumnDef, idColumnDef } from '@/components/CommonColumnDefs'

export const GroupList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IGroup>({
    resource: 'group',
    dataProviderName: 'dataforge',

    // it would be great to use staleTime and cacheTime here, but it seems
    // that when staleTime is set, the data is not refetched when the component is remounted
    // after editing a record.

    // queryOptions: {
    //   cacheTime: 60000, // Cache for 1 minute
    // staleTime: 30000, // Consider data fresh for 30 seconds
    // },
  })

  const columns = useMemo<GridColDef<IGroup>[]>(
    () => [
      idColumnDef(),
      {
        field: 'name',
        headerName: 'Name',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'parent_group_id',
        headerName: 'Parent Group ID',
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
      description={
        'Groups are used to organize things and other groups. For example,\n' +
        '            you can create a group called "Collaborative Network" and add all\n' +
        '            the wells in the network to that group.'
      }
    />
  )
}
