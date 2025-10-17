import { DeleteButton, EditButton, ShowButton } from '@refinedev/mui'

export const idColumnDef = () => {
  return {
    field: 'id',
    headerName: 'ID',
    type: 'string',
    width: 100,
  }
}

export const actionColumnDef = ({ resource = {} }: { resource: any }) => {
  return {
    field: 'actions',
    headerName: 'Actions',
    renderCell: function render({ row }) {
      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          <EditButton
            resource={resource}
            size="small"
            hideText
            recordItemId={row.id}
            variant={'outlined'}
            sx={{ maxWidth: 50, maxHeight: 5, px: 1 }}
          />
          <ShowButton
            resource={resource}
            size="small"
            hideText
            recordItemId={row.id}
            variant={'outlined'}
            sx={{ maxWidth: 50, maxHeight: 5, px: 1 }}
          />
          <DeleteButton
            resource={resource}
            size="small"
            hideText
            recordItemId={row.id}
            variant={'outlined'}
            sx={{ maxWidth: 50, maxHeight: 5, px: 1 }}
          />
        </div>
      )
    },
    align: 'center',
    headerAlign: 'center',
    minWidth: 210,
  }
}
