import { EditButton, ShowButton } from '@refinedev/mui'

export const idColumnDef = () => {
  return {
    field: 'id',
    headerName: 'ID',
    type: 'string',
    width: 100,
  }
}

export const actionColumnDef = () => {
  return {
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
  }
}
