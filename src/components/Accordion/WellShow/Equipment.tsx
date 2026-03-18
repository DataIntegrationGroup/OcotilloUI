import { useMemo } from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { DeleteButton, EditButton, ShowButton, useDataGrid } from '@refinedev/mui'
import { SettingsInputAntenna } from '@mui/icons-material'
import {
  DataGrid,
  GridColDef,
  GridToolbarContainer,
  GridToolbarDensitySelector,
} from '@mui/x-data-grid'
import { settings } from '@/settings'
import { ISensor } from '@/interfaces/ocotillo'
import { useSensorDeploymentRows } from '@/hooks'
import { SensorDeploymentRow } from '@/utils'

const EquipmentToolbar = () => (
  <GridToolbarContainer sx={{ justifyContent: 'flex-end', px: 1, py: 0.5 }}>
    <GridToolbarDensitySelector />
  </GridToolbarContainer>
)

export const EquipmentAccordion = ({ id }: { id?: number }) => {
  const { dataGridProps: sensorDataGridProps } = useDataGrid<ISensor>({
    resource: 'sensor',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_id: id,
      },
    },
    queryOptions: {
      gcTime: 10 * 60 * 1000, // cached data for 10 minutes
      staleTime: 5 * 60 * 1000, // get data fresh for 5 minutes,
    },
  })

  const { dataGridProps: deploymentsDataGridProps } = useDataGrid({
    resource: id ? `thing/${id}/deployment` : undefined,
    dataProviderName: 'ocotillo',
    queryOptions: {
      enabled: Boolean(id),
      gcTime: 10 * 60 * 1000, // cached data for 10 minutes
      staleTime: 5 * 60 * 1000, // get data fresh for 5 minutes,
    },
  })

  const deployments = deploymentsDataGridProps?.rows ?? []
  const sensors = sensorDataGridProps?.rows ?? []

  const sensorDeployments: SensorDeploymentRow[] = useSensorDeploymentRows({
    deployments,
    sensors,
  })

  const columns = useMemo<GridColDef<SensorDeploymentRow>[]>(
    () => [
      {
        field: 'sensor_name',
        headerName: 'Name',
        type: 'string',
        minWidth: 100,
        maxWidth: 150,
        flex: 1,
      },
      {
        field: 'sensor_model',
        headerName: 'Model',
        type: 'string',
        minWidth: 100,
        flex: 1,
      },
      {
        field: 'serial_no',
        headerName: 'Serial No',
        type: 'string',
        minWidth: 100,
        flex: 1,
      },
      {
        field: 'installation_date',
        headerName: 'Date Installed',
        type: 'string',
        minWidth: 120,
        flex: 1,
      },
      {
        field: 'removal_date',
        headerName: 'Date Removed',
        type: 'string',
        minWidth: 120,
        flex: 1,
      },
      {
        field: 'recording_interval_display',
        headerName: 'Recording Interval',
        type: 'number',
        minWidth: 100,
        flex: 1,
      },
      {
        field: 'hanging_cable_length',
        headerName: 'Hanging Cable Length',
        type: 'number',
        minWidth: 100,
        flex: 1,
      },
      {
        field: 'notes',
        headerName: 'Notes',
        type: 'string',
        minWidth: 150,
        flex: 2,
      },
    ],
    []
  )

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsInputAntenna color="primary" />
        <Typography variant="body1" fontWeight="bold">
          Equipment
        </Typography>
      </Box>
      <Box sx={{ px: 2, py: 1, pb: 3 }}>
        <DataGrid<SensorDeploymentRow>
          rowHeight={settings.rowHeight}
          rows={sensorDeployments ?? []}
          columns={columns}
          slots={{ toolbar: EquipmentToolbar }}
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
