import React from 'react'
import { ShowButton, EditButton, useDataGrid } from '@refinedev/mui'
import { type GridColDef } from '@mui/x-data-grid'
import { IWell } from '@/interfaces/geothermal'
import { ListPage } from '@/components'

export const GeoThermalWellList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IWell>({
    dataProviderName: 'geothermal',
    resource: 'thing/geothermal-well',
  })

  const columns = React.useMemo<GridColDef<IWell>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Well',
        type: 'string',
        minWidth: 160,
      },
      {
        field: 'well_type',
        headerName: 'Type',
        type: 'string',
        minWidth: 130,
      },
      {
        field: 'status',
        headerName: 'Status',
        type: 'string',
        minWidth: 130,
      },
      {
        field: 'county',
        headerName: 'County',
        type: 'string',
        minWidth: 130,
      },
      {
        field: 'operator',
        headerName: 'Operator',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'actions',
        headerName: 'Actions',
        renderCell: function render({ row }) {
          return (
            <>
              <EditButton hideText recordItemId={row.well_data_id} />
              <ShowButton hideText recordItemId={row.well_data_id} />
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
      getRowId={(row) => row.well_data_id}
      dataGridProps={dataGridProps}
      exportProps={{
        pageSize: 1000,
        dataProviderName: 'geothermal',
        resource: 'thing/geothermal-well',
      }}
    />
  )
}
