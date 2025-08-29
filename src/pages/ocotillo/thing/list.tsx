import { useMemo } from 'react'
import { useDataGrid } from '@refinedev/mui'
import { GridColDef } from '@mui/x-data-grid'
import { ListPage } from '@/components/ListPage'
import { ISpring, IWell } from '@/interfaces/ocotillo/IThing'
import { actionColumnDef, idColumnDef } from '@/components/CommonColumnDefs'

export const SpringList: React.FC = () => {
  const { dataGridProps } = useDataGrid<ISpring>({
    resource: 'thing',
    dataProviderName: 'ocotillo',

    meta: {
      params: {
        thing_type: ['spring'],
      },
    },
  })

  const columns = useMemo<GridColDef<ISpring>[]>(
    () => [
      idColumnDef(),
      {
        field: 'name',
        headerName: 'Name',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'release_status',
        headerName: 'Release Status',
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
      actionColumnDef(),
    ],
    []
  )
  return (
    <ListPage
      title="Springs"
      columns={columns}
      dataGridProps={dataGridProps}
      getRowId={(row) => row.id}
      description={
        'Springs are natural water sources that flow from the ground. They can be used for various purposes, including water supply and ecological studies.'
      }
    />
  )
}

export const WellList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IWell>({
    resource: 'thing',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_type: ['water well', 'geothermal well'],
      },
    },
  })

  const columns = useMemo<GridColDef<IWell>[]>(
    () => [
      idColumnDef(),
      {
        field: 'name',
        headerName: 'Name',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'release_status',
        headerName: 'Release Status',
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
      actionColumnDef(),
    ],
    []
  )

  return (
    <ListPage
      title="Wells"
      description={
        'A water well is a man-made structure created to access groundwater from underground aquifers. Wells are' +
        ' commonly used for drinking water, irrigation, and industrial purposes, and can vary in depth and' +
        ' construction depending on the local geology and intended use.'
      }
      columns={columns}
      dataGridProps={dataGridProps}
      getRowId={(row) => row.id}
    />
  )
}
