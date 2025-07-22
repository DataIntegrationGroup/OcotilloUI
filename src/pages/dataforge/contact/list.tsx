import { useMemo } from 'react'
import { ShowButton, EditButton, useDataGrid } from '@refinedev/mui'
import { GridColDef } from '@mui/x-data-grid'
import { ListPage } from '@/components/ListPage'
import { IContact } from '@/interfaces/dataforge/IContact'

export const ContactList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IContact>()

  const columns = useMemo<GridColDef<IContact>[]>(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        type: 'number',
        minWidth: 100,
      },
      {
        field: 'name',
        headerName: 'Name',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'role',
        headerName: 'Role',
        type: 'string',
        minWidth: 150,
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
