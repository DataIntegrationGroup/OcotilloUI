import { useEffect, useMemo, useState } from 'react'
import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import { SettingsInputAntenna } from '@mui/icons-material'
import {
  DataGrid,
  GridColDef,
  GridRowId,
  GridToolbarContainer,
  GridToolbarDensitySelector,
} from '@mui/x-data-grid'
import { settings } from '@/settings'
import { ISensor } from '@/interfaces/ocotillo'
import { useSensorDeploymentRows } from '@/hooks'
import { SensorDeploymentRow } from '@/utils'
import { formatAppDate } from '@/utils'

const EquipmentToolbar = () => (
  <GridToolbarContainer sx={{ justifyContent: 'flex-end', px: 0.25, py: 0 }}>
    <GridToolbarDensitySelector />
  </GridToolbarContainer>
)

export const EquipmentAccordion = ({
  sensors,
  deployments,
  isLoading,
}: {
  sensors: ISensor[]
  deployments: any[]
  isLoading: boolean
}) => {
  const [selectedEquipmentId, setSelectedEquipmentId] =
    useState<GridRowId | null>(null)

  const sensorDeployments: SensorDeploymentRow[] = useSensorDeploymentRows({
    deployments,
    sensors,
  })

  useEffect(() => {
    if (!sensorDeployments.length) {
      setSelectedEquipmentId(null)
      return
    }

    setSelectedEquipmentId((current) => {
      const stillExists = sensorDeployments.some((row) => row.id === current)
      return stillExists ? current : sensorDeployments[0].id
    })
  }, [sensorDeployments])

  const selectedEquipment =
    sensorDeployments.find((row) => row.id === selectedEquipmentId) ?? null

  const columns = useMemo<GridColDef<SensorDeploymentRow>[]>(
    () => [
      {
        field: 'sensor_model',
        headerName: 'Model',
        type: 'string',
        minWidth: 76,
        flex: 1,
      },
      {
        field: 'serial_no',
        headerName: 'Serial No',
        type: 'string',
        minWidth: 64,
        flex: 0.85,
      },
      {
        field: 'installation_date',
        headerName: 'Install',
        type: 'string',
        minWidth: 82,
        flex: 1,
      },
      {
        field: 'removal_date',
        headerName: 'Remove',
        type: 'string',
        minWidth: 82,
        flex: 1,
      },
      {
        field: 'recording_interval_display',
        headerName: 'Interval',
        type: 'number',
        minWidth: 74,
        flex: 0.9,
      },
      {
        field: 'hanging_cable_length',
        headerName: 'Cable Len',
        type: 'number',
        minWidth: 78,
        flex: 0.95,
      },
    ],
    []
  )

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box
        sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <SettingsInputAntenna color="primary" />
        <Typography variant="body1" fontWeight="bold">
          Equipment
        </Typography>
      </Box>
      <Box sx={{ px: 2, py: 1, pb: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 2,
            alignItems: 'start',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <DataGrid<SensorDeploymentRow>
              rowHeight={28}
              rows={sensorDeployments ?? []}
              columns={columns}
              slots={{ toolbar: EquipmentToolbar }}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                density: 'compact',
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
              }}
              loading={isLoading}
              rowSelectionModel={
                selectedEquipmentId != null
                  ? { type: 'include', ids: new Set([selectedEquipmentId]) }
                  : { type: 'include', ids: new Set() }
              }
              onRowClick={(params) => setSelectedEquipmentId(params.id)}
              sx={{
                border: 'none',
                width: '100%',
                '& .MuiDataGrid-columnHeaders': {
                  minHeight: '28px !important',
                  maxHeight: '28px !important',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontSize: '0.68rem',
                  lineHeight: 1.1,
                },
                '& .MuiDataGrid-columnHeader, & .MuiDataGrid-cell': {
                  px: 0.5,
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f0f0f0',
                  py: 0,
                  fontSize: '0.72rem',
                  lineHeight: 1.1,
                  display: 'flex',
                  alignItems: 'center',
                  whiteSpace: 'nowrap',
                },
                '& .MuiDataGrid-row': {
                  cursor: 'pointer',
                },
                '& .MuiDataGrid-toolbarContainer': {
                  minHeight: 24,
                  '& .MuiButtonBase-root': {
                    fontSize: '0.72rem',
                    p: 0.25,
                  },
                },
              }}
            />
          </Box>

          {selectedEquipment && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                borderColor: 'divider',
                position: { lg: 'sticky' },
                top: { lg: 16 },
              }}
            >
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    flexWrap: 'wrap',
                  }}
                >
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Selected Equipment
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedEquipment.sensor_type !== '-'
                        ? selectedEquipment.sensor_type
                        : 'Type unavailable'}
                    </Typography>
                  </Box>
                  {selectedEquipment.isUnattached && (
                    <Chip size="small" label="Unattached" color="warning" />
                  )}
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: 'repeat(2, minmax(0, 1fr))',
                    },
                    gap: 2,
                  }}
                >
                  <DetailSection title="Sensor Details">
                    <DetailRow
                      label="Model"
                      value={selectedEquipment.sensor_model}
                    />
                    <DetailRow
                      label="Serial No"
                      value={selectedEquipment.serial_no}
                    />
                  </DetailSection>

                  <DetailSection title="Deployment">
                    <DetailRow
                      label="Install"
                      value={
                        formatAppDate(selectedEquipment.installation_date) ||
                        'N/A'
                      }
                    />
                    <DetailRow
                      label="Remove"
                      value={
                        formatAppDate(selectedEquipment.removal_date) || 'N/A'
                      }
                    />
                    <DetailRow
                      label="Cable Len."
                      value={
                        selectedEquipment.hanging_cable_length != null
                          ? String(selectedEquipment.hanging_cable_length)
                          : 'N/A'
                      }
                    />
                  </DetailSection>

                  <DetailSection title="Recording">
                    <DetailRow
                      label="Interval"
                      value={
                        selectedEquipment.recording_interval_display || 'N/A'
                      }
                    />
                  </DetailSection>

                  <DetailSection title="Notes">
                    <Typography variant="body2" color="text.secondary">
                      {selectedEquipment.notes &&
                      selectedEquipment.notes !== '-'
                        ? selectedEquipment.notes
                        : 'N/A'}
                    </Typography>
                  </DetailSection>
                </Box>
              </Stack>
            </Paper>
          )}
        </Box>
      </Box>
    </Paper>
  )
}

const DetailSection = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <Box>
    <Typography
      variant="overline"
      color="text.secondary"
      sx={{ display: 'block', mb: 1, letterSpacing: 1 }}
    >
      {title}
    </Typography>
    <Stack spacing={0.75}>{children}</Stack>
  </Box>
)

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: 0.75,
      alignItems: 'start',
      minWidth: 0,
    }}
  >
    <Typography variant="caption" color="text.secondary" fontWeight={700}>
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        minWidth: 0,
      }}
    >
      {value}
    </Typography>
  </Box>
)
