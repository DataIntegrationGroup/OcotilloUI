import { useMemo } from 'react'
import { useDataGrid } from '@refinedev/mui'
import { GridColDef } from '@mui/x-data-grid'
import { ListPage } from '@/components/ListPage'
import { ISample } from '@/interfaces/ocotillo/ISample'
import { actionColumnDef, idColumnDef } from '@/components/CommonColumnDefs'
import { extractThingTypeResource, linkColumn } from '@/utils/link'

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

      // TODO: this is an issue because thing_id may not link to a Well. It may link to some other type of thing,
      //  e.g. a Spring.
      linkColumn(
        extractThingTypeResource((params) => params.row.thing?.thing_type),
        {
          field: 'thing.id',
          headerName: 'Thing',
          type: 'number',
          minWidth: 120,
          flex: 1,
        },
        (params) => {
          return params.row.thing?.name || 'No Thing'
        }
      ),
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
