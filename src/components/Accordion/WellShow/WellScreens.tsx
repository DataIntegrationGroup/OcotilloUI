import { useMemo } from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { useDataGrid } from '@refinedev/mui'
import { MoreVertOutlined } from '@mui/icons-material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { actionColumnDef } from '@/components/CommonColumnDefs'
import { settings } from '@/settings'

export const WellScreensAccordion = ({ id }: { id?: number }) => {
  const { dataGridProps } = useDataGrid({
    resource: 'thing/well-screen',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_id: id,
      },
    },
  })

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'screen_type', headerName: 'Screen Type', minWidth: 150 },
      {
        field: 'screen_depth_top',
        headerName: 'Screen Top Depth (ft)',
        type: 'number',
        minWidth: 150,
      },
      {
        field: 'screen_depth_bottom',
        headerName: 'Screen Bottom Depth (ft)',
        type: 'number',
        minWidth: 200,
      },
      actionColumnDef({ resource: 'ocotillo.thing/well-screen' }),
    ],
    []
  )

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <MoreVertOutlined color="primary" />
        <Typography variant="body1" fontWeight="bold">
          Well Screens
        </Typography>
      </Box>
      <Box sx={{ p: 3 }}>
        <DataGrid
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
