import { useMemo } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography,
} from '@mui/material'
import {
  CreateButton,
  DeleteButton,
  EditButton,
  ShowButton,
  useDataGrid,
} from '@refinedev/mui'
import { ExpandMore, SettingsInputAntenna } from '@mui/icons-material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { settings } from '@/settings'
import { ISensor } from '@/interfaces/ocotillo/ISensor'

interface MergedRow {
  id: number | string
  sensor_id?: number
  sensor_name?: number | string
  sensor_model?: string
  serial_no?: string
  recording_interval: string
  recording_interval_display: string
  installation_date?: string | null
  removal_date?: string | null
  isUnattached?: boolean
}

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
      cacheTime: 10 * 60 * 1000, // cached data for 10 minutes
      staleTime: 5 * 60 * 1000, // get data fresh for 5 minutes,
    },
  })

  const { dataGridProps: deploymentsDataGridProps } = useDataGrid({
    resource: `thing/${id}/deployment`,
    dataProviderName: 'ocotillo',
    queryOptions: {
      cacheTime: 10 * 60 * 1000, // cached data for 10 minutes
      staleTime: 5 * 60 * 1000, // get data fresh for 5 minutes,
    },
  })

  const deployments = deploymentsDataGridProps?.rows ?? []
  const sensors = sensorDataGridProps?.rows ?? []

  const mergedRows: MergedRow[] = useMemo(() => {
    // Collect all sensor IDs already linked in deployments
    const deployedSensorIds = new Set(
      deployments.map((d: { sensor: ISensor }) => d.sensor?.id).filter(Boolean)
    )

    // Find sensors NOT linked to any deployment
    const unattachedSensors = sensors
      .filter((s: any) => !deployedSensorIds.has(s.id))
      .map((s: any) => ({
        // Match deployment row shape
        id: `sensor-${s.id}`, // prefix to avoid ID collision
        sensor: s,
        thing_id: s.thing_id,
        installation_date: null,
        removal_date: null,
        release_status: s.release_status,
        notes: null,
        isUnattached: true,
      }))

    return [...deployments, ...unattachedSensors].map((r) => ({
      ...r,
      sensor_id: r.sensor?.id ?? null,
      sensor_name: r.sensor?.name ?? '(unattached)',
      sensor_model: r.sensor?.model ?? '-',
      serial_no: r.sensor?.serial_no ?? '-',
      datetime_installed: r.installation_date ?? null,
      datetime_removed: r.removal_date ?? null,
      recording_interval_display: r.recording_interval
        ? `${r.recording_interval} ${r.recording_interval_units}`
        : null,
    }))
  }, [deployments, sensors])

  const columns = useMemo<GridColDef<MergedRow>[]>(
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
        field: 'notes',
        headerName: 'Notes',
        type: 'string',
        minWidth: 150,
        flex: 2,
      },
      {
        field: 'actions',
        headerName: 'Actions',
        renderCell: function render({ row }) {
          return (
            <Box component="div" sx={{ display: 'flex', gap: '8px' }}>
              <EditButton
                resource="ocotillo.sensor"
                size="small"
                hideText
                recordItemId={row.sensor_id}
                variant="outlined"
                sx={{ maxWidth: 50, maxHeight: 5, px: 1 }}
              />
              <ShowButton
                resource="ocotillo.sensor"
                size="small"
                hideText
                recordItemId={row.sensor_id}
                variant="outlined"
                sx={{ maxWidth: 50, maxHeight: 5, px: 1 }}
              />
              <DeleteButton
                resource="ocotillo.sensor"
                size="small"
                hideText
                recordItemId={row.sensor_id}
                variant="outlined"
                sx={{ maxWidth: 50, maxHeight: 5, px: 1 }}
              />
            </Box>
          )
        },
        align: 'center',
        headerAlign: 'center',
        minWidth: 210,
      },
    ],
    []
  )

  return (
    <Accordion defaultExpanded elevation={2}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: '100%' }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <SettingsInputAntenna color="primary" />
            <Typography variant="body1" fontWeight="bold">
              Equipment
            </Typography>
          </Stack>
          <CreateButton resource="ocotillo.contact" />
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3 }}>
        <DataGrid<MergedRow>
          rowHeight={settings.rowHeight}
          rows={mergedRows ?? []}
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
      </AccordionDetails>
    </Accordion>
  )
}
