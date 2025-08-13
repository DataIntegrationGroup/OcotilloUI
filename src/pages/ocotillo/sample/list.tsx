import { useMemo } from 'react'
import { ShowButton, EditButton, useDataGrid } from '@refinedev/mui'
import { GridColDef } from '@mui/x-data-grid'
import { ListPage } from '@/components/ListPage'
import { ISample } from '@/interfaces/ocotillo/ISample'

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
      {
        field: 'id',
        headerName: 'ID',
        type: 'number',
        minWidth: 100,
      },
      {
        field: 'release_status',
        headerName: 'Release Status',
        type: 'string',
        minWidth: 120,
        flex: 1,
      },
      {
        field: 'actions',
        headerName: 'Actions',
        renderCell: function render({ row }) {
          return (
            <div style={{ display: 'flex' }}>
              <EditButton size="small" hideText recordItemId={row.id} />
              <ShowButton size="small" hideText recordItemId={row.id} />
            </div>
          )
        },
        align: 'left',
        headerAlign: 'center',
        minWidth: 210,
        flex: 0.3,
      },
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
    />
  )
}
