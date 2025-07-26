import { useMemo } from 'react'
import { ShowButton, EditButton, useDataGrid } from '@refinedev/mui'
import { GridColDef } from '@mui/x-data-grid'
import { ListPage } from '@/components/ListPage'
import { ISensor } from '@/interfaces/dataforge/ISensor'

export const SensorList: React.FC = () => {
  const { dataGridProps } = useDataGrid<ISensor>({
    resource: 'sensor',
    dataProviderName: 'dataforge',
    queryOptions: {
      cacheTime: 60000, 
      staleTime: 30000, 
    },
  })

  const columns = useMemo<GridColDef<ISensor>[]>(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        type: 'number',
        minWidth: 100,
      },
      {
        field: 'actions',
        headerName: 'Actions',
        renderCell: function render({ row }) {
          return (
            <div style={{ display: 'flex'}}>
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
        field: 'name',
        headerName: 'Name',
        type: 'string',
        minWidth: 100,
        maxWidth: 150,
        flex: 1,
      },
      {
        field: 'model',
        headerName: 'Model',
        type: 'string',
        minWidth: 100,
        flex: 1,
      },
      {
        field: 'serial_no',
        headerName: 'Serial No',
        type: 'string',
        minWidth: 100,
        flex: 1,
      },
      {
        field: 'date_installed',
        headerName: 'Date Installed',
        type: 'string',
        minWidth: 120,
        flex: 1,
      },
      {
        field: 'date_removed',
        headerName: 'Date Removed',
        type: 'string',
        minWidth: 120,
        flex: 1,
      },
      {
        field: 'recording_interval',
        headerName: 'Recording Interval',
        type: 'number',
        minWidth: 100,
        flex: 1,
      },
      {
        field: 'notes',
        headerName: 'Notes',
        type: 'string',
        minWidth: 150,
        flex: 2,
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