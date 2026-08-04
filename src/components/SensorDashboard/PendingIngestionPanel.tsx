import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import type { GridColDef, GridRowSelectionModel } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'
import { useCan } from '@refinedev/core'
import { useEffect, useMemo, useState } from 'react'
import type { SensorSourceView } from '@/hooks/useSensorSources'
import type {
  IngestRun,
  IngestRunStatus,
  PendingBatch,
} from '@/interfaces/sensor-dashboard'
import { sensorSourceClient } from '@/providers/sensor-source-provider'
import { formatAppDateTime } from '@/utils/Date'
import { getErrorMessage } from '@/utils/getErrorMessage'

type Props = {
  source: SensorSourceView
  onIngested: () => void
}

type Row = PendingBatch & { id: string }

const EMPTY_SELECTION: GridRowSelectionModel = {
  type: 'include',
  ids: new Set(),
}

const TERMINAL_STATUSES: IngestRunStatus[] = ['succeeded', 'failed']

const RUN_POLL_INTERVAL_MS = 1500

const RUN_ALERT_SEVERITY: Record<
  IngestRunStatus,
  'info' | 'success' | 'error'
> = {
  queued: 'info',
  running: 'info',
  succeeded: 'success',
  failed: 'error',
}

/**
 * Data waiting in the vendor cloud that Ocotillo has not ingested yet, plus
 * the operator action to pull it in.
 */
export const PendingIngestionPanel = ({ source, onIngested }: Props) => {
  const [selection, setSelection] =
    useState<GridRowSelectionModel>(EMPTY_SELECTION)
  const [run, setRun] = useState<IngestRun | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Viewing pending data is read-only, but triggering a run writes to the
  // observation tables -- so the button needs its own check, not just the
  // route guard.
  const { data: ingestPermission } = useCan({
    resource: 'ocotillo.sensor-dashboard',
    action: 'create',
  })
  const canIngest = ingestPermission?.can ?? false

  // Poll the run until it settles so the operator sees the outcome, not just
  // an acknowledgement that the request was accepted. Refresh the pending
  // list once it succeeds -- the ingested batches should drop off.
  const runId = run?.runId
  const isRunSettled = run ? TERMINAL_STATUSES.includes(run.status) : true
  useEffect(() => {
    if (!runId || isRunSettled) return

    let cancelled = false
    const timer = setInterval(async () => {
      try {
        const latest = await sensorSourceClient.getIngestRun(
          source.config,
          runId
        )
        if (cancelled) return
        setRun(latest)
        if (latest.status === 'succeeded') onIngested()
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err))
      }
    }, RUN_POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [runId, isRunSettled, source.config, onIngested])

  const rows = useMemo<Row[]>(
    () => source.pending.map((batch) => ({ ...batch, id: batch.batchId })),
    [source.pending]
  )

  // MUI X v8 models selection as include/exclude sets, so an "exclude" model
  // means everything not listed rather than the listed rows.
  const selectedIds = useMemo(() => {
    if (selection.type === 'include') {
      return rows
        .filter((row) => selection.ids.has(row.id))
        .map((row) => row.id)
    }
    return rows.filter((row) => !selection.ids.has(row.id)).map((row) => row.id)
  }, [selection, rows])

  const columns = useMemo<GridColDef<Row>[]>(
    () => [
      { field: 'deviceLabel', headerName: 'Device', flex: 1, minWidth: 180 },
      { field: 'pointId', headerName: 'PointID', width: 120 },
      {
        field: 'startDatetime',
        headerName: 'From',
        width: 180,
        renderCell: ({ row }) => formatAppDateTime(row.startDatetime),
      },
      {
        field: 'endDatetime',
        headerName: 'To',
        width: 180,
        renderCell: ({ row }) => formatAppDateTime(row.endDatetime),
      },
      {
        field: 'recordCount',
        headerName: 'Records',
        width: 100,
        type: 'number',
      },
      { field: 'parameter', headerName: 'Parameter', width: 180 },
    ],
    []
  )

  const totalRecords = rows
    .filter((row) => selectedIds.includes(row.id))
    .reduce((sum, row) => sum + row.recordCount, 0)

  const handleIngest = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const started = await sensorSourceClient.triggerIngest(
        source.config,
        selectedIds
      )
      setRun(started)
      setSelection(EMPTY_SELECTION)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={1}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h6">{source.config.label}</Typography>
            <Typography variant="body2" color="text.secondary">
              Lands in {source.config.ingestion.targetResource}
            </Typography>
          </Box>

          <Tooltip
            title={canIngest ? '' : 'Requires the AMP Editor or Admin role'}
          >
            <span>
              <Button
                variant="contained"
                startIcon={<CloudDownloadIcon />}
                disabled={
                  !canIngest ||
                  !source.config.ingestion.allowManualTrigger ||
                  selectedIds.length === 0 ||
                  isSubmitting
                }
                onClick={handleIngest}
              >
                {selectedIds.length === 0
                  ? 'Select batches to ingest'
                  : `Ingest ${selectedIds.length} batch${
                      selectedIds.length === 1 ? '' : 'es'
                    } (${totalRecords} records)`}
              </Button>
            </span>
          </Tooltip>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {run && (
          <Alert
            severity={RUN_ALERT_SEVERITY[run.status]}
            sx={{ mb: 2 }}
            onClose={isRunSettled ? () => setRun(null) : undefined}
          >
            <Typography variant="body2">
              Run <code>{run.runId}</code> -- {run.status} -- covering{' '}
              {run.batchIds.length} batch
              {run.batchIds.length === 1 ? '' : 'es'}
              {typeof run.recordsIngested === 'number' &&
                `, ${run.recordsIngested} records ingested`}
              {run.message ? `. ${run.message}` : '.'}
            </Typography>
            {!isRunSettled && <LinearProgress sx={{ mt: 1 }} />}
          </Alert>
        )}

        {rows.length === 0 ? (
          <Alert severity="success" variant="outlined">
            Nothing pending -- Ocotillo is caught up with{' '}
            {source.config.vendor.name}.
          </Alert>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            loading={source.isLoading}
            checkboxSelection
            disableRowSelectionOnClick
            rowHeight={40}
            columnHeaderHeight={44}
            rowSelectionModel={selection}
            onRowSelectionModelChange={setSelection}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            pageSizeOptions={[10, 25, 50]}
            sx={{ minHeight: 200 }}
          />
        )}
      </CardContent>
    </Card>
  )
}
