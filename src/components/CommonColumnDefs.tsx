import { Box } from '@mui/material'
import { DeleteButton, EditButton, ShowButton } from '@refinedev/mui'
import { GridColDef } from '@mui/x-data-grid'

export const idColumnDef = () => {
  return {
    field: 'id',
    headerName: 'ID',
    type: 'string',
    width: 100,
  }
}

export const actionColumnDef = ({
  resource,
}: { resource?: any } = {}): GridColDef => ({
  field: 'actions',
  headerName: 'Actions',
  renderCell: function render({ row }) {
    return (
      <Box component="div" sx={{ display: 'flex', gap: '8px' }}>
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
      </Box>
    )
  },
  align: 'center',
  headerAlign: 'center',
  minWidth: 210,
})
