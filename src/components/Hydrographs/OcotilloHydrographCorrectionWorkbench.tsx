import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import {
  CleaningServices,
  CloudUpload,
  ExpandMore,
  Refresh,
  Straighten,
  TableRows,
} from '@mui/icons-material'
import {
  applyOffsetToRange,
  buildCsvFromMeasurements,
  calculateSnapOffset,
  convertWaterHeadToDepthToWater,
  interpolateSpuriousReflections,
  normalizePointId,
  removeOffsetsAndZeros,
  removeSpuriousReflections,
  type HydrographPoint,
  type HydrographRange,
  type ParsedHydrographUpload,
} from './hydrographCorrection'

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
}: {
  thingName: string
  manualObservations: readonly ManualHydrographObservation[]
  transducerObservations: readonly TransducerHydrographObservation[]
  initialUpload?: ParsedHydrographUpload | null
  initialFileName?: string | null
  onPublish?: (args: HydrographPublishArgs) => Promise<void>
}) => {
  const theme = useTheme()
  const chartRef = useRef<ReactECharts>(null)

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
  // Audit trail of applied operations, in order — becomes the provenance
  // corrections list in the upload-contract payload.
  const [correctionLog, setCorrectionLog] = useState<string[]>([])
  const [isPublishing, setIsPublishing] = useState(false)
  const [correctDrift, setCorrectDrift] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(initialFileName ?? null)

  const manualPoints = useMemo<HydrographPoint[]>(
    () =>
      manualObservations
        .map((observation) => ({
          time: new Date(observation.observation_datetime),
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
          time: new Date(observation.observation_datetime),
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
      setError(null)
      return
    }

    try {
      const working = deriveWorkingMeasurements(initialUpload)
      setRawUploadedMeasurements(working)
      setCorrectedMeasurements(working)
      setCorrectionLog(baselineCorrectionLog(initialUpload))
      setError(null)
    } catch (deriveError) {
      setRawUploadedMeasurements([])
      setCorrectedMeasurements([])
      setCorrectionLog([])
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
      legend: { top: 0, textStyle: { color: theme.palette.text.primary } },
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

  const chartOption = useMemo(() => {
    const series = [
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
    ].filter(Boolean)

    return {
      animation: false,
      legend: chartTextStyles.legend,
      grid: {
        left: 100,
        right: 32,
        top: 56,
        bottom: 84,
      },
      toolbox: {
        feature: {
          dataZoom: [{ show: true }, { type: 'inside' }],
          restore: {},
          brush: { type: ['lineX', 'clear'] },
          saveAsImage: {},
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        ...chartTextStyles.tooltip,
      },
      brush: {
        xAxisIndex: 'all',
        brushMode: 'single',
        outOfBrush: { colorAlpha: 0.25 },
      },
      dataZoom: [
        { type: 'inside', realtime: true },
        { show: true, realtime: true },
      ],
      xAxis: {
        type: 'time',
        ...chartTextStyles.xAxis,
      },
      yAxis: {
        type: 'value',
        inverse: true,
        scale: true,
        name: 'Depth To Water Below Ground Surface (ft)',
        nameLocation: 'center',
        nameGap: 74,
        ...chartTextStyles.yAxis,
      },
      series,
    }
  }, [
    chartTextStyles,
    correctedMeasurements,
    highlightedManualPoint,
    manualPoints,
    rawUploadedMeasurements,
    storedTransducerPoints,
    theme,
  ])

  // Diver uploads get a separate raw water-head plot (mirroring wellpy's
  // stacked head plot) since head and DTW share neither units nor axis
  // orientation.
  const headChartOption = useMemo(() => {
    if (uploaded?.valueKind !== 'water_head') return null

    return {
      animation: false,
      legend: chartTextStyles.legend,
      grid: {
        left: 100,
        right: 32,
        top: 32,
        bottom: 48,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        ...chartTextStyles.tooltip,
      },
      dataZoom: [{ type: 'inside', realtime: true }],
      xAxis: {
        type: 'time',
        ...chartTextStyles.xAxis,
      },
      yAxis: {
        type: 'value',
        scale: true,
        name: 'Water Head (ft)',
        nameLocation: 'center',
        nameGap: 74,
        ...chartTextStyles.yAxis,
      },
      series: [
        {
          name: 'Raw water head',
          type: 'line',
          showSymbol: false,
          data: uploaded.measurements.map((point) => [point.time, point.value]),
          lineStyle: { color: theme.palette.info.main, width: 2 },
        },
      ],
    }
  }, [chartTextStyles, theme, uploaded])

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
      applyOffsetToRange(current, offset, selectedRange)
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
      treat(current, reflectionThreshold, selectedRange)
    )
    setCorrectionLog((log) => [
      ...log,
      `${interpolateReflections ? 'interpolate' : 'remove'}_reflections (threshold ${reflectionThreshold}${selectedRangeSuffix()})`,
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
        applyOffsetToRange(current, offset, selectedRange)
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
        <Button
          variant="outlined"
          size="small"
          startIcon={<Refresh />}
          onClick={resetCorrections}
          disabled={rawUploadedMeasurements.length === 0}
        >
          Reset to Original
        </Button>
      </Box>
      <Box sx={{ px: 2, pb: 2 }}>
        <Stack spacing={2}>
          {error ? <Alert severity="warning">{error}</Alert> : null}

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={`Well: ${thingName || 'Unknown'}`} />
            {fileName ? <Chip label={`File: ${fileName}`} /> : null}
            {uploaded ? (
              <Chip label={`Rows: ${uploaded.measurements.length}`} />
            ) : null}
            {uploaded?.detectedTimeColumn ? (
              <Chip label={`Time: ${uploaded.detectedTimeColumn}`} />
            ) : null}
            {uploaded?.detectedValueColumn ? (
              <Chip label={`Value: ${uploaded.detectedValueColumn}`} />
            ) : null}
            {uploaded?.valueKind === 'water_head' ? (
              <Chip color="info" label="Water head converted to DTW" />
            ) : null}
            {selectedRange ? (
              <Chip
                color="secondary"
                label={`Selection: ${selectedRange.startTime.toLocaleString()} to ${selectedRange.endTime.toLocaleString()}`}
                onDelete={() => setSelectedRange(null)}
              />
            ) : (
              <Chip variant="outlined" label="Selection: entire uploaded trace" />
            )}
          </Stack>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 3.5 }}>
              <Stack spacing={1.5}>
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
                    <TextField
                      type="number"
                      label="Jump threshold (ft)"
                      size="small"
                      value={cleanThreshold}
                      onChange={(event) =>
                        setCleanThreshold(Number(event.target.value))
                      }
                    />
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
                    <TextField
                      type="number"
                      label="Reflection threshold (ft)"
                      size="small"
                      value={reflectionThreshold}
                      onChange={(event) =>
                        setReflectionThreshold(Number(event.target.value))
                      }
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={interpolateReflections}
                          onChange={(event) =>
                            setInterpolateReflections(event.target.checked)
                          }
                        />
                      }
                      label="Interpolate across removals"
                    />
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
                      Reflections are acoustic-echo readings offset from the
                      local trend — positive or negative, near the true depth
                      (1x) or near twice it (2x). Sustained steps are kept.
                      Interpolating keeps the sampling cadence, replacing each
                      removed reading with a linear fit between its surviving
                      neighbors.
                    </Typography>
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
            </Grid>

            <Grid size={{ xs: 12, lg: 8.5 }}>
              <Stack spacing={1.5}>
                {headChartOption ? (
                  <Paper
                    variant="outlined"
                    sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.paper' }}
                  >
                    <Box sx={{ height: 220 }}>
                      <ReactECharts
                        option={headChartOption}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </Box>
                  </Paper>
                ) : null}
                <Paper
                  variant="outlined"
                  sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.paper' }}
                >
                  <Box sx={{ height: { xs: 420, lg: 560 } }}>
                    <ReactECharts
                      ref={chartRef}
                      option={chartOption}
                      style={{ width: '100%', height: '100%' }}
                      onEvents={{
                        brushSelected: handleBrushSelected,
                        click: handleChartClick,
                      }}
                    />
                  </Box>
                </Paper>
              </Stack>
            </Grid>
          </Grid>

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
