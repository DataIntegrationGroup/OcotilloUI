import { useEffect, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { CloudDownload } from '@mui/icons-material'
import { IWell } from '@/interfaces/ocotillo'
import { TransducerObservationWithBlockResponse } from '@/generated/types.gen'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import {
  fetchWellntelReadings,
  isWellntelConfigured,
  toHydrographPoints,
} from '@/providers/wellntel-data-provider'
import type { HydrographPoint } from '@/components/Hydrographs/hydrographCorrection'
import {
  DEMO_WELLNTEL_LAST_INGESTED,
  DEMO_WELLNTEL_WELLS,
  generateDemoWellntelReadings,
} from './demoData'

export interface WellntelIngestResult {
  well: IWell | null
  wellName: string
  measurements: HydrographPoint[]
  isDemo: boolean
}

interface WellntelWellOption {
  key: string
  label: string
  wellName: string
  well: IWell | null
}

const toLocalInputValue = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const demoOptions: WellntelWellOption[] = DEMO_WELLNTEL_WELLS.map((well) => ({
  key: `demo-${well.name}`,
  label: `${well.name} — ${well.description} (demo)`,
  wellName: well.name,
  well: null,
}))

export const WellntelIngestDialog = ({
  open,
  onClose,
  onIngested,
}: {
  open: boolean
  onClose: () => void
  onIngested: (result: WellntelIngestResult) => void
}) => {
  const [wellOptions, setWellOptions] = useState<WellntelWellOption[]>([])
  const [isDemoSource, setIsDemoSource] = useState(false)
  const [isLoadingWells, setIsLoadingWells] = useState(false)
  const [selectedOption, setSelectedOption] =
    useState<WellntelWellOption | null>(null)
  const [startValue, setStartValue] = useState('')
  const [endValue, setEndValue] = useState('')
  const [lastIngested, setLastIngested] = useState<Date | null>(null)
  const [isResolvingBounds, setIsResolvingBounds] = useState(false)
  const [isRetrieving, setIsRetrieving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Discover wells with an installed Wellntel (Acoustic Sounder) sensor.
  // The sensor_type query parameter on /thing is proposed alongside the
  // upload contract; until the backend supports it (or when it returns
  // nothing, as on an empty local database), the dialog falls back to the
  // known demo wells so the flow stays demonstrable.
  useEffect(() => {
    if (!open) return

    let cancelled = false
    setIsLoadingWells(true)
    setError(null)
    ;(async () => {
      try {
        const response = await ocotilloDataProvider.getList({
          resource: 'thing',
          pagination: { currentPage: 1, pageSize: 100 },
          meta: { params: { sensor_type: 'Acoustic Sounder' } },
        })
        const wells = (response.data as IWell[]).filter((well) => well?.name)
        if (wells.length === 0) throw new Error('no acoustic wells')
        if (cancelled) return

        setWellOptions(
          wells.map((well) => ({
            key: `well-${well.id}`,
            label: well.name,
            wellName: well.name,
            well,
          }))
        )
        setIsDemoSource(false)
      } catch {
        if (cancelled) return
        setWellOptions(demoOptions)
        setIsDemoSource(true)
      } finally {
        if (!cancelled) setIsLoadingWells(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open])

  // Default the time bounds when a well is picked: start at the last
  // ingested measurement for that well, end now.
  useEffect(() => {
    if (!selectedOption) {
      setLastIngested(null)
      setStartValue('')
      setEndValue('')
      return
    }

    let cancelled = false
    ;(async () => {
      let last: Date | null = null

      if (selectedOption.well) {
        setIsResolvingBounds(true)
        try {
          const response = await ocotilloDataProvider.getList({
            resource: 'observation/transducer-groundwater-level',
            pagination: { currentPage: 1, pageSize: 1 },
            sorters: [{ field: 'observation_datetime', order: 'desc' }],
            meta: { params: { thing_id: selectedOption.well.id } },
          })
          const first = (
            response.data as TransducerObservationWithBlockResponse[]
          )[0]
          if (first?.observation?.observation_datetime) {
            const parsed = new Date(first.observation.observation_datetime)
            if (!Number.isNaN(parsed.getTime())) last = parsed
          }
        } catch {
          last = null
        }
      } else {
        last = new Date(DEMO_WELLNTEL_LAST_INGESTED)
      }

      if (cancelled) return
      setIsResolvingBounds(false)
      setLastIngested(last)

      const start =
        last ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      const end = selectedOption.well
        ? new Date()
        : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000)
      setStartValue(toLocalInputValue(start))
      setEndValue(toLocalInputValue(end))
    })()

    return () => {
      cancelled = true
    }
  }, [selectedOption])

  const handleRetrieve = async () => {
    if (!selectedOption) return

    const start = new Date(startValue)
    const end = new Date(endValue)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError('Enter valid start and end datetimes.')
      return
    }
    if (start.getTime() >= end.getTime()) {
      setError('The start of the range must be before the end.')
      return
    }

    setIsRetrieving(true)
    setError(null)
    try {
      let measurements: HydrographPoint[]

      if (selectedOption.well && isWellntelConfigured()) {
        // Direct Wellntel analytics API access (ported from wellpy),
        // scoped to the selected well's PointID.
        const readings = await fetchWellntelReadings({
          start,
          end,
          pointId: selectedOption.wellName,
        })
        measurements = toHydrographPoints(readings)
      } else if (selectedOption.well) {
        // Proposed Ocotillo proxy for the Wellntel analytics API (keeps the
        // Wellntel API key server-side); shape mirrors the wcsv export:
        // rows with timestamp and depth.
        const response = await ocotilloDataProvider.getList({
          resource: 'wellntel/readings',
          pagination: { currentPage: 1, pageSize: 10000 },
          meta: {
            params: {
              thing_id: selectedOption.well.id,
              start_time: start.toISOString(),
              end_time: end.toISOString(),
            },
          },
        })
        measurements = (
          response.data as Array<{ timestamp: string; depth: number }>
        )
          .map((row) => ({
            time: new Date(row.timestamp),
            value: Number(row.depth),
          }))
          .filter(
            (point) =>
              !Number.isNaN(point.time.getTime()) &&
              Number.isFinite(point.value)
          )
      } else {
        measurements = generateDemoWellntelReadings(start, end)
      }

      if (measurements.length === 0) {
        setError('No Wellntel readings were returned for that range.')
        return
      }

      onIngested({
        well: selectedOption.well,
        wellName: selectedOption.wellName,
        measurements,
        isDemo: !selectedOption.well,
      })
    } catch {
      setError(
        isWellntelConfigured()
          ? 'Unable to retrieve readings from the Wellntel API.'
          : 'Unable to retrieve Wellntel readings. Configure VITE_WELLNTEL_API_KEY for direct access, or wait for the Ocotillo Wellntel proxy endpoint.'
      )
    } finally {
      setIsRetrieving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Ingest Wellntel Readings</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {isDemoSource ? (
            <Alert severity="info">
              No Ocotillo wells with an installed Wellntel (Acoustic Sounder)
              sensor were found — showing demo wells with synthetic readings.
            </Alert>
          ) : null}

          {error ? <Alert severity="warning">{error}</Alert> : null}

          <Autocomplete
            options={wellOptions}
            loading={isLoadingWells}
            value={selectedOption}
            isOptionEqualToValue={(option, value) => option.key === value.key}
            onChange={(_event, value) => setSelectedOption(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Well"
                placeholder="Wells with a Wellntel sensor installed"
              />
            )}
            noOptionsText="No wells with a Wellntel sensor found"
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              fullWidth
              type="datetime-local"
              label="Start"
              value={startValue}
              onChange={(event) => setStartValue(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={!selectedOption || isResolvingBounds}
            />
            <TextField
              fullWidth
              type="datetime-local"
              label="End"
              value={endValue}
              onChange={(event) => setEndValue(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={!selectedOption || isResolvingBounds}
            />
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {isResolvingBounds ? (
              <Chip size="small" color="info" label="Finding last ingested measurement..." />
            ) : lastIngested ? (
              <Chip
                size="small"
                label={`Last ingested: ${lastIngested.toLocaleString()}`}
              />
            ) : selectedOption ? (
              <Chip
                size="small"
                variant="outlined"
                label="No previous measurements — defaulting to the last 90 days"
              />
            ) : null}
          </Stack>

          <Typography variant="caption" color="text.secondary">
            The start bound defaults to the timestamp of the last ingested
            measurement for the selected well, so each ingest continues where
            the previous one left off.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<CloudDownload />}
          onClick={handleRetrieve}
          disabled={!selectedOption || isRetrieving || isResolvingBounds}
        >
          {isRetrieving ? 'Retrieving...' : 'Retrieve & Load'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
