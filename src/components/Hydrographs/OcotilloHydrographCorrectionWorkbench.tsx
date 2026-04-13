import { useEffect, useMemo, useRef, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { Build, Publish, Refresh, Straighten } from '@mui/icons-material'
import {
  applyOffsetToRange,
  buildCsvFromMeasurements,
  calculateSnapOffset,
  normalizePointId,
  parseHydrographUpload,
  parseHydrographWorkbookUpload,
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

export const OcotilloHydrographCorrectionWorkbench = ({
  thingName,
  manualObservations,
  transducerObservations,
  initialUpload,
  initialFileName,
  onUploadParsed,
}: {
  thingName: string
  manualObservations: readonly ManualHydrographObservation[]
  transducerObservations: readonly TransducerHydrographObservation[]
  initialUpload?: ParsedHydrographUpload | null
  initialFileName?: string | null
  onUploadParsed?: (
    parsed: ParsedHydrographUpload,
    fileName: string | null
  ) => void
}) => {
  const theme = useTheme()
  const chartRef = useRef<ReactECharts>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploaded, setUploaded] = useState<ParsedHydrographUpload | null>(
    initialUpload ?? null
  )
  const [rawUploadedMeasurements, setRawUploadedMeasurements] = useState<
    HydrographPoint[]
  >(initialUpload?.measurements ?? [])
  const [correctedMeasurements, setCorrectedMeasurements] = useState<
    HydrographPoint[]
  >(initialUpload?.measurements ?? [])
  const [selectedRange, setSelectedRange] = useState<HydrographRange | null>(
    null
  )
  const [selectedManualOption, setSelectedManualOption] =
    useState<ManualOption | null>(null)
  const [shiftAmount, setShiftAmount] = useState<number>(0.1)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(initialFileName ?? null)

  useEffect(() => {
    setUploaded(initialUpload ?? null)
    setRawUploadedMeasurements(initialUpload?.measurements ?? [])
    setCorrectedMeasurements(initialUpload?.measurements ?? [])
    setFileName(initialFileName ?? null)
    setSelectedRange(null)
    setSelectedManualOption(null)
    setError(null)
  }, [initialFileName, initialUpload])

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

  const parsedPointId = uploaded?.pointId ?? null
  const highlightedManualPoint = selectedManualOption?.point ?? null

  const chartOption = useMemo(() => {
    const series = [
      manualPoints.length > 0
        ? {
            name: 'Manual water levels',
            type: 'scatter',
            symbolSize: 10,
            data: manualPoints.map((point) => [point.time, point.value]),
            itemStyle: { color: '#1565C0' },
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
              color: '#D32F2F',
              borderColor: '#FFFFFF',
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
            lineStyle: { color: '#6D4C41', width: 2 },
          }
        : null,
      rawUploadedMeasurements.length > 0
        ? {
            name: 'Uploaded raw',
            type: 'line',
            showSymbol: false,
            data: rawUploadedMeasurements.map((point) => [point.time, point.value]),
            lineStyle: { color: '#78909C', width: 1, type: 'dashed' },
          }
        : null,
      correctedMeasurements.length > 0
        ? {
            name: 'Uploaded corrected',
            type: 'line',
            showSymbol: false,
            data: correctedMeasurements.map((point) => [point.time, point.value]),
            lineStyle: { color: '#2E7D32', width: 3 },
          }
        : null,
    ].filter(Boolean)

    return {
      animation: false,
      legend: {
        top: 0,
      },
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
        backgroundColor: theme.palette.background.paper,
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
        splitLine: { show: true },
      },
      yAxis: {
        type: 'value',
        inverse: true,
        scale: true,
        name: 'Depth To Water Below Ground Surface (ft)',
        nameLocation: 'center',
        nameGap: 74,
        nameTextStyle: {
          padding: [0, 0, 0, 6],
        },
      },
      series,
    }
  }, [
    correctedMeasurements,
    highlightedManualPoint,
    manualPoints,
    rawUploadedMeasurements,
    storedTransducerPoints,
    theme.palette.background.paper,
  ])

  const handleUpload = async (file?: File) => {
    if (!file) return

    try {
      const parsed = file.name.toLowerCase().endsWith('.xlsx')
        ? parseHydrographWorkbookUpload(await file.arrayBuffer(), file.name)
        : parseHydrographUpload(await file.text())
      setUploaded(parsed)
      setRawUploadedMeasurements(parsed.measurements)
      setCorrectedMeasurements(parsed.measurements)
      setSelectedRange(null)
      setError(null)
      setFileName(file.name)
      onUploadParsed?.(parsed, file.name)
    } catch (uploadError) {
      setUploaded(null)
      setRawUploadedMeasurements([])
      setCorrectedMeasurements([])
      setSelectedRange(null)
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Unable to parse the uploaded file.'
      )
    }
  }

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

    setCorrectedMeasurements((current) =>
      applyOffsetToRange(current, shiftAmount * direction, selectedRange)
    )
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
      setError(null)
    } catch (snapError) {
      setError(
        snapError instanceof Error
          ? snapError.message
          : 'Unable to snap the uploaded data to the selected manual point.'
      )
    }
  }

  const resetCorrections = () => {
    setCorrectedMeasurements(rawUploadedMeasurements)
    setSelectedRange(null)
    setError(null)
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
    <Card elevation={2}>
      <CardHeader
        avatar={<Build color="primary" />}
        title="Hydrograph Correction Workspace"
        subheader="Upload a logger text file, compare it with Ocotillo measurements, and apply local alignment edits."
      />
      <CardContent>
        <Stack spacing={2}>
          <input
            ref={fileInputRef}
            hidden
            type="file"
            accept=".txt,.csv,.dat,.xlsx"
            onChange={(event) => handleUpload(event.target.files?.[0])}
          />

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
                <Paper
                  variant="outlined"
                  sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.default' }}
                >
                  <Stack spacing={1.25}>
                    <Typography variant="overline" color="primary.main">
                      Upload
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Publish />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Replace File
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Supports `.txt`, `.csv`, `.dat`, and the `wellpy` workbook
                      export format `.xlsx`.
                    </Typography>
                  </Stack>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.default' }}
                >
                  <Stack spacing={1.25}>
                    <Typography variant="overline" color="primary.main">
                      Shift
                    </Typography>
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
                  </Stack>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.default' }}
                >
                  <Stack spacing={1.25}>
                    <Typography variant="overline" color="primary.main">
                      Snap
                    </Typography>
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
                  </Stack>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.default' }}
                >
                  <Stack spacing={1.25}>
                    <Typography variant="overline" color="primary.main">
                      Output
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<Refresh />}
                        onClick={resetCorrections}
                        disabled={rawUploadedMeasurements.length === 0}
                      >
                        Reset
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
                    <Typography variant="caption" color="text.secondary">
                      Brush the chart to scope edits. Without a selection,
                      actions apply to the full uploaded trace.
                    </Typography>
                  </Stack>
                </Paper>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, lg: 8.5 }}>
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
            </Grid>
          </Grid>

          <Divider />

          <Typography variant="body2" color="text.secondary">
            Click a manual point on the chart to prefill the snap target. The
            uploaded raw trace stays visible as a dashed reference while edits
            are applied to the corrected trace.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}
