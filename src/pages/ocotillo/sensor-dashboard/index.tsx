import RefreshIcon from '@mui/icons-material/Refresh'
import { Alert, Box, Button, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useState } from 'react'
import { AlertList } from '@/components/SensorDashboard/AlertList'
import { AlertSummaryTiles } from '@/components/SensorDashboard/AlertSummaryTiles'
import { DeviceGrid } from '@/components/SensorDashboard/DeviceGrid'
import { PendingIngestionPanel } from '@/components/SensorDashboard/PendingIngestionPanel'
import { SourceStatusCard } from '@/components/SensorDashboard/SourceStatusCard'
import type { AlertSeverity } from '@/config/sensor-sources'
import { useSensorSources } from '@/hooks/useSensorSources'
import { settings } from '@/settings'

/**
 * Unified alert platform for telemetered sensors.
 *
 * Two jobs, one per tab:
 *  1. Health & status -- is every logger alive and reporting sanely?
 *  2. Pending ingestion -- what data is sitting in a vendor cloud that
 *     Ocotillo has not pulled in yet, and pull it.
 *
 * Sources come from `src/config/sensor-sources`. Nothing here knows about a
 * specific vendor.
 */
export const SensorDashboardPage = () => {
  const [tab, setTab] = useState(0)
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | null>(
    null
  )
  const { sources, alerts, summary, pending, isLoading, refetch } =
    useSensorSources()

  const totalPending = pending.reduce(
    (sum, batch) => sum + batch.recordCount,
    0
  )

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1}
        sx={{ mb: 1 }}
      >
        <Box>
          <Typography variant="h4">Sensor Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Health and pending data across {sources.length} telemetered sensor
            source{sources.length === 1 ? '' : 's'}.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => void refetch()}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Stack>

      {settings.sensor_mock && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>Demo data.</strong> The OcotilloAPI sensor-source endpoints do
          not exist yet, so every device, reading, and pending batch on this
          page is generated -- no real sensor is being described. Triggering an
          ingestion run does not write anything.
        </Alert>
      )}

      <Tabs
        value={tab}
        onChange={(_event, next: number) => setTab(next)}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Health & status" />
        <Tab
          label={`New data for ingestion${
            pending.length ? ` (${pending.length})` : ''
          }`}
        />
      </Tabs>

      {tab === 0 && (
        <Stack spacing={3}>
          <AlertSummaryTiles
            summary={summary}
            selected={severityFilter}
            onSelect={setSeverityFilter}
          />

          <AlertList alerts={alerts} />

          {sources.map((source) => (
            <Stack key={source.sourceId} spacing={1}>
              <SourceStatusCard source={source} />
              <DeviceGrid
                source={source.config}
                devices={source.devices}
                alerts={source.alerts}
                isLoading={source.isLoading}
                severityFilter={severityFilter}
              />
            </Stack>
          ))}
        </Stack>
      )}

      {tab === 1 && (
        <Stack spacing={3}>
          <Typography variant="body2" color="text.secondary">
            {pending.length} batch{pending.length === 1 ? '' : 'es'} awaiting
            ingestion, {totalPending} record
            {totalPending === 1 ? '' : 's'} total.
          </Typography>

          {/* `refetch` is memoized -- an inline arrow here would reset the
              panel's run-polling effect on every render. */}
          {sources.map((source) => (
            <PendingIngestionPanel
              key={source.sourceId}
              source={source}
              onIngested={refetch}
            />
          ))}
        </Stack>
      )}
    </Box>
  )
}

export default SensorDashboardPage
