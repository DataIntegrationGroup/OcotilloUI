import { useMemo } from 'react'
import { ShowButton, EditButton, useDataGrid } from '@refinedev/mui'
import { GridColDef } from '@mui/x-data-grid'
import { ListPage } from '@/components/ListPage'
import { IWell, ISpring } from '@/interfaces/dataforge/IThing'

export const SpringList: React.FC = () => {
  const { dataGridProps } = useDataGrid<ISpring>({
    resource: 'thing',
    dataProviderName: 'dataforge',

    meta: {
      params: {
        thing_type: ['spring'],
      },
    },
  })

  const columns = useMemo<GridColDef<ISpring>[]>(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        type: 'number',
        minWidth: 100,
      },
      {
        field: 'thing_type',
        headerName: 'Thing Type',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'spring_type',
        headerName: 'Spring Type',
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
        flex: 0.3,
      },
    ],
    []
  )
  return (
    <ListPage
      title="Springs"
      columns={columns}
      dataGridProps={dataGridProps}
      getRowId={(row) => row.id}
    />
  )
}

export const WellList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IWell>({
    resource: 'thing',
    dataProviderName: 'dataforge',
    meta: {
      params: {
        thing_type: ['water well', 'geothermal well'],
      },
    },
  })

  const columns = useMemo<GridColDef<IWell>[]>(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        type: 'number',
        minWidth: 100,
      },
      {
        field: 'thing_type',
        headerName: 'Thing Type',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'well_type',
        headerName: 'Well Type',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'well_depth',
        headerName: 'Well Depth (ft)',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'hole_depth',
        headerName: 'Hole Depth (ft)',
        type: 'string',
      },
      {
        field: 'created_at',
        headerName: 'Created At',
        type: 'dateTime',
        minWidth: 180,
        valueGetter: (params) => new Date(params),
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
        flex: 0.3,
      },
    ],
    []
  )

  return (
    <ListPage
      columns={columns}
      dataGridProps={dataGridProps}
      getRowId={(row) => row.id}
    />
  )
}
