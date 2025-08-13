import { useMemo } from 'react'
import { ShowButton, EditButton, useDataGrid } from '@refinedev/mui'
import { GridColDef } from '@mui/x-data-grid'
import { ListPage } from '@/components/ListPage'
import { ISample } from '@/interfaces/ocotillo/ISample'
import { idColumnDef, actionColumnDef } from '@/components/CommonColumnDefs'

export const SampleList: React.FC = () => {
  const { dataGridProps } = useDataGrid<ISample>({
    resource: 'sample',
    dataProviderName: 'ocotillo',
    queryOptions: {
      cacheTime: 60000,
      staleTime: 30000,
    },
  })

  const columns = useMemo<GridColDef<ISample>[]>(
    () => [
      idColumnDef(),
      {
        field: 'release_status',
        headerName: 'Release Status',
        type: 'string',
        minWidth: 120,
        flex: 1,
      },
      actionColumnDef(),
      {
        field: 'sample_date',
        headerName: 'Sample Date',
        type: 'string',
        minWidth: 100,
        flex: 1,
      },
      {
        field: 'sample_type',
        headerName: 'Sample Type',
        type: 'string',
        minWidth: 100,
        flex: 1,
      },
      {
        field: 'field_sample_id',
        headerName: 'Field Sample ID',
        type: 'string',
        minWidth: 150,
        flex: 1,
      },
      {
        field: 'qc_sample',
        headerName: 'QC Sample',
        type: 'string',
        minWidth: 100,
        flex: 1,
      },
      {
        field: 'sensor_id',
        headerName: 'Sensor ID',
        type: 'number',
        minWidth: 120,
        flex: 1,
      },
      {
        field: 'thing_id',
        headerName: 'Thing ID',
        type: 'number',
        minWidth: 120,
        flex: 1,
      },
    ],
    []
  )

  return (
    <ListPage
      columns={columns}
      dataGridProps={dataGridProps}
      getRowId={(row) => row.id}
      description={
        'Samples are used to represent the data collected from a sensor.'
      }
    />
  )
}
