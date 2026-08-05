import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import ReactECharts from 'echarts-for-react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import {
  ChevronLeft,
  ChevronRight,
  CleaningServices,
  CloudUpload,
  ExpandMore,
  Refresh,
  Straighten,
  TableRows,
} from '@mui/icons-material'
import {
  applyOffsetToRange,
  assessDriftAtManualObservations,
  buildCsvFromMeasurements,
  calculateSnapOffset,
  convertWaterHeadToDepthToWater,
  detectOverpressureClipping,
  interpolateSpuriousReflections,
  normalizePointId,
  parseObservationTimestamp,
  removeOffsetsAndZeros,
  removeSpuriousReflections,
  type ReflectionDetectionMethod,
  type HydrographPoint,
  type HydrographRange,
  type ParsedHydrographUpload,
} from './hydrographCorrection'
import {
  DEFAULT_HYDROGRAPH_UI_MODE,
  isAtLeastMode,
  type HydrographUiMode,
} from './hydrographUiMode'

interface ManualHydrographObservation {
  observation_datetime: string | Date
  depth_to_water_bgs: number
}

interface TransducerHydrographObservation {
  observation_datetime: string | Date
  value: number
}

interface ManualOption {
  label: string
  point: HydrographPoint
}

// Everything the page needs to build the upload-contract payload
// (docs/hydrograph-correction-upload-contract.md): the corrected series
// plus provenance gathered from the session.
export interface HydrographPublishArgs {
  measurements: HydrographPoint[]
  corrections: string[]
  sourceFileName: string | null
  sourceKind: 'depth_to_water' | 'water_head'
}

// Well and sensor context for the metadata pane. The page maps Ocotillo
// records onto this shape so the workbench stays decoupled from the API
// types and still renders in demo mode, where none of it exists.
export interface HydrographWellMetadata {
  /** Link to the well details page; omitted when no well is bound. */
  href?: string | null
  siteName?: string | null
  wellStatus?: string | null
  wellDepth?: number | null
  wellDepthUnit?: string | null
  casingDepth?: number | null
  casingDepthUnit?: string | null
  measuringPointHeight?: number | null
  measuringPointHeightUnit?: string | null
}

export interface HydrographSensorDeployment {
  id: string | number
  name?: string | null
  model?: string | null
  serialNo?: string | null
  installedAt?: string | null
  removedAt?: string | null
  hangingCableLength?: number | null
  recordingInterval?: string | null
}

interface MetadataFact {
  label: string
  value: string
}

const EMPTY_SENSOR_DEPLOYMENTS: readonly HydrographSensorDeployment[] = []

// Bounds for the draggable controls column.
const DEFAULT_CONTROLS_WIDTH = 340
const MIN_CONTROLS_WIDTH = 240
const MAX_CONTROLS_WIDTH = 640
const MIN_CHART_WIDTH = 360
const SPLIT_HANDLE_WIDTH = 28

// Stacked chart panels, in pixels. Every panel rides the same time axis, so
// the layout is computed here rather than left to per-panel percentages.
// The toolbox owns the top row and the legend a right gutter, so the two
// never compete for the same space. Grids stop short of the gutter.
const CHART_TOOLBAR_HEIGHT = 44
const CHART_LEGEND_GUTTER = 210
const CHART_AXIS_FOOTER_HEIGHT = 76
const CHART_PANEL_GAP = 16
const CHART_PANEL_HEIGHTS = {
  head: 120,
  dtw: 420,
  residual: 150,
} as const

type ChartPanel = keyof typeof CHART_PANEL_HEIGHTS

const RESIDUAL_STORED_SERIES = 'Residual: stored − manual'
const RESIDUAL_CORRECTED_SERIES = 'Residual: corrected − manual'
const RESIDUAL_SERIES_NAMES = [
  RESIDUAL_STORED_SERIES,
  RESIDUAL_CORRECTED_SERIES,
]

// Speech bubble, for the toolbox button that turns the hover popup on/off.
const TOOLTIP_TOGGLE_ICON =
  'path://M4,3 L28,3 Q30,3 30,5 L30,19 Q30,21 28,21 L14,21 L8,27 L8,21 L4,21 Q2,21 2,19 L2,5 Q2,3 4,3 Z'

/** The subset of an ECharts tooltip callback param this chart formats. */
interface TooltipParam {
  seriesName?: string
  marker?: string
  axisValueLabel?: string
  value?: [unknown, number | null | undefined]
}

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const MONTH_MS = 30.4375 * DAY_MS
const YEAR_MS = 365.25 * DAY_MS

// Candidate tick spacings, coarsest last.
const TIME_TICK_STEPS = [
  MINUTE_MS,
  5 * MINUTE_MS,
  15 * MINUTE_MS,
  30 * MINUTE_MS,
  HOUR_MS,
  3 * HOUR_MS,
  6 * HOUR_MS,
  12 * HOUR_MS,
  DAY_MS,
  2 * DAY_MS,
  7 * DAY_MS,
  14 * DAY_MS,
  MONTH_MS,
  3 * MONTH_MS,
  6 * MONTH_MS,
  YEAR_MS,
  2 * YEAR_MS,
  5 * YEAR_MS,
  10 * YEAR_MS,
  20 * YEAR_MS,
  50 * YEAR_MS,
  100 * YEAR_MS,
]

/**
 * Pick one tick spacing for every stacked panel.
 *
 * Left to itself ECharts derives an interval per axis, and the inputs differ
 * between panels — only the bottom axis draws labels, and only the residual
 * panel draws bars. That produced a different interval per panel, so the
 * vertical grid lines did not line up. Deriving the interval once and setting
 * it on every axis makes the panels agree by construction.
 */
const chooseSharedTimeTick = (spanMs: number, targetTicks = 6) => {
  if (!Number.isFinite(spanMs) || spanMs <= 0) return null
  const rough = spanMs / targetTicks
  return (
    TIME_TICK_STEPS.find((step) => step >= rough) ??
    TIME_TICK_STEPS[TIME_TICK_STEPS.length - 1]
  )
}

/**
 * Residual bars, drawn as zero-anchored line segments rather than a bar
 * series. A real bar series pads its own axis by half a bar band at each end
 * — even with an explicit extent and `boundaryGap` — which stretched the
 * residual panel's time range relative to the panels above and pushed its
 * grid lines out of line. Line segments leave the axis untouched.
 */
const residualBarSeries = (
  entries: readonly { anchorTime: Date; misfit: number }[],
  color: string,
  gridIndex: number
) => ({
  type: 'line',
  showSymbol: false,
  connectNulls: false,
  xAxisIndex: gridIndex,
  yAxisIndex: gridIndex,
  lineStyle: { color, width: 5 },
  itemStyle: { color },
  data: entries.flatMap((entry) => [
    [entry.anchorTime, 0],
    [entry.anchorTime, entry.misfit],
    [entry.anchorTime, null],
  ]),
})

/** Snap the axis start onto a round boundary so labels stay readable. */
const snapTimeDomainStart = (startMs: number, intervalMs: number) => {
  const start = new Date(startMs)

  if (intervalMs >= YEAR_MS) {
    const years = Math.max(1, Math.round(intervalMs / YEAR_MS))
    const year = Math.floor(start.getFullYear() / years) * years
    return new Date(year, 0, 1).getTime()
  }

  if (intervalMs >= MONTH_MS) {
    const months = Math.max(1, Math.round(intervalMs / MONTH_MS))
    const month = Math.floor(start.getMonth() / months) * months
    return new Date(start.getFullYear(), month, 1).getTime()
  }

  return Math.floor(startMs / intervalMs) * intervalMs
}

const buildWellFacts = (
  metadata: HydrographWellMetadata | null | undefined
): MetadataFact[] => {
  if (!metadata) return []

  return (
    [
      ['Well depth', formatMeasure(metadata.wellDepth, metadata.wellDepthUnit)],
      [
        'Casing depth',
        formatMeasure(metadata.casingDepth, metadata.casingDepthUnit),
      ],
      [
        'Measuring point height',
        formatMeasure(
          metadata.measuringPointHeight,
          metadata.measuringPointHeightUnit
        ),
      ],
    ] as const
  )
    .filter(([, value]) => value !== null)
    .map(([label, value]) => ({ label, value: value as string }))
}

// The pane lives in the narrow control column, so deployments are packed
// into a compact table rather than a label/value block per deployment.
const SensorDeploymentTable = ({
  deployments,
}: {
  deployments: readonly HydrographSensorDeployment[]
}) => (
  <Box sx={{ overflowX: 'auto' }}>
    <Table
      size="small"
      sx={{
        '& td, & th': {
          px: 0.75,
          py: 0.25,
          fontSize: '0.7rem',
          whiteSpace: 'nowrap',
          borderBottom: 'none',
        },
        '& th': { color: 'text.secondary', fontWeight: 'bold' },
      }}
    >
      <TableHead>
        <TableRow>
          <TableCell>Sensor</TableCell>
          <TableCell>S/N</TableCell>
          <TableCell>Installed</TableCell>
          <TableCell>Removed</TableCell>
          <TableCell align="right">Cable</TableCell>
          <TableCell>Interval</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {deployments.map((deployment) => (
          <TableRow key={deployment.id}>
            <TableCell>
              {[deployment.name || 'Unnamed', deployment.model]
                .filter(Boolean)
                .join(' · ')}
            </TableCell>
            <TableCell>{deployment.serialNo || '—'}</TableCell>
            <TableCell>{formatDate(deployment.installedAt) ?? '—'}</TableCell>
            <TableCell>
              {formatDate(deployment.removedAt) ?? 'Deployed'}
            </TableCell>
            <TableCell align="right">
              {formatMeasure(deployment.hangingCableLength, 'ft') ?? '—'}
            </TableCell>
            <TableCell>{deployment.recordingInterval || '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Box>
)

const formatMeasure = (
  value: number | null | undefined,
  unit: string | null | undefined
) =>
  value === null || value === undefined || !Number.isFinite(value)
    ? null
    : `${value}${unit ? ` ${unit}` : ''}`

const formatDate = (value: string | null | undefined) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString()
}

const MetadataFacts = ({ facts }: { facts: readonly MetadataFact[] }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      columnGap: 2,
      rowGap: 0.5,
    }}
  >
    {facts.map((fact) => (
      <Box key={fact.label}>
        <Typography variant="caption" color="text.secondary" display="block">
          {fact.label}
        </Typography>
        <Typography variant="body2">{fact.value}</Typography>
      </Box>
    ))}
  </Box>
)

const WorkbenchSection = ({
  title,
  defaultExpanded = false,
  children,
}: {
  title: string
  defaultExpanded?: boolean
  children: React.ReactNode
}) => (
  <Accordion
    defaultExpanded={defaultExpanded}
    disableGutters
    variant="outlined"
    sx={{
      borderRadius: 2,
      bgcolor: 'background.default',
      '&:before': { display: 'none' },
    }}
  >
    <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 1.5 }}>
      <Typography variant="overline" color="primary.main">
        {title}
      </Typography>
    </AccordionSummary>
    <AccordionDetails sx={{ px: 1.5, pt: 0 }}>
      <Stack spacing={1.25}>{children}</Stack>
    </AccordionDetails>
  </Accordion>
)

export const OcotilloHydrographCorrectionWorkbench = ({
  thingName,
  manualObservations,
  transducerObservations,
  initialUpload,
  initialFileName,
  onPublish,
  mode = DEFAULT_HYDROGRAPH_UI_MODE,
  wellMetadata,
  sensorDeployments = EMPTY_SENSOR_DEPLOYMENTS,
}: {
  thingName: string
  manualObservations: readonly ManualHydrographObservation[]
  transducerObservations: readonly TransducerHydrographObservation[]
  initialUpload?: ParsedHydrographUpload | null
  initialFileName?: string | null
  onPublish?: (args: HydrographPublishArgs) => Promise<void>
  mode?: HydrographUiMode
  wellMetadata?: HydrographWellMetadata | null
  sensorDeployments?: readonly HydrographSensorDeployment[]
}) => {
  const theme = useTheme()
  const chartRef = useRef<ReactECharts>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const splitRef = useRef<HTMLDivElement>(null)
  const resizeStateRef = useRef<{ startX: number; startWidth: number } | null>(
    null
  )
  const [controlsWidth, setControlsWidth] = useState(DEFAULT_CONTROLS_WIDTH)
  const [controlsCollapsed, setControlsCollapsed] = useState(false)
  const [showTooltip, setShowTooltip] = useState(true)

  const [uploaded, setUploaded] = useState<ParsedHydrographUpload | null>(
    initialUpload ?? null
  )
  // Populated by the effect below once the upload is derived (water-head
  // uploads are converted first, so raw parsed values are never charted).
  const [rawUploadedMeasurements, setRawUploadedMeasurements] = useState<
    HydrographPoint[]
  >([])
  const [correctedMeasurements, setCorrectedMeasurements] = useState<
    HydrographPoint[]
  >([])
  const [selectedRange, setSelectedRange] = useState<HydrographRange | null>(
    null
  )
  const [selectedManualOption, setSelectedManualOption] =
    useState<ManualOption | null>(null)
  const [shiftAmount, setShiftAmount] = useState<number>(0.1)
  const [cleanThreshold, setCleanThreshold] = useState<number>(0.25)
  const [reflectionThreshold, setReflectionThreshold] = useState<number>(0.25)
  const [interpolateReflections, setInterpolateReflections] = useState(false)
  const [reflectionMethod, setReflectionMethod] =
    useState<ReflectionDetectionMethod>('median')
  const [useTemperatureAssist, setUseTemperatureAssist] = useState(false)
  // Audit trail of applied operations, in order — becomes the provenance
  // corrections list in the upload-contract payload.
  const [correctionLog, setCorrectionLog] = useState<string[]>([])
  const [isPublishing, setIsPublishing] = useState(false)
  const [correctDrift, setCorrectDrift] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([])
  const [fileName, setFileName] = useState<string | null>(initialFileName ?? null)

  // Progressive disclosure. Simple mode is the pressure-transducer workflow
  // only, so the acoustic-logger tooling (reflections) and its tuning knobs
  // are gated behind the higher modes.
  const showReflectionTools = isAtLeastMode(mode, 'intermediate')
  const showThresholdFields = isAtLeastMode(mode, 'intermediate')
  const showDataTable = isAtLeastMode(mode, 'intermediate')
  const showReflectionTuning = isAtLeastMode(mode, 'advanced')

  const wellFacts = useMemo(() => buildWellFacts(wellMetadata), [wellMetadata])

  const clampControlsWidth = useCallback((width: number) => {
    // Never let the controls squeeze the chart below a usable width.
    const available = splitRef.current?.clientWidth
    const max = available
      ? Math.max(
          MIN_CONTROLS_WIDTH,
          available - MIN_CHART_WIDTH - SPLIT_HANDLE_WIDTH
        )
      : MAX_CONTROLS_WIDTH
    return Math.min(Math.max(width, MIN_CONTROLS_WIDTH), max)
  }, [])

  const startControlsResize = (event: React.MouseEvent) => {
    if (controlsCollapsed) return
    event.preventDefault()
    resizeStateRef.current = {
      startX: event.clientX,
      startWidth: controlsWidth,
    }
    // Dragging over the chart would otherwise select its labels.
    document.body.style.userSelect = 'none'
  }

  const handleSeparatorKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const step = event.key === 'ArrowLeft' ? -24 : 24
    setControlsWidth((current) => clampControlsWidth(current + step))
  }

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      const drag = resizeStateRef.current
      if (!drag) return
      setControlsWidth(
        clampControlsWidth(drag.startWidth + event.clientX - drag.startX)
      )
    }
    const stopDrag = () => {
      if (!resizeStateRef.current) return
      resizeStateRef.current = null
      document.body.style.userSelect = ''
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', stopDrag)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', stopDrag)
      stopDrag()
    }
  }, [clampControlsWidth])

  // The instance has to be told when the split changes its container width.
  // echarts-for-react's own auto-resize deliberately swallows the first
  // resize it observes, which is exactly the 0 -> real width transition when
  // the chart mounts before the flex row has been measured — that left the
  // canvas stuck at zero width. Resizing on a frame after mount covers it.
  useEffect(() => {
    const element = chartContainerRef.current
    if (!element) return

    // echarts-for-react initialises the instance with explicit pixel
    // dimensions, so a bare resize() would re-apply the size captured at
    // mount. 'auto' makes it re-measure the container.
    const resizeChart = () =>
      chartRef.current
        ?.getEchartsInstance()
        ?.resize({ width: 'auto', height: 'auto' })
    const frame = requestAnimationFrame(resizeChart)

    if (typeof ResizeObserver === 'undefined') {
      return () => cancelAnimationFrame(frame)
    }

    // Panel changes resize the container too, so the observer covers those.
    const observer = new ResizeObserver(resizeChart)
    observer.observe(element)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  // Dropping to a mode that hides a toggle must also disable it, otherwise a
  // hidden option would keep silently changing what the buttons do.
  useEffect(() => {
    if (!showReflectionTuning) {
      setReflectionMethod('median')
      setUseTemperatureAssist(false)
      setInterpolateReflections(false)
    }
  }, [showReflectionTuning])

  const manualPoints = useMemo<HydrographPoint[]>(
    () =>
      manualObservations
        .map((observation) => ({
          time: parseObservationTimestamp(observation.observation_datetime),
          value: Number(observation.depth_to_water_bgs),
        }))
        .filter(
          (point) =>
            !Number.isNaN(point.time.getTime()) && Number.isFinite(point.value)
        )
        .sort((a, b) => a.time.getTime() - b.time.getTime()),
    [manualObservations]
  )

  const storedTransducerPoints = useMemo<HydrographPoint[]>(
    () =>
      transducerObservations
        .map((observation) => ({
          time: parseObservationTimestamp(observation.observation_datetime),
          value: Number(observation.value),
        }))
        .filter(
          (point) =>
            !Number.isNaN(point.time.getTime()) && Number.isFinite(point.value)
        )
        .sort((a, b) => a.time.getTime() - b.time.getTime()),
    [transducerObservations]
  )

  const manualOptions = useMemo<ManualOption[]>(
    () =>
      manualPoints.map((point, index) => ({
        label: `${point.time.toLocaleString()} · ${point.value.toFixed(2)} ft`,
        point,
      })),
    [manualPoints]
  )

  // Residuals against the manual measurements: at each manual observation,
  // the nearest transducer reading minus the manual value. Positive means the
  // transducer reads deeper than the hand measurement. This is the misfit the
  // shift and snap tools drive toward zero.
  const residuals = useMemo(() => {
    const corrected = assessDriftAtManualObservations(
      correctedMeasurements,
      manualPoints
    )
    const stored = assessDriftAtManualObservations(
      storedTransducerPoints,
      manualPoints
    )
    return { corrected, stored }
  }, [correctedMeasurements, manualPoints, storedTransducerPoints])

  const hasResiduals =
    residuals.corrected.length > 0 || residuals.stored.length > 0

  // Water-head uploads (Diver Office pressure transducers) are converted to
  // depth to water using the manual observations as sensor-depth anchors,
  // mirroring wellpy. Depth-to-water uploads pass through unchanged.
  const deriveWorkingMeasurements = useCallback(
    (upload: ParsedHydrographUpload) =>
      upload.valueKind === 'water_head'
        ? convertWaterHeadToDepthToWater({
            measurements: upload.measurements,
            manualPoints,
            correctDrift,
          })
        : upload.measurements,
    [correctDrift, manualPoints]
  )

  const baselineCorrectionLog = useCallback(
    (upload: ParsedHydrographUpload | null) =>
      upload?.valueKind === 'water_head'
        ? [`convert_water_head${correctDrift ? ' (drift corrected)' : ''}`]
        : [],
    [correctDrift]
  )

  const selectedRangeSuffix = () =>
    selectedRange
      ? `, ${selectedRange.startTime.toISOString()} to ${selectedRange.endTime.toISOString()}`
      : ''

  useEffect(() => {
    setUploaded(initialUpload ?? null)
    setFileName(initialFileName ?? null)
    setSelectedRange(null)
    setSelectedManualOption(null)

    if (!initialUpload) {
      setRawUploadedMeasurements([])
      setCorrectedMeasurements([])
      setQualityWarnings([])
      setError(null)
      return
    }

    try {
      const working = deriveWorkingMeasurements(initialUpload)
      setRawUploadedMeasurements(working)
      setCorrectedMeasurements(working)
      setCorrectionLog(baselineCorrectionLog(initialUpload))
      setError(null)

      // Methodology QC checks on water-head uploads: drift misfit at the
      // manual measurements, and overpressurization clipping in raw head.
      const warnings: string[] = []
      if (initialUpload.valueKind === 'water_head') {
        assessDriftAtManualObservations(working, manualPoints)
          .filter((assessment) => Math.abs(assessment.misfit) > 0.1)
          .forEach((assessment) => {
            warnings.push(
              `Drift check: the converted series misses the manual measurement on ${assessment.anchorTime.toLocaleString()} by ${assessment.misfit > 0 ? '+' : ''}${assessment.misfit.toFixed(2)} ft — possible logger drift; per the methodology, review before publishing.`
            )
          })

        const clipping = detectOverpressureClipping(initialUpload.measurements)
        if (clipping) {
          warnings.push(
            `Water head plateaus at its maximum (${clipping.value.toFixed(2)} ft) for ${clipping.count} consecutive readings (${clipping.start.toLocaleString()} to ${clipping.end.toLocaleString()}) — the Diver may have been overpressurized past its range; readings in that span are clipped.`
          )
        }
      }
      setQualityWarnings(warnings)
    } catch (deriveError) {
      setRawUploadedMeasurements([])
      setCorrectedMeasurements([])
      setCorrectionLog([])
      setQualityWarnings([])
      setError(
        deriveError instanceof Error
          ? deriveError.message
          : 'Unable to prepare the uploaded data.'
      )
    }
  }, [
    baselineCorrectionLog,
    deriveWorkingMeasurements,
    initialFileName,
    initialUpload,
  ])

  const parsedPointId = uploaded?.pointId ?? null
  const highlightedManualPoint = selectedManualOption?.point ?? null

  // Charts pull series colors and text styles from the MUI theme so they
  // match the rest of the app and adapt to dark mode.
  const chartTextStyles = useMemo(
    () => ({
      legend: {
        // Stacked down the right gutter, clear of the toolbox row above.
        // Scrolling caps it at the gutter height rather than letting a long
        // series list push into the panels.
        type: 'scroll',
        orient: 'vertical',
        top: CHART_TOOLBAR_HEIGHT,
        right: 8,
        width: CHART_LEGEND_GUTTER - 24,
        textStyle: { color: theme.palette.text.primary },
        pageTextStyle: { color: theme.palette.text.secondary },
        pageIconColor: theme.palette.text.secondary,
        pageIconInactiveColor: theme.palette.action.disabled,
      },
      xAxis: {
        axisLabel: { color: theme.palette.text.secondary },
        splitLine: { show: true, lineStyle: { color: theme.palette.divider } },
      },
      yAxis: {
        axisLabel: { color: theme.palette.text.secondary },
        nameTextStyle: {
          color: theme.palette.text.secondary,
          padding: [0, 0, 0, 6],
        },
        splitLine: { lineStyle: { color: theme.palette.divider } },
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        textStyle: { color: theme.palette.text.primary },
      },
    }),
    [theme]
  )

  // Diver uploads get a raw water-head panel (mirroring wellpy's stacked head
  // plot) since head and DTW share neither units nor axis orientation. It is
  // stacked into the same chart instance as a second grid so both panels ride
  // one shared time axis — zoom, pan, brush and the tooltip crosshair stay in
  // lockstep across them.
  const headPoints = uploaded?.valueKind === 'water_head' ? uploaded.measurements : null

  // Panels are stacked top to bottom in this order, and every one of them is
  // driven by the same time axis.
  const chartPanels = useMemo<ChartPanel[]>(
    () =>
      [
        headPoints ? 'head' : null,
        'dtw' as const,
        hasResiduals ? 'residual' : null,
      ].filter(Boolean) as ChartPanel[],
    [hasResiduals, headPoints]
  )

  const chartHeight = useMemo(
    () =>
      CHART_TOOLBAR_HEIGHT +
      chartPanels.reduce((total, panel) => total + CHART_PANEL_HEIGHTS[panel], 0) +
      CHART_PANEL_GAP * Math.max(0, chartPanels.length - 1) +
      CHART_AXIS_FOOTER_HEIGHT,
    [chartPanels]
  )

  const chartOption = useMemo(() => {
    const gridIndexOf = (panel: ChartPanel) => chartPanels.indexOf(panel)
    const dtwGridIndex = gridIndexOf('dtw')
    const residualGridIndex = gridIndexOf('residual')
    const lastGridIndex = chartPanels.length - 1

    const series = [
      headPoints
        ? {
            name: 'Raw water head',
            type: 'line',
            showSymbol: false,
            xAxisIndex: gridIndexOf('head'),
            yAxisIndex: gridIndexOf('head'),
            data: headPoints.map((point) => [point.time, point.value]),
            lineStyle: { color: theme.palette.info.main, width: 2 },
          }
        : null,
      residuals.stored.length > 0
        ? {
            name: RESIDUAL_STORED_SERIES,
            ...residualBarSeries(
              residuals.stored,
              theme.palette.secondary.main,
              residualGridIndex
            ),
          }
        : null,
      residuals.corrected.length > 0
        ? {
            name: RESIDUAL_CORRECTED_SERIES,
            ...residualBarSeries(
              residuals.corrected,
              theme.palette.success.main,
              residualGridIndex
            ),
            // Perfect agreement sits on this line.
            markLine: {
              silent: true,
              symbol: 'none',
              data: [{ yAxis: 0 }],
              lineStyle: { color: theme.palette.text.secondary, type: 'dashed' },
              label: { show: false },
            },
          }
        : null,
      manualPoints.length > 0
        ? {
            name: 'Manual water levels',
            type: 'scatter',
            symbolSize: 10,
            data: manualPoints.map((point) => [point.time, point.value]),
            itemStyle: { color: theme.palette.primary.main },
          }
        : null,
      highlightedManualPoint
        ? {
            name: 'Selected manual point',
            type: 'scatter',
            symbol: 'diamond',
            symbolSize: 16,
            z: 10,
            data: [[highlightedManualPoint.time, highlightedManualPoint.value]],
            itemStyle: {
              color: theme.palette.error.main,
              borderColor: theme.palette.background.paper,
              borderWidth: 2,
            },
          }
        : null,
      storedTransducerPoints.length > 0
        ? {
            name: 'Stored transducer',
            type: 'line',
            showSymbol: false,
            data: storedTransducerPoints.map((point) => [point.time, point.value]),
            lineStyle: { color: theme.palette.secondary.main, width: 2 },
          }
        : null,
      rawUploadedMeasurements.length > 0
        ? {
            name: 'Uploaded raw',
            type: 'line',
            showSymbol: false,
            data: rawUploadedMeasurements.map((point) => [point.time, point.value]),
            lineStyle: {
              color: theme.palette.text.secondary,
              width: 1,
              type: 'dashed',
            },
          }
        : null,
      correctedMeasurements.length > 0
        ? {
            name: 'Uploaded corrected',
            type: 'line',
            showSymbol: false,
            data: correctedMeasurements.map((point) => [point.time, point.value]),
            lineStyle: { color: theme.palette.success.main, width: 3 },
          }
        : null,
    ]
      .filter(Boolean)
      // Series that did not claim a panel belong to the DTW grid.
      .map((entry) =>
        entry!.xAxisIndex === undefined
          ? { ...entry, xAxisIndex: dtwGridIndex, yAxisIndex: dtwGridIndex }
          : entry
      )

    // Every panel must span the same instants, not each series' own extent.
    // The head record usually covers one deployment while the DTW panel also
    // carries years of stored observations, so without a shared domain the
    // head trace would stretch across the full width and imply coverage it
    // does not have.
    const sharedTimeDomain =
      chartPanels.length > 1
        ? [
            headPoints ?? [],
            manualPoints,
            storedTransducerPoints,
            rawUploadedMeasurements,
            correctedMeasurements,
          ]
            .flat()
            .reduce<{ min: number; max: number } | null>((domain, point) => {
              const time = point.time.getTime()
              if (!domain) return { min: time, max: time }
              return {
                min: Math.min(domain.min, time),
                max: Math.max(domain.max, time),
              }
            }, null)
        : null

    const sharedTick = sharedTimeDomain
      ? chooseSharedTimeTick(sharedTimeDomain.max - sharedTimeDomain.min)
      : null

    const sharedExtent = sharedTimeDomain
      ? {
          min: sharedTick
            ? snapTimeDomainStart(sharedTimeDomain.min, sharedTick)
            : sharedTimeDomain.min,
          max: sharedTimeDomain.max,
          ...(sharedTick ? { interval: sharedTick } : {}),
        }
      : {}

    const panelYAxis: Record<ChartPanel, Record<string, unknown>> = {
      head: {
        scale: true,
        name: 'Water Head (ft)',
      },
      dtw: {
        inverse: true,
        scale: true,
        name: 'Depth To Water Below Ground Surface (ft)',
      },
      residual: {
        scale: true,
        name: 'Residual (ft)',
      },
    }

    // Stack the panels top to bottom, each one a fixed height with a small
    // gap, so the whole column lines up on the shared axis at the bottom.
    let panelTop = CHART_TOOLBAR_HEIGHT
    const grids = chartPanels.map((panel) => {
      const grid = {
        left: 100,
        right: CHART_LEGEND_GUTTER,
        top: panelTop,
        height: CHART_PANEL_HEIGHTS[panel],
      }
      panelTop += CHART_PANEL_HEIGHTS[panel] + CHART_PANEL_GAP
      return grid
    })

    return {
      animation: false,
      legend: chartTextStyles.legend,
      grid: grids,
      toolbox: {
        top: 0,
        right: 8,
        feature: {
          myToggleTooltip: {
            show: true,
            title: showTooltip ? 'Hide hover popup' : 'Show hover popup',
            icon: TOOLTIP_TOGGLE_ICON,
            iconStyle: {
              borderColor: showTooltip
                ? theme.palette.primary.main
                : theme.palette.text.secondary,
            },
            onclick: () => setShowTooltip((current) => !current),
          },
          dataZoom: [{ show: true }, { type: 'inside' }],
          restore: {},
          brush: { type: ['lineX', 'clear'] },
          saveAsImage: {},
        },
      },
      tooltip: {
        show: showTooltip,
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        // Residuals are read off their own panel; listing them here just
        // padded every popup, two rows per series for the zero anchor and
        // the value.
        formatter: (params: TooltipParam | TooltipParam[]) => {
          const entries = (Array.isArray(params) ? params : [params]).filter(
            (entry) => !RESIDUAL_SERIES_NAMES.includes(entry.seriesName ?? '')
          )

          const rows = entries
            .filter((entry) => entry.value?.[1] !== null && entry.value?.[1] !== undefined)
            .map(
              (entry) =>
                `${entry.marker ?? ''}${entry.seriesName}: ${Number(
                  entry.value?.[1]
                ).toFixed(3)}`
            )

          if (rows.length === 0) return ''
          return [entries[0]?.axisValueLabel ?? '', ...rows].join('<br/>')
        },
        ...chartTextStyles.tooltip,
      },
      // Crosshair follows the same instant in both panels.
      axisPointer: { link: [{ xAxisIndex: 'all' }] },
      brush: {
        xAxisIndex: 'all',
        brushMode: 'single',
        outOfBrush: { colorAlpha: 0.25 },
      },
      // One zoom range drives every x axis, so the panels cannot drift apart.
      dataZoom: [
        { type: 'inside', realtime: true, xAxisIndex: 'all' },
        { show: true, realtime: true, xAxisIndex: 'all' },
      ],
      xAxis: chartPanels.map((_panel, index) => ({
        type: 'time',
        gridIndex: index,
        ...sharedExtent,
        ...chartTextStyles.xAxis,
        // Only the bottom panel carries labels; the ones above would just
        // repeat them.
        ...(index === lastGridIndex ? {} : { axisLabel: { show: false } }),
      })),
      yAxis: chartPanels.map((panel, index) => ({
        type: 'value',
        gridIndex: index,
        nameLocation: 'center',
        nameGap: 74,
        ...panelYAxis[panel],
        ...chartTextStyles.yAxis,
      })),
      series,
    }
  }, [
    chartPanels,
    chartTextStyles,
    correctedMeasurements,
    headPoints,
    highlightedManualPoint,
    manualPoints,
    rawUploadedMeasurements,
    residuals,
    showTooltip,
    storedTransducerPoints,
    theme,
  ])

  const tableRows = useMemo(() => {
    interface CorrectionTableRow {
      id: number
      time: Date
      waterHead: number | null
      rawDtw: number | null
      correctedDtw: number | null
      manualDtw: number | null
      storedTransducer: number | null
      correctionNote: string | null
    }

    const rows = new Map<number, CorrectionTableRow>()
    const rowFor = (time: Date) => {
      const key = time.getTime()
      let row = rows.get(key)
      if (!row) {
        row = {
          id: key,
          time,
          waterHead: null,
          rawDtw: null,
          correctedDtw: null,
          manualDtw: null,
          storedTransducer: null,
          correctionNote: null,
        }
        rows.set(key, row)
      }
      return row
    }

    if (uploaded?.valueKind === 'water_head') {
      uploaded.measurements.forEach((point) => {
        rowFor(point.time).waterHead = point.value
      })
    }
    rawUploadedMeasurements.forEach((point) => {
      rowFor(point.time).rawDtw = point.value
    })
    correctedMeasurements.forEach((point) => {
      const row = rowFor(point.time)
      row.correctedDtw = point.value
      row.correctionNote = point.correctionNote ?? null
    })
    manualPoints.forEach((point) => {
      rowFor(point.time).manualDtw = point.value
    })
    storedTransducerPoints.forEach((point) => {
      rowFor(point.time).storedTransducer = point.value
    })

    return [...rows.values()].sort((a, b) => a.id - b.id)
  }, [
    correctedMeasurements,
    manualPoints,
    rawUploadedMeasurements,
    storedTransducerPoints,
    uploaded,
  ])

  const tableColumns = useMemo<GridColDef[]>(() => {
    const numberColumn = (field: string, headerName: string): GridColDef => ({
      field,
      headerName,
      width: 170,
      type: 'number',
      valueFormatter: (value: number | null) =>
        value == null ? '' : value.toFixed(3),
    })

    return [
      {
        field: 'time',
        headerName: 'Timestamp',
        width: 190,
        valueFormatter: (value: Date) => value.toLocaleString(),
      },
      ...(uploaded?.valueKind === 'water_head'
        ? [numberColumn('waterHead', 'Water Head (ft)')]
        : []),
      numberColumn('rawDtw', 'Raw DTW (ft bgs)'),
      numberColumn('correctedDtw', 'Corrected DTW (ft bgs)'),
      numberColumn('manualDtw', 'Manual DTW (ft bgs)'),
      ...(storedTransducerPoints.length > 0
        ? [numberColumn('storedTransducer', 'Stored Transducer (ft bgs)')]
        : []),
      ...(correctedMeasurements.some((point) => point.correctionNote)
        ? [
            {
              field: 'correctionNote',
              headerName: 'Correction',
              flex: 1,
              minWidth: 260,
            } satisfies GridColDef,
          ]
        : []),
    ]
  }, [
    correctedMeasurements,
    storedTransducerPoints.length,
    uploaded?.valueKind,
  ])

  const handleBrushSelected = (params: {
    batch?: Array<{ areas?: Array<{ coordRange?: [number, number] }> }>
  }) => {
    const area = params.batch?.[0]?.areas?.[0]
    const coordRange = area?.coordRange

    if (!coordRange || coordRange.length !== 2) {
      setSelectedRange(null)
      return
    }

    setSelectedRange({
      startTime: new Date(coordRange[0]),
      endTime: new Date(coordRange[1]),
    })
  }

  const handleChartClick = (params: {
    seriesName?: string
    dataIndex?: number
  }) => {
    if (params.seriesName !== 'Manual water levels') return

    const option = manualOptions[params.dataIndex ?? -1]
    if (option) {
      setSelectedManualOption(option)
    }
  }

  const shiftSelection = (direction: 1 | -1) => {
    if (correctedMeasurements.length === 0) return

    const offset = shiftAmount * direction
    setCorrectedMeasurements((current) =>
      applyOffsetToRange(
        current,
        offset,
        selectedRange,
        `shifted ${offset > 0 ? '+' : ''}${offset} ft`
      )
    )
    setCorrectionLog((log) => [
      ...log,
      `shift (${offset > 0 ? '+' : ''}${offset} ft${selectedRangeSuffix()})`,
    ])
  }

  const cleanOffsetsAndZeros = () => {
    if (correctedMeasurements.length === 0) return

    setCorrectedMeasurements((current) =>
      removeOffsetsAndZeros(current, cleanThreshold, selectedRange)
    )
    setCorrectionLog((log) => [
      ...log,
      `remove_offsets_zeros (threshold ${cleanThreshold}${selectedRangeSuffix()})`,
    ])
  }

  const cleanSpuriousReflections = () => {
    if (correctedMeasurements.length === 0) return

    const treat = interpolateReflections
      ? interpolateSpuriousReflections
      : removeSpuriousReflections
    setCorrectedMeasurements((current) =>
      treat(current, reflectionThreshold, selectedRange, reflectionMethod, {
        useTemperature: useTemperatureAssist,
      })
    )
    setCorrectionLog((log) => [
      ...log,
      `${interpolateReflections ? 'interpolate' : 'remove'}_reflections (${reflectionMethod}${useTemperatureAssist ? '+temp' : ''}, threshold ${reflectionThreshold}${selectedRangeSuffix()})`,
    ])
  }

  const snapToManual = () => {
    if (!selectedManualOption || correctedMeasurements.length === 0) return

    try {
      const offset = calculateSnapOffset({
        measurements: correctedMeasurements,
        target: selectedManualOption.point,
        range: selectedRange,
      })

      setCorrectedMeasurements((current) =>
        applyOffsetToRange(
          current,
          offset,
          selectedRange,
          `snapped ${offset > 0 ? '+' : ''}${offset} ft to manual ${selectedManualOption.point.time.toISOString()}`
        )
      )
      setCorrectionLog((log) => [
        ...log,
        `snap_to_manual (${offset > 0 ? '+' : ''}${offset} ft to ${selectedManualOption.point.time.toISOString()}${selectedRangeSuffix()})`,
      ])
      setError(null)
    } catch (snapError) {
      setError(
        snapError instanceof Error
          ? snapError.message
          : 'Unable to snap the uploaded data to the selected manual point.'
      )
    }
  }

  // Restore the originally loaded dataset, undoing every correction. For
  // water-head uploads, turning drift correction off re-derives the
  // baseline conversion through the effect above.
  const resetCorrections = () => {
    setCorrectDrift(false)
    setCorrectedMeasurements(rawUploadedMeasurements)
    setCorrectionLog(baselineCorrectionLog(uploaded))
    setSelectedRange(null)
    setSelectedManualOption(null)
    setError(null)
  }

  const publishToOcotillo = async () => {
    if (!onPublish || correctedMeasurements.length === 0) return

    setIsPublishing(true)
    try {
      await onPublish({
        measurements: correctedMeasurements,
        corrections: correctionLog,
        sourceFileName: fileName,
        sourceKind: uploaded?.valueKind ?? 'depth_to_water',
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const downloadCorrectedCsv = () => {
    if (correctedMeasurements.length === 0) return

    const csv = buildCsvFromMeasurements(correctedMeasurements)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${normalizePointId(parsedPointId || thingName || 'hydrograph')}_corrected.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box>
          <Typography variant="body1" fontWeight="bold">
            Hydrograph Correction Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload a logger file, compare it with Ocotillo measurements, and
            apply local alignment edits.
          </Typography>
        </Box>
        {/* The brushed range scopes every edit, so it stays in the header
            rather than moving into the collapsible detail panes. */}
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
          {selectedRange ? (
            <Chip
              color="secondary"
              label={`Selection: ${selectedRange.startTime.toLocaleString()} to ${selectedRange.endTime.toLocaleString()}`}
              onDelete={() => setSelectedRange(null)}
            />
          ) : (
            <Chip variant="outlined" label="Selection: entire uploaded trace" />
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={resetCorrections}
            disabled={rawUploadedMeasurements.length === 0}
          >
            Reset to Original
          </Button>
        </Stack>
      </Box>
      <Box sx={{ px: 2, pb: 2 }}>
        <Stack spacing={2}>
          {error ? <Alert severity="warning">{error}</Alert> : null}
          {qualityWarnings.map((warning) => (
            <Alert key={warning} severity="warning">
              {warning}
            </Alert>
          ))}

          <Box
            ref={splitRef}
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              alignItems: 'stretch',
              gap: { xs: 1.5, lg: 0 },
            }}
          >
            <Box
              sx={{
                // Collapsing to zero hands the whole row to the chart.
                width: { xs: '100%', lg: controlsCollapsed ? 0 : controlsWidth },
                flexShrink: 0,
                minWidth: 0,
                overflow: 'hidden',
                display: controlsCollapsed ? { xs: 'none', lg: 'block' } : 'block',
              }}
            >
              <Stack spacing={1.5}>
                <WorkbenchSection title="Well & Sensor">
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip
                        label={`Well: ${thingName || 'Unknown'}`}
                        {...(wellMetadata?.href
                          ? {
                              // Routed link so opening the well details page
                              // does not reload the app and discard the
                              // corrections.
                              component: RouterLink,
                              to: wellMetadata.href,
                              clickable: true,
                              color: 'primary',
                              variant: 'outlined',
                            }
                          : {})}
                      />
                      {wellMetadata?.siteName ? (
                        <Chip label={`Site: ${wellMetadata.siteName}`} />
                      ) : null}
                      {wellMetadata?.wellStatus ? (
                        <Chip label={`Status: ${wellMetadata.wellStatus}`} />
                      ) : null}
                    </Stack>
                    {wellFacts.length > 0 ? (
                      <MetadataFacts facts={wellFacts} />
                    ) : null}
                    {sensorDeployments.length > 0 ? (
                      <>
                        <Divider />
                        <SensorDeploymentTable
                          deployments={sensorDeployments}
                        />
                      </>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        {wellMetadata
                          ? 'No sensor deployments are recorded for this well.'
                          : 'No Ocotillo well is bound — well and sensor metadata are unavailable in demo mode.'}
                      </Typography>
                    )}
                </WorkbenchSection>

                <WorkbenchSection title="Clean">
                    {uploaded?.valueKind === 'water_head' ? (
                      <>
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={correctDrift}
                              onChange={(event) =>
                                setCorrectDrift(event.target.checked)
                              }
                            />
                          }
                          label="Correct drift"
                        />
                        <Typography variant="caption" color="text.secondary">
                          Water head is converted to depth to water using
                          manual observations as sensor-depth anchors. Drift
                          correction interpolates the sensor depth between
                          anchors. Recomputing discards manual edits.
                        </Typography>
                      </>
                    ) : null}
                    {showThresholdFields ? (
                      <TextField
                        type="number"
                        label="Jump threshold (ft)"
                        size="small"
                        value={cleanThreshold}
                        onChange={(event) =>
                          setCleanThreshold(Number(event.target.value))
                        }
                      />
                    ) : null}
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<CleaningServices />}
                      onClick={cleanOffsetsAndZeros}
                      disabled={correctedMeasurements.length === 0}
                    >
                      Remove Offsets/Zeros
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Offsets are sustained level shifts (sensor repositioning
                      or cable slip): each step is detected from the medians
                      around it and the trace after it is re-leveled. Zero
                      readings (sensor out of water) are dropped.
                    </Typography>
                    {showReflectionTools ? (
                      <>
                        <TextField
                          type="number"
                          label="Reflection threshold (ft)"
                          size="small"
                          value={reflectionThreshold}
                          onChange={(event) =>
                            setReflectionThreshold(Number(event.target.value))
                          }
                        />
                        {showReflectionTuning ? (
                          <>
                            <TextField
                              select
                              size="small"
                              label="Detection"
                              value={reflectionMethod}
                              onChange={(event) =>
                                setReflectionMethod(
                                  event.target
                                    .value as ReflectionDetectionMethod
                                )
                              }
                            >
                              <MenuItem value="median">
                                Isolated echoes (median window)
                              </MenuItem>
                              <MenuItem value="baseline">
                                Dense one-sided (running baseline)
                              </MenuItem>
                            </TextField>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  checked={useTemperatureAssist}
                                  onChange={(event) =>
                                    setUseTemperatureAssist(
                                      event.target.checked
                                    )
                                  }
                                  disabled={
                                    !correctedMeasurements.some(
                                      (point) => point.temperature !== undefined
                                    )
                                  }
                                />
                              }
                              label="Temperature assist"
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  checked={interpolateReflections}
                                  onChange={(event) =>
                                    setInterpolateReflections(
                                      event.target.checked
                                    )
                                  }
                                />
                              }
                              label="Interpolate across removals"
                            />
                          </>
                        ) : null}
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<CleaningServices />}
                          onClick={cleanSpuriousReflections}
                          disabled={correctedMeasurements.length === 0}
                        >
                          {interpolateReflections
                            ? 'Interpolate Reflections'
                            : 'Remove Reflections'}
                        </Button>
                        <Typography variant="caption" color="text.secondary">
                          Reflections are acoustic-echo readings offset from
                          the local trend — positive or negative, near the true
                          depth (1x) or near twice it (2x).
                          {showReflectionTuning
                            ? ' The median method targets isolated echoes and keeps sustained steps; the running baseline method rejects dense one-sided clusters (echoes reading deeper), but treats genuine upward steps as spurious — brush the affected span when the trace has real steps. Temperature assist additionally flags readings that sit marginally above the local trend while their sensor temperature is well above the local norm — echoes correlate with warm readings (requires a temperature column in the upload). Interpolating keeps the sampling cadence, replacing each removed reading with a linear fit between its surviving neighbors.'
                            : ' Readings offset from the local trend by more than the threshold are dropped. Switch to Advanced for detection methods, temperature assist, and interpolation.'}
                        </Typography>
                      </>
                    ) : null}
                </WorkbenchSection>

                <WorkbenchSection title="Shift">
                    <TextField
                      type="number"
                      label="Shift amount (ft)"
                      size="small"
                      value={shiftAmount}
                      onChange={(event) =>
                        setShiftAmount(Number(event.target.value))
                      }
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        onClick={() => shiftSelection(-1)}
                        disabled={correctedMeasurements.length === 0}
                      >
                        Shift Up
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        onClick={() => shiftSelection(1)}
                        disabled={correctedMeasurements.length === 0}
                      >
                        Shift Down
                      </Button>
                    </Stack>
                </WorkbenchSection>

                <WorkbenchSection title="Snap">
                    <Autocomplete
                      size="small"
                      options={manualOptions}
                      value={selectedManualOption}
                      onChange={(_event, value) =>
                        setSelectedManualOption(value)
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Manual observation"
                          placeholder="Select or click on chart"
                        />
                      )}
                      noOptionsText="No manual observations available for this well"
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Straighten />}
                      onClick={snapToManual}
                      disabled={
                        correctedMeasurements.length === 0 ||
                        !selectedManualOption
                      }
                    >
                      Snap To Manual
                    </Button>
                </WorkbenchSection>

                <WorkbenchSection title="Output" defaultExpanded>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<Refresh />}
                        onClick={resetCorrections}
                        disabled={rawUploadedMeasurements.length === 0}
                      >
                        Reset to Original
                      </Button>
                      <Button
                        variant="text"
                        size="small"
                        onClick={downloadCorrectedCsv}
                        disabled={correctedMeasurements.length === 0}
                      >
                        Download CSV
                      </Button>
                    </Stack>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<CloudUpload />}
                      onClick={publishToOcotillo}
                      disabled={
                        !onPublish ||
                        correctedMeasurements.length === 0 ||
                        isPublishing
                      }
                    >
                      {isPublishing ? 'Publishing...' : 'Publish to Ocotillo'}
                    </Button>
                    {!onPublish ? (
                      <Typography variant="caption" color="text.secondary">
                        Publishing requires a resolved Ocotillo well and is
                        disabled in demo mode.
                      </Typography>
                    ) : null}
                    <Typography variant="caption" color="text.secondary">
                      Brush the chart to scope edits. Without a selection,
                      actions apply to the full uploaded trace. Reset to
                      Original discards every correction and restores the
                      dataset as it was loaded.
                    </Typography>
                </WorkbenchSection>
              </Stack>
            </Box>

            {/* Drag to resize the controls, or use the button to collapse
                them and give the chart the full width. */}
            <Box
              sx={{
                display: { xs: 'none', lg: 'flex' },
                flexDirection: 'column',
                alignItems: 'center',
                width: SPLIT_HANDLE_WIDTH,
                flexShrink: 0,
                alignSelf: 'stretch',
              }}
            >
              {/* Anchored to the top so it stays reachable however tall the
                  workspace grows. */}
              <Tooltip
                title={controlsCollapsed ? 'Show controls' : 'Hide controls'}
              >
                <IconButton
                  size="small"
                  aria-label={
                    controlsCollapsed ? 'Show controls' : 'Hide controls'
                  }
                  onClick={() => setControlsCollapsed((current) => !current)}
                >
                  {controlsCollapsed ? (
                    <ChevronRight fontSize="small" />
                  ) : (
                    <ChevronLeft fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
              <Box
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize controls"
                tabIndex={controlsCollapsed ? -1 : 0}
                onMouseDown={startControlsResize}
                onKeyDown={handleSeparatorKeyDown}
                sx={{
                  flex: 1,
                  width: 4,
                  my: 0.5,
                  borderRadius: 2,
                  bgcolor: 'divider',
                  cursor: controlsCollapsed ? 'default' : 'col-resize',
                  visibility: controlsCollapsed ? 'hidden' : 'visible',
                  '&:hover, &:focus-visible': { bgcolor: 'primary.main' },
                }}
              />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack spacing={1.5}>
                <Paper
                  variant="outlined"
                  sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.paper' }}
                >
                  <Box
                    ref={chartContainerRef}
                    // Height follows the stacked panels so each one keeps its
                    // designed size instead of being squeezed.
                    sx={{ height: chartHeight }}
                  >
                    <ReactECharts
                      ref={chartRef}
                      option={chartOption}
                      notMerge
                      style={{ width: '100%', height: '100%' }}
                      onEvents={{
                        brushSelected: handleBrushSelected,
                        click: handleChartClick,
                      }}
                    />
                  </Box>
                </Paper>
              </Stack>
            </Box>
          </Box>

          {showDataTable ? (
            <Paper
              variant="outlined"
              sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.paper' }}
            >
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TableRows color="primary" fontSize="small" />
                  <Typography variant="overline" color="primary.main">
                    Data Table
                  </Typography>
                  <Chip size="small" label={`${tableRows.length} rows`} />
                </Stack>
                <Box sx={{ height: 400 }}>
                  <DataGrid
                    rows={tableRows}
                    columns={tableColumns}
                    density="compact"
                    disableRowSelectionOnClick
                    initialState={{
                      pagination: { paginationModel: { pageSize: 100 } },
                    }}
                    pageSizeOptions={[25, 50, 100]}
                  />
                </Box>
              </Stack>
            </Paper>
          ) : null}

          <Divider />

          <Typography variant="body2" color="text.secondary">
            Click a manual point on the chart to prefill the snap target. The
            uploaded raw trace stays visible as a dashed reference while edits
            are applied to the corrected trace.
          </Typography>
        </Stack>
      </Box>
    </Paper>
  )
}
