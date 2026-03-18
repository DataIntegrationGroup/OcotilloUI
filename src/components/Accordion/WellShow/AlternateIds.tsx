import { useMemo } from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'
import type { UseDataGridReturnType } from '@refinedev/mui'
import { CreateButton } from '@refinedev/mui'
import { MoreVertOutlined } from '@mui/icons-material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { settings } from '@/settings'

export const AlternateIdsAccordion = ({
  dataGridProps,
}: {
  dataGridProps: UseDataGridReturnType['dataGridProps']
}) => {
  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'alternate_id', headerName: 'Alternate ID', minWidth: 150 },
      {
        field: 'alternate_organization',
        headerName: 'Organization',
        minWidth: 150,
      },
      { field: 'relation', headerName: 'Relation', minWidth: 150 },
    ],
    []
  )

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <MoreVertOutlined color="primary" />
          <Typography variant="body1" fontWeight="bold">
            Alternate IDs
          </Typography>
        </Stack>
        {/* disabled until id-link CRUD completed */}
        <CreateButton disabled resource="ocotillo.thing/id-link" />
      </Box>
      <Box sx={{ p: 3 }}>
        <DataGrid
          {...dataGridProps}
          rowHeight={settings.rowHeight}
          rows={dataGridProps.rows ?? []}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f0f0f0',
            },
          }}
        />
      </Box>
    </Paper>
  )
}
