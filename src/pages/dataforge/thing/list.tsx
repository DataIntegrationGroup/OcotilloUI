import { useMemo } from 'react'
import { ShowButton, EditButton, useDataGrid } from '@refinedev/mui'
import { GridColDef } from '@mui/x-data-grid'
import { ListPage } from '@/components/ListPage'
import { IWellThing } from '@/interfaces/dataforge/IThing'

export const WellThingList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IWellThing>()

  const columns = useMemo<GridColDef<IWellThing>[]>(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        type: 'number',
        minWidth: 100,
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
