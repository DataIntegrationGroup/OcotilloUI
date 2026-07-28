import { useRef, useState } from 'react'
import axios from 'axios'
import { useInvalidate } from '@refinedev/core'
import { Breadcrumb, useAutocomplete, useDataGrid } from '@refinedev/mui'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { AutoAwesome, CloudDownload, Publish } from '@mui/icons-material'
import { OcotilloPageTitle } from '@/components/OcotilloPageHeader'
import {
  WellntelIngestDialog,
  type WellntelIngestResult,
} from './WellntelIngestDialog'
import { IWell } from '@/interfaces/ocotillo'
import { TransducerObservationWithBlockResponse } from '@/generated/types.gen'
import {
  OcotilloHydrographCorrectionWorkbench,
  type HydrographPublishArgs,
} from '@/components/Hydrographs/OcotilloHydrographCorrectionWorkbench'
import {
  normalizePointId,
  parseHydrographUpload,
  parseHydrographWorkbookUpload,
  ParsedHydrographUpload,
} from '@/components/Hydrographs/hydrographCorrection'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import {
  DEMO_DIVER_FILE_NAME,
  DEMO_DIVER_MANUAL_OBSERVATIONS,
  DEMO_DIVER_WELL_NAME,
  DEMO_FILE_NAME,
  DEMO_MANUAL_OBSERVATIONS,
  DEMO_WELL_NAME,
  DEMO_WELLNTEL_FILE_NAME,
  DEMO_WELLNTEL_MANUAL_OBSERVATIONS,
  DEMO_WELLNTEL_WELL_NAME,
} from './demoData'

type DemoKind = 'transducer' | 'diver' | 'wellntel'

const DEMO_CONFIG: Record<
  DemoKind,
  {
    fileName: string
    wellName: string
    manualObservations: typeof DEMO_MANUAL_OBSERVATIONS
  }
> = {
  transducer: {
    fileName: DEMO_FILE_NAME,
    wellName: DEMO_WELL_NAME,
    manualObservations: DEMO_MANUAL_OBSERVATIONS,
  },
  diver: {
    fileName: DEMO_DIVER_FILE_NAME,
    wellName: DEMO_DIVER_WELL_NAME,
    manualObservations: DEMO_DIVER_MANUAL_OBSERVATIONS,
  },
  wellntel: {
    fileName: DEMO_WELLNTEL_FILE_NAME,
    wellName: DEMO_WELLNTEL_WELL_NAME,
    manualObservations: DEMO_WELLNTEL_MANUAL_OBSERVATIONS,
  },
}

export const HydrographCorrectionPage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedWell, setSelectedWell] = useState<IWell | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [parsedUpload, setParsedUpload] = useState<ParsedHydrographUpload | null>(
    null
  )
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isResolvingWell, setIsResolvingWell] = useState(false)
  const [isLoadingDemo, setIsLoadingDemo] = useState(false)
  const [demoKind, setDemoKind] = useState<DemoKind | null>(null)
  const [isIngestDialogOpen, setIsIngestDialogOpen] = useState(false)
  const [ingestedWellName, setIngestedWellName] = useState<string | null>(null)
  const [publishSuccess, setPublishSuccess] = useState<{
    blockId: number | null
    count: number
    wellName: string
  } | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [pendingOverlap, setPendingOverlap] = useState<{
    blockIds: number[]
    args: HydrographPublishArgs
  } | null>(null)
  const dtwParameterIdRef = useRef<number | null>(null)
  const invalidate = useInvalidate()

  const { autocompleteProps } = useAutocomplete<IWell>({
    resource: 'thing',
    dataProviderName: 'ocotillo',
    onSearch: (value) => [
      {
        field: 'name',
        operator: 'contains',
        value,
      },
    ],
  })

  const {
    dataGridProps: { rows: manualRows, loading: manualLoading },
  } = useDataGrid({
    resource: 'observation/groundwater-level',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_id: selectedWell?.id,
      },
    },
    queryOptions: {
      enabled: Boolean(selectedWell?.id),
      gcTime: 10 * 60 * 1000,
      staleTime: 5 * 60 * 1000,
    },
  })

  const {
    dataGridProps: { rows: transducerRows, loading: transducerLoading },
  } = useDataGrid<TransducerObservationWithBlockResponse>({
    resource: 'observation/transducer-groundwater-level',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_id: selectedWell?.id,
      },
    },
    queryOptions: {
      enabled: Boolean(selectedWell?.id),
      gcTime: 10 * 60 * 1000,
      staleTime: 5 * 60 * 1000,
    },
  })

  const isLoading = manualLoading || transducerLoading
  const normalizedParsedPointId = normalizePointId(parsedUpload?.pointId)
  const pointIdMatchesSelectedWell =
    !!selectedWell &&
    !!normalizedParsedPointId &&
    normalizedParsedPointId === normalizePointId(selectedWell.name)

  const resolveWellFromUpload = async (parsed: ParsedHydrographUpload) => {
    const extractedPointId = normalizePointId(parsed.pointId)
    if (!extractedPointId) {
      setSelectedWell(null)
      return
    }

    setIsResolvingWell(true)
    try {
      const response = await ocotilloDataProvider.getList({
        resource: 'thing',
        pagination: {
          currentPage: 1,
          pageSize: 25,
        },
        filters: [
          {
            field: 'name',
            operator: 'contains',
            value: extractedPointId,
          },
        ],
      })

      const matchedWell =
        (response.data as IWell[]).find(
          (well) => normalizePointId(well.name) === extractedPointId
        ) ?? null

      setSelectedWell(matchedWell)
      if (!matchedWell) {
        setUploadError(
          `Extracted thing.name "${parsed.pointId}" from the file, but no exact Ocotillo well match was found. Use the well search to continue.`
        )
      }
    } catch {
      setSelectedWell(null)
      setUploadError(
        'The file was parsed, but Ocotillo could not resolve the extracted thing.name automatically.'
      )
    } finally {
      setIsResolvingWell(false)
    }
  }

  const applyParsedUpload = async (
    parsed: ParsedHydrographUpload,
    fileName: string | null
  ) => {
    setDemoKind(null)
    setIngestedWellName(null)
    setParsedUpload(parsed)
    setUploadedFileName(fileName)
    setUploadError(null)
    await resolveWellFromUpload(parsed)
  }

  // Resolve the depth-to-water parameter id from the lexicon at runtime
  // (upload-contract open question #1 — this avoids a hardcoded id).
  const resolveDtwParameterId = async () => {
    if (dtwParameterIdRef.current !== null) return dtwParameterIdRef.current

    const fetchTerms = async (category?: string) => {
      const response = await ocotilloDataProvider.getList({
        resource: 'lexicon/term',
        pagination: { currentPage: 1, pageSize: 500 },
        meta: { params: category ? { category } : {} },
      })
      return response.data as Array<{ id: number; term: string }>
    }
    const findDtw = (terms: Array<{ id: number; term: string }>) =>
      terms.find((item) =>
        /depth\s*to\s*water.*(bgs|below\s*ground)/i.test(item.term)
      ) ?? terms.find((item) => /depth\s*to\s*water/i.test(item.term))

    let match = findDtw(await fetchTerms('parameter').catch(() => []))
    if (!match) match = findDtw(await fetchTerms())
    if (!match) {
      throw new Error(
        'Could not resolve the depth-to-water parameter from the lexicon.'
      )
    }

    dtwParameterIdRef.current = match.id
    return match.id
  }

  // POST per docs/hydrograph-correction-upload-contract.md.
  const postCorrectedBlock = async (
    args: HydrographPublishArgs,
    replaceOverlapping: boolean
  ) => {
    if (!selectedWell) throw new Error('No well is selected.')

    const parameterId = await resolveDtwParameterId()
    const payload = {
      thing_id: selectedWell.id,
      parameter_id: parameterId,
      release_status: 'provisional',
      review_status: 'not reviewed',
      provenance: {
        source_file: args.sourceFileName ?? 'unknown',
        source_kind: args.sourceKind,
        corrections: args.corrections,
      },
      measurements: args.measurements.map((measurement) => ({
        observation_datetime: measurement.time.toISOString(),
        value: measurement.value,
      })),
    }

    const url = `observation/transducer-groundwater-level/block${
      replaceOverlapping ? '?replace_overlapping=true' : ''
    }`
    const { data } = await ocotilloDataProvider.custom!({
      url,
      method: 'post',
      payload,
    })
    return data as { block?: { id?: number }; observation_count?: number }
  }

  const applyPublishSuccess = (
    data: { block?: { id?: number }; observation_count?: number },
    args: HydrographPublishArgs
  ) => {
    setPublishSuccess({
      blockId: data.block?.id ?? null,
      count: data.observation_count ?? args.measurements.length,
      wellName: selectedWell?.name ?? '',
    })
    invalidate({
      resource: 'observation/transducer-groundwater-level',
      dataProviderName: 'ocotillo',
      invalidates: ['list'],
    })
  }

  const handlePublish = async (args: HydrographPublishArgs) => {
    setPublishSuccess(null)
    setPublishError(null)

    try {
      applyPublishSuccess(await postCorrectedBlock(args, false), args)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const body = error.response.data ?? {}
        const blockIds: number[] =
          body.overlapping_block_ids ??
          body.detail?.overlapping_block_ids ??
          []
        setPendingOverlap({ blockIds, args })
        return
      }
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setPublishError(
          'The transducer block upload endpoint is not available yet — see docs/hydrograph-correction-upload-contract.md.'
        )
        return
      }
      setPublishError(
        error instanceof Error ? error.message : 'Publishing failed.'
      )
    }
  }

  const confirmReplaceOverlap = async () => {
    if (!pendingOverlap) return
    const { args } = pendingOverlap
    setPendingOverlap(null)

    try {
      applyPublishSuccess(await postCorrectedBlock(args, true), args)
    } catch (error) {
      setPublishError(
        error instanceof Error ? error.message : 'Publishing failed.'
      )
    }
  }

  const handleWellntelIngested = ({
    well,
    wellName,
    measurements,
    isDemo,
  }: WellntelIngestResult) => {
    setParsedUpload({
      pointId: wellName,
      detectedDelimiter: 'wellntel-api',
      detectedTimeColumn: 'timestamp',
      detectedValueColumn: 'depth',
      valueKind: 'depth_to_water',
      measurements,
    })
    setUploadedFileName(`Wellntel API (${wellName})`)
    setUploadError(null)
    setIsIngestDialogOpen(false)

    if (isDemo || !well) {
      setSelectedWell(null)
      setIngestedWellName(`${wellName} (demo)`)
      setDemoKind('wellntel')
    } else {
      setDemoKind(null)
      setIngestedWellName(null)
      setSelectedWell(well)
    }
  }

  const handleInitialUpload = async (file?: File) => {
    if (!file) return

    try {
      const parsed = file.name.toLowerCase().endsWith('.xlsx')
        ? parseHydrographWorkbookUpload(await file.arrayBuffer(), file.name)
        : parseHydrographUpload(await file.text())
      await applyParsedUpload(parsed, file.name)
    } catch (error) {
      setParsedUpload(null)
      setUploadedFileName(file?.name ?? null)
      setSelectedWell(null)
      setUploadError(
        error instanceof Error
          ? error.message
          : 'Unable to parse the uploaded file.'
      )
    }
  }

  const handleLoadDemoFile = async (kind: DemoKind) => {
    const { fileName } = DEMO_CONFIG[kind]
    setIsLoadingDemo(true)
    try {
      const response = await fetch(`/${fileName}`)
      if (!response.ok) {
        throw new Error(`Unable to fetch the example file ${fileName}.`)
      }

      const parsed = parseHydrographUpload(await response.text())
      // Demo mode is self-contained: no well lookup, synthetic manual
      // observations stand in for Ocotillo records.
      setParsedUpload(parsed)
      setUploadedFileName(fileName)
      setSelectedWell(null)
      setUploadError(null)
      setIngestedWellName(null)
      setDemoKind(kind)
    } catch (error) {
      setParsedUpload(null)
      setUploadedFileName(null)
      setSelectedWell(null)
      setDemoKind(null)
      setUploadError(
        error instanceof Error
          ? error.message
          : 'Unable to load the example file.'
      )
    } finally {
      setIsLoadingDemo(false)
    }
  }

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Stack spacing={2}>
        <Breadcrumb hideIcons={true} />

        <Stack spacing={0.5}>
          <OcotilloPageTitle title="Hydrograph Correction" />
          <Typography variant="body2" color="text.secondary">
            Upload a transducer file first. Ocotillo will try to extract
            thing.name from the file and resolve the well automatically.
          </Typography>
        </Stack>

        <Paper elevation={2} sx={{ borderRadius: 2 }}>
          <Box sx={{ px: 2, py: 2 }}>
            <Stack spacing={2}>
              <input
                ref={fileInputRef}
                hidden
                type="file"
                accept=".txt,.csv,.dat,.wcsv,.xlsx"
                onChange={(event) => handleInitialUpload(event.target.files?.[0])}
              />

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1.5}
                alignItems={{ xs: 'stretch', md: 'center' }}
              >
                <Button
                  variant="contained"
                  startIcon={<Publish />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Transducer File
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AutoAwesome />}
                  onClick={() => handleLoadDemoFile('transducer')}
                  disabled={isLoadingDemo}
                >
                  Transducer Demo
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AutoAwesome />}
                  onClick={() => handleLoadDemoFile('diver')}
                  disabled={isLoadingDemo}
                >
                  Diver Office Demo
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AutoAwesome />}
                  onClick={() => handleLoadDemoFile('wellntel')}
                  disabled={isLoadingDemo}
                >
                  Wellntel Demo
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CloudDownload />}
                  onClick={() => setIsIngestDialogOpen(true)}
                >
                  Ingest Wellntel
                </Button>
                <Typography variant="body2" color="text.secondary">
                  If extraction fails, use the well search below.
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {demoKind ? <Chip color="info" label="Demo data" /> : null}
                {uploadedFileName ? <Chip label={`File: ${uploadedFileName}`} /> : null}
                {parsedUpload?.pointId ? (
                  <Chip label={`Extracted PointID: ${parsedUpload.pointId}`} />
                ) : null}
                {parsedUpload ? (
                  <Chip label={`Rows: ${parsedUpload.measurements.length}`} />
                ) : null}
                {selectedWell ? (
                  <Chip
                    color={pointIdMatchesSelectedWell ? 'success' : 'default'}
                    label={`Selected well: ${selectedWell.name}`}
                  />
                ) : null}
                {isResolvingWell ? (
                  <Chip color="info" label="Resolving well from upload..." />
                ) : null}
              </Stack>

              {uploadError ? <Alert severity="warning">{uploadError}</Alert> : null}

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Autocomplete
                    {...autocompleteProps}
                    options={(autocompleteProps.options as IWell[]) ?? []}
                    loading={Boolean(autocompleteProps.loading)}
                    value={selectedWell}
                    getOptionLabel={(option: IWell) => option?.name ?? ''}
                    filterOptions={(options) => options}
                    onChange={(_event, value) => {
                      setDemoKind(null)
                      setIngestedWellName(null)
                      setSelectedWell(value)
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Well"
                        placeholder="Search by thing name when upload extraction is missing or incorrect"
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Stack spacing={0.5} justifyContent="center" sx={{ height: '100%' }}>
                    <Typography variant="body2" color="text.secondary">
                      Manual observations: {selectedWell ? manualRows.length : 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stored transducer observations: {selectedWell ? transducerRows.length : 0}
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          </Box>
        </Paper>

        {publishSuccess ? (
          <Alert severity="success" onClose={() => setPublishSuccess(null)}>
            Published {publishSuccess.count} corrected observations
            {publishSuccess.blockId !== null
              ? ` (block ${publishSuccess.blockId})`
              : ''}{' '}
            to {publishSuccess.wellName}.
          </Alert>
        ) : null}
        {publishError ? (
          <Alert severity="error" onClose={() => setPublishError(null)}>
            {publishError}
          </Alert>
        ) : null}

        {!parsedUpload ? (
          <Alert severity="info">
            Upload a transducer file to begin. If the file contains `thing.name`
            or point id metadata, the matching well will be selected automatically.
          </Alert>
        ) : demoKind ? (
          <OcotilloHydrographCorrectionWorkbench
            thingName={ingestedWellName ?? DEMO_CONFIG[demoKind].wellName}
            manualObservations={DEMO_CONFIG[demoKind].manualObservations}
            transducerObservations={[]}
            initialUpload={parsedUpload}
            initialFileName={uploadedFileName}
            onUploadParsed={applyParsedUpload}
          />
        ) : !selectedWell ? (
          <Alert severity="info">
            The file was parsed, but no well is selected yet. Use the well search
            to continue.
          </Alert>
        ) : isLoading || isResolvingWell ? (
          <Paper elevation={2} sx={{ borderRadius: 2, p: 2 }}>
            <Skeleton variant="rounded" height={520} />
          </Paper>
        ) : (
          <OcotilloHydrographCorrectionWorkbench
            thingName={selectedWell.name}
            manualObservations={manualRows}
            transducerObservations={transducerRows.map(({ observation }) => ({
              observation_datetime: observation.observation_datetime,
              value: observation.value,
            }))}
            initialUpload={parsedUpload}
            initialFileName={uploadedFileName}
            onUploadParsed={applyParsedUpload}
            onPublish={handlePublish}
          />
        )}
      </Stack>

      <Dialog
        open={Boolean(pendingOverlap)}
        onClose={() => setPendingOverlap(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Replace existing blocks?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            The corrected time span overlaps existing transducer observation
            {(pendingOverlap?.blockIds.length ?? 0) === 1
              ? ' block '
              : ' blocks '}
            {pendingOverlap?.blockIds.length
              ? pendingOverlap.blockIds.join(', ')
              : '(ids unavailable)'}
            . Replacing deletes those blocks and their observations in the
            same transaction.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingOverlap(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmReplaceOverlap}>
            Replace Existing Blocks
          </Button>
        </DialogActions>
      </Dialog>

      <WellntelIngestDialog
        open={isIngestDialogOpen}
        onClose={() => setIsIngestDialogOpen(false)}
        onIngested={handleWellntelIngested}
      />
    </Box>
  )
}
