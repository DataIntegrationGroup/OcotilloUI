import React from 'react'
import { ShowButton, EditButton, useDataGrid } from '@refinedev/mui'
import { type GridColDef } from '@mui/x-data-grid'
import { IWell } from '@/interfaces/geothermal'
import { ListPage } from '@/components'

export const GeoThermalWellList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IWell>({
    dataProviderName: 'geothermal',
    resource: 'wells',
  })

  const columns = React.useMemo<GridColDef<IWell>[]>(
    () => [
      {
        field: 'OBJECTID',
        headerName: 'ID',
        type: 'number',
        minWidth: 150,
      },
      {
        field: 'WellDataID',
        headerName: 'Well ID',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'County',
        headerName: 'County',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'actions',
        headerName: 'Actions',
        renderCell: function render({ row }) {
          return (
            <>
              <EditButton hideText recordItemId={row.OBJECTID} />
              <ShowButton hideText recordItemId={row.OBJECTID} />
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
      getRowId={(row) => row.OBJECTID}
      dataGridProps={dataGridProps}
      exportProps={{
        pageSize: 1000,
        dataProviderName: 'geothermal',
        resource: 'wells',
      }}
    />
  )
}
