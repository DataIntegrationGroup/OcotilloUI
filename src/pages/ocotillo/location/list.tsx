import { useMemo } from 'react'
import { ShowButton, EditButton, useDataGrid } from '@refinedev/mui'
import { GridColDef } from '@mui/x-data-grid'
import { ListPage } from '@/components/ListPage'
import { ILocation } from '@/interfaces/ocotillo/ILocation'
import { actionColumnDef, idColumnDef } from '@/components/CommonColumnDefs'

export const LocationList: React.FC = () => {
  const { dataGridProps } = useDataGrid<ILocation>({
    resource: 'location',
    dataProviderName: 'ocotillo',
  })

  const columns = useMemo<GridColDef<ILocation>[]>(
    () => [
      idColumnDef(),
      {
        field: 'name',
        headerName: 'Name',
        type: 'string',
        minWidth: 100,
        maxWidth: 150,
        flex: 1,
      },
      {
        field: 'notes',
        headerName: 'Notes',
        type: 'string',
        minWidth: 200,
      },
      {
        field: 'point',
        headerName: 'Point (WKT)',
        type: 'string',
        minWidth: 200,
      },
      {
        field: 'release_status',
        headerName: 'Release Status',
        type: 'string',
        minWidth: 120,
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
      description={'Locations are used to represent geographic locations'}
    />
  )
}
