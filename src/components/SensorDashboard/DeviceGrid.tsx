import { Chip, Stack, Tooltip, Typography } from '@mui/material'
import type { GridColDef } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'
import { useMemo } from 'react'
import type { AlertSeverity, SensorSourceConfig } from '@/config/sensor-sources'
import { SEVERITY_ORDER } from '@/config/sensor-sources'
import type { SensorAlert, SensorDevice } from '@/interfaces/sensor-dashboard'
import { formatAppDateTime } from '@/utils/Date'
import { formatAge, minutesSince, worstSeverity } from './sensorAlerts'
import { SEVERITY_COLOR, SEVERITY_LABEL } from './severity'

type Props = {
  source: SensorSourceConfig
  devices: SensorDevice[]
  alerts: SensorAlert[]
  isLoading: boolean
  /** Show only devices at this severity. Null shows everything. */
  severityFilter: AlertSeverity | null
}

type Row = SensorDevice & {
  id: string
  severity: AlertSeverity
  deviceAlerts: SensorAlert[]
}

const relativeCell = (value: string | null | undefined) => {
  if (!value) return <Typography variant="body2">--</Typography>
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return <Typography variant="body2">--</Typography>
  }
  return (
    <Tooltip title={formatAppDateTime(value)}>
      <Typography variant="body2">
        {formatAge(minutesSince(parsed, new Date()))} ago
      </Typography>
    </Tooltip>
  )
}

/**
 * Device table for a single source. Metric columns come from the source
 * config, so a new source renders its own columns with no change here.
 */
export const DeviceGrid = ({
  source,
  devices,
  alerts,
  isLoading,
  severityFilter,
}: Props) => {
  const rows = useMemo<Row[]>(() => {
    const byDevice = new Map<string, SensorAlert[]>()
    for (const alert of alerts) {
      const existing = byDevice.get(alert.deviceId)
      if (existing) existing.push(alert)
      else byDevice.set(alert.deviceId, [alert])
    }

    return devices
      .map((device) => {
        const deviceAlerts = byDevice.get(device.deviceId) ?? []
        return {
          ...device,
          id: device.deviceId,
          severity: worstSeverity(deviceAlerts),
          deviceAlerts,
        }
      })
      .filter((row) => !severityFilter || row.severity === severityFilter)
  }, [devices, alerts, severityFilter])

  const columns = useMemo<GridColDef<Row>[]>(() => {
    const base: GridColDef<Row>[] = [
      {
        field: 'severity',
        headerName: 'Status',
        width: 130,
        // Severity is a string, so the default comparator would sort it
        // alphabetically (critical < ok < warning). Rank it instead.
        sortComparator: (a: AlertSeverity, b: AlertSeverity) =>
          SEVERITY_ORDER.indexOf(a) - SEVERITY_ORDER.indexOf(b),
        renderCell: ({ row }) => (
          <Tooltip
            title={
              row.deviceAlerts.length
                ? row.deviceAlerts
                    .map((a) => `${a.label}: ${a.detail}`)
                    .join('\n')
                : 'No alerts'
            }
          >
            <Chip
              size="small"
              color={SEVERITY_COLOR[row.severity]}
              variant={row.severity === 'ok' ? 'outlined' : 'filled'}
              label={
                row.deviceAlerts.length
                  ? `${SEVERITY_LABEL[row.severity]} (${row.deviceAlerts.length})`
                  : SEVERITY_LABEL[row.severity]
              }
            />
          </Tooltip>
        ),
      },
      { field: 'label', headerName: 'Device', flex: 1, minWidth: 180 },
      { field: 'pointId', headerName: 'PointID', width: 120 },
      { field: 'serialNumber', headerName: 'Serial', width: 110 },
      {
        field: 'lastCommunicationAt',
        headerName: 'Last contact',
        width: 130,
        renderCell: ({ row }) => relativeCell(row.lastCommunicationAt),
      },
      {
        field: 'lastObservationAt',
        headerName: 'Last reading',
        width: 130,
        renderCell: ({ row }) => relativeCell(row.lastObservationAt),
      },
    ]

    const metricColumns: GridColDef<Row>[] = source.metrics
      .filter((metric) => !metric.hidden)
      .map((metric) => ({
        field: `metric:${metric.key}`,
        headerName: metric.unit
          ? `${metric.label} (${metric.unit})`
          : metric.label,
        width: 130,
        type: 'number' as const,
        // Metrics live in a nested record, so the grid needs an explicit
        // accessor to sort and filter on them.
        valueGetter: (_value, row: Row) => row.metrics[metric.key] ?? null,
        renderCell: ({ row }) => {
          const value = row.metrics[metric.key]
          return typeof value === 'number' && Number.isFinite(value)
            ? value.toFixed(metric.precision)
            : '--'
        },
      }))

    return [...base, ...metricColumns]
  }, [source.metrics])

  return (
    <Stack spacing={1}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={isLoading}
        // The shared `settings.rowHeight` (27px) is tuned for plain text rows
        // and crops the status chips, so this grid sets its own.
        rowHeight={44}
        columnHeaderHeight={44}
        disableRowSelectionOnClick
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
          sorting: { sortModel: [{ field: 'severity', sort: 'desc' }] },
        }}
        pageSizeOptions={[25, 50, 100]}
        sx={{ minHeight: 240 }}
      />
    </Stack>
  )
}
