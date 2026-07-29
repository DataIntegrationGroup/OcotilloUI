import { useEffect, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { CloudDownload } from '@mui/icons-material'
import { IWell } from '@/interfaces/ocotillo'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import {
  fetchDiverHubLocations,
  fetchDiverHubWaterLevels,
  toDepthToWaterPoints,
  type DiverHubLocation,
  type DiverHubMonitoringPointInfo,
} from '@/providers/diverhub-data-provider'
import { normalizePointId } from '@/components/Hydrographs/hydrographCorrection'
import type { HydrographPoint } from '@/components/Hydrographs/hydrographCorrection'
import {
  DEMO_DIVERHUB_LOCATIONS,
  DEMO_WELLNTEL_LAST_INGESTED,
  generateDemoDiverHubReadings,
} from './demoData'

export interface DiverHubIngestResult {
  well: IWell | null
  wellName: string
  measurements: HydrographPoint[]
  isDemo: boolean
}

const toLocalInputValue = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const locationLabel = (location: DiverHubLocation) =>
  `${location.projectName || 'No project'} / ${location.name}`

export const DiverHubIngestDialog = ({
  open,
  onClose,
  onIngested,
}: {
  open: boolean
  onClose: () => void
  onIngested: (result: DiverHubIngestResult) => void
}) => {
  const [locations, setLocations] = useState<DiverHubLocation[]>([])
  const [isDemoSource, setIsDemoSource] = useState(false)
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)
  const [selectedLocation, setSelectedLocation] =
    useState<DiverHubLocation | null>(null)
  const [selectedPoint, setSelectedPoint] =
    useState<DiverHubMonitoringPointInfo | null>(null)
  const [resolvedWell, setResolvedWell] = useState<IWell | null>(null)
  const [includeUnapproved, setIncludeUnapproved] = useState(false)
  const [startValue, setStartValue] = useState('')
  const [endValue, setEndValue] = useState('')
  const [isRetrieving, setIsRetrieving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load Diver-HUB locations on open; fall back to demo locations when the
  // API is unreachable (network, CORS, or authorization).
  useEffect(() => {
    if (!open) return

    let cancelled = false
    setIsLoadingLocations(true)
    setError(null)
    ;(async () => {
      try {
        const fetched = (await fetchDiverHubLocations()).filter(
          (location) => location.isActive
        )
        if (fetched.length === 0) throw new Error('no locations')
        if (cancelled) return
        setLocations(fetched)
        setIsDemoSource(false)
      } catch {
        if (cancelled) return
        setLocations(DEMO_DIVERHUB_LOCATIONS)
        setIsDemoSource(true)
      } finally {
        if (!cancelled) setIsLoadingLocations(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open])

  // When a location is picked: auto-select its only monitoring point, try
  // to resolve the matching Ocotillo well by name, and default the range —
  // from the last ingested Ocotillo measurement when one exists.
  useEffect(() => {
    setSelectedPoint(null)
    setResolvedWell(null)
    setStartValue('')
    setEndValue('')
    if (!selectedLocation) return

    const activePoints = selectedLocation.monitoringPoints.filter(
      (point) => point.isActive
    )
    if (activePoints.length === 1) setSelectedPoint(activePoints[0])

    let cancelled = false
    ;(async () => {
      let well: IWell | null = null
      let lastIngested: Date | null = null

      if (!isDemoSource) {
        try {
          const response = await ocotilloDataProvider.getList({
            resource: 'thing',
            pagination: { currentPage: 1, pageSize: 25 },
            filters: [
              {
                field: 'name',
                operator: 'contains',
                value: selectedLocation.name,
              },
            ],
          })
          well =
            (response.data as IWell[]).find(
              (candidate) =>
                normalizePointId(candidate.name) ===
                normalizePointId(selectedLocation.name)
            ) ?? null
        } catch {
          well = null
        }

        if (well) {
          try {
            const response = await ocotilloDataProvider.getList({
              resource: 'observation/transducer-groundwater-level',
              pagination: { currentPage: 1, pageSize: 1 },
              sorters: [{ field: 'observation_datetime', order: 'desc' }],
              meta: { params: { thing_id: well.id } },
            })
            const first = (
              response.data as Array<{
                observation?: { observation_datetime?: string }
              }>
            )[0]
            if (first?.observation?.observation_datetime) {
              const parsed = new Date(first.observation.observation_datetime)
              if (!Number.isNaN(parsed.getTime())) lastIngested = parsed
            }
          } catch {
            lastIngested = null
          }
        }
      } else {
        lastIngested = new Date(DEMO_WELLNTEL_LAST_INGESTED)
      }

      if (cancelled) return
      setResolvedWell(well)

      const start =
        lastIngested ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      const end = isDemoSource
        ? new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000)
        : new Date()
      setStartValue(toLocalInputValue(start))
      setEndValue(toLocalInputValue(end))
    })()

    return () => {
      cancelled = true
    }
  }, [isDemoSource, selectedLocation])

  const handleRetrieve = async () => {
    if (!selectedLocation || !selectedPoint) return

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
      const measurements = isDemoSource
        ? generateDemoDiverHubReadings(start, end)
        : toDepthToWaterPoints(
            await fetchDiverHubWaterLevels({
              projectName: selectedLocation.projectName,
              monitoringPointId: selectedPoint.id,
              fromDate: start,
              toDate: end,
            }),
            { includeUnapproved }
          )

      if (measurements.length === 0) {
        setError(
          'No Diver-HUB water levels were returned for that range (depth to water requires the gs frame, or the vrd frame plus ground-surface data).'
        )
        return
      }

      onIngested({
        well: resolvedWell,
        wellName: selectedLocation.name,
        measurements,
        isDemo: isDemoSource,
      })
    } catch (retrieveError) {
      setError(
        retrieveError instanceof Error
          ? retrieveError.message
          : 'Unable to retrieve Diver-HUB water levels.'
      )
    } finally {
      setIsRetrieving(false)
    }
  }

  const activePoints =
    selectedLocation?.monitoringPoints.filter((point) => point.isActive) ?? []

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Ingest Diver-HUB Water Levels</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {isDemoSource ? (
            <Alert severity="info">
              Diver-HUB is unreachable — showing demo locations with
              synthetic water levels.
            </Alert>
          ) : null}

          {error ? <Alert severity="warning">{error}</Alert> : null}

          <Autocomplete
            options={locations}
            loading={isLoadingLocations}
            value={selectedLocation}
            getOptionLabel={locationLabel}
            isOptionEqualToValue={(option, value) =>
              option.projectName === value.projectName && option.id === value.id
            }
            onChange={(_event, value) => setSelectedLocation(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Location"
                placeholder="Diver-HUB project / location"
              />
            )}
            noOptionsText="No active Diver-HUB locations found"
          />

          <Autocomplete
            options={activePoints}
            value={selectedPoint}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_event, value) => setSelectedPoint(value)}
            disabled={!selectedLocation}
            renderInput={(params) => (
              <TextField {...params} label="Monitoring point" />
            )}
            noOptionsText="No active monitoring points"
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              fullWidth
              type="datetime-local"
              label="From"
              value={startValue}
              onChange={(event) => setStartValue(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={!selectedLocation}
            />
            <TextField
              fullWidth
              type="datetime-local"
              label="To"
              value={endValue}
              onChange={(event) => setEndValue(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={!selectedLocation}
            />
          </Stack>

          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={includeUnapproved}
                onChange={(event) => setIncludeUnapproved(event.target.checked)}
              />
            }
            label="Include unapproved readings"
          />

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {resolvedWell ? (
              <Chip
                size="small"
                color="success"
                label={`Ocotillo well: ${resolvedWell.name}`}
              />
            ) : selectedLocation && !isDemoSource ? (
              <Chip
                size="small"
                variant="outlined"
                label="No matching Ocotillo well — publishing will be disabled"
              />
            ) : null}
          </Stack>

          <Typography variant="caption" color="text.secondary">
            Water levels are converted to depth to water below ground surface
            (gs frame preferred, vrd frame with ground-surface elevations
            otherwise). The start bound defaults to the last ingested Ocotillo
            measurement when the location matches a well.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<CloudDownload />}
          onClick={handleRetrieve}
          disabled={!selectedLocation || !selectedPoint || isRetrieving}
        >
          {isRetrieving ? 'Retrieving...' : 'Retrieve & Load'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
