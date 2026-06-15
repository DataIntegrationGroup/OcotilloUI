import { Box, Chip } from '@mui/material'
import { DeleteButton, EditButton, ShowButton } from '@refinedev/mui'
import { GridColDef } from '@mui/x-data-grid'

type ChipColor = 'default' | 'success' | 'warning' | 'error' | 'info'

const RELEASE_STATUS_COLOR: Record<string, ChipColor> = {
  draft:       'default',
  provisional: 'info',
  final:       'success',
  published:   'success',
  public:      'success',
  archived:    'warning',
  private:     'error',
}

export const releaseStatusColumnDef = <
  T extends object,
>(overrides: Partial<GridColDef<T>> = {}): GridColDef<T> => ({
  field: 'release_status',
  headerName: 'Release Status',
  type: 'string',
  width: 145,
  renderCell: (params) =>
    params.value ? (
      <Chip
        label={params.value}
        size="small"
        color={RELEASE_STATUS_COLOR[params.value] ?? 'default'}
      />
    ) : null,
  ...overrides,
})

export const idColumnDef = <
  T extends { id: string | number },
>(): GridColDef<T> => ({
  field: 'id',
  headerName: 'ID',
  type: 'string',
  width: 100,
})

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
