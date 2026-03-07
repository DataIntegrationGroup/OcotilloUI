import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  Divider,
  IconButton,
  LinearProgress,
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
} from '@mui/material'
import {
  Checklist,
  ContentPaste,
  DeleteOutline,
  Download,
  FileDownload,
  Map as MapIcon,
  Search,
  PictureAsPdf,
} from '@mui/icons-material'
import { BaseRecord, useDataProvider, useNotification } from '@refinedev/core'
import { useAll } from '@/hooks'
import { IContact, IObservation, IWell } from '@/interfaces/ocotillo'
import { WellPDF } from '@/components'
import { Document, pdf } from '@react-pdf/renderer'
import MapComponent from '@/components/MapComponent'
import { Layer, Source } from 'react-map-gl'
import type { FeatureCollection, Geometry } from 'geojson'

type WellChipState = {
  query: string
  status: 'resolved' | 'error'
  wellId?: number
}

type WellBundle = {
  well: IWell
  contacts: IContact[]
  assets: BaseRecord[]
  observations: readonly Partial<IObservation>[]
}

const parseIds = (raw: string) =>
  raw
    .split(/[\n,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)

const normalizeLookupKey = (value: string) =>
  value
    .normalize('NFKC')
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase()

const compactLookupKey = (value: string) =>
  normalizeLookupKey(value).replace(/[^A-Z0-9]/g, '')

const buildWellLookup = (wells: IWell[]) => {
  const lookup = new Map<string, IWell>()

  wells.forEach((well) => {
    const name = String(well.name ?? '')
    if (!name.trim()) return

    const normalizedName = normalizeLookupKey(name)
    lookup.set(normalizedName, well)

    const compactName = compactLookupKey(name)
    if (compactName && compactName !== normalizedName) {
      lookup.set(compactName, well)
    }
  })

  return lookup
}

const buildBatchFilename = () => {
  const date = new Date().toISOString().slice(0, 10)
  return `FieldSheets_Batch_${date}`
}

const sanitizeFilenamePart = (value: string) =>
  value
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

const safeFilenamePrefix = (value: string) =>
  sanitizeFilenamePart(value) || 'FieldSheets_Batch'
const isDevelopment = import.meta.env.DEV

const BatchRouteMap = ({ wells }: { wells: IWell[] }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const points = useMemo(
    () => {
      const rawPoints = wells
        .map((well, index) => {
          const coords = well.current_location?.geometry?.coordinates
          if (!coords || coords.length < 2) return null

          const baseLng = Number(coords[0])
          const baseLat = Number(coords[1])
          if (!Number.isFinite(baseLng) || !Number.isFinite(baseLat)) return null

          return {
            id: well.id,
            name: well.name,
            lng: baseLng,
            lat: baseLat,
          }
        })
        .filter(Boolean) as {
        id: number
        name: string
        lng: number
        lat: number
      }[]

      // Spread markers that share identical coordinates so they are all visible.
      const grouped = new Map<string, typeof rawPoints>()
      rawPoints.forEach((point) => {
        const key = `${point.lng.toFixed(7)},${point.lat.toFixed(7)}`
        const group = grouped.get(key) ?? []
        group.push(point)
        grouped.set(key, group)
      })

      const jittered: typeof rawPoints = []
      grouped.forEach((group) => {
        if (group.length === 1) {
          jittered.push(group[0])
          return
        }

        const radius = 0.00015
        group.forEach((point, idx) => {
          const angle = (2 * Math.PI * idx) / group.length
          jittered.push({
            ...point,
            lng: point.lng + Math.cos(angle) * radius,
            lat: point.lat + Math.sin(angle) * radius,
          })
        })
      })

      return jittered
    },
    [wells]
  )

  const center = useMemo(() => {
    if (points.length === 0) {
      return { longitude: -106, latitude: 34.5 }
    }
    const lng = points.reduce((sum, p) => sum + p.lng, 0) / points.length
    const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length
    return { longitude: lng, latitude: lat }
  }, [points])

  const routeData = useMemo<FeatureCollection<Geometry>>(() => {
      const pointFeatures = points.map((point) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [point.lng, point.lat] as [number, number],
        },
        properties: {
          id: point.id,
          name: point.name,
        },
      }))

    return {
      type: 'FeatureCollection',
      features: pointFeatures,
    }
  }, [points])

  const initialViewState = useMemo(
    () => ({
      longitude: center.longitude,
      latitude: center.latitude,
      zoom: points.length === 1 ? 10 : 6.5,
    }),
    [center, points.length]
  )

  if (points.length === 0) {
    return (
      <Box
        sx={{
          height: 520,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          color: 'text.secondary',
          bgcolor: '#eaf0f6',
          borderRadius: 1,
        }}
      >
        <MapIcon sx={{ fontSize: 36, opacity: 0.4 }} />
        <Typography variant="body2" fontStyle="italic" sx={{ opacity: 0.7 }}>
          No mapped coordinates available for selected wells
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        borderRadius: 1,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        height: 620,
        width: '100%',
      }}
    >
      <MapComponent
        containerRef={containerRef}
        initialViewState={initialViewState}
        showDrawControls={{ show: false }}
        showGeocoder={{ show: false }}
        showNavigation={{ show: true, position: 'top-right' }}
      >
        <Source id="batch-route-source" type="geojson" data={routeData}>
          <Layer
            id="batch-route-points"
            type="circle"
            filter={['==', ['geometry-type'], 'Point']}
            paint={{
              'circle-color': '#1a5276',
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2,
              'circle-radius': 8,
            }}
          />
          <Layer
            id="batch-route-labels"
            type="symbol"
            filter={['==', ['geometry-type'], 'Point']}
            layout={{
              'text-field': ['get', 'name'],
              'text-size': 11,
              'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
              'text-anchor': 'top',
              'text-offset': [0, 1.1],
              'text-allow-overlap': true,
            }}
            paint={{
              'text-color': '#1a5276',
              'text-halo-color': '#ffffff',
              'text-halo-width': 1,
            }}
          />
        </Source>
      </MapComponent>
    </Box>
  )
}

const ExportDialog = ({
  open,
  onClose,
  onGenerate,
  isGenerating,
  progress,
  bundles,
  filename,
  setFilename,
}: {
  open: boolean
  onClose: () => void
  onGenerate: () => Promise<void>
  isGenerating: boolean
  progress: number
  bundles: WellBundle[]
  filename: string
  setFilename: (value: string) => void
}) => {
  return (
    <Dialog
      open={open}
      onClose={isGenerating ? undefined : onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PictureAsPdf sx={{ fontSize: 18, color: 'secondary.main' }} />
        Batch Export Field Sheets
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography
          variant="overline"
          sx={{ color: 'primary.main', display: 'block', mb: 1 }}
        >
          Export Summary
        </Typography>
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden',
            mb: 2.5,
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Well ID</TableCell>
                <TableCell>Name</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bundles.map((bundle, index) => (
                <TableRow key={bundle.well.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Typography
                      variant="caption"
                      sx={{ color: 'primary.main', fontWeight: 'bold' }}
                    >
                      {bundle.well.id}
                    </Typography>
                  </TableCell>
                  <TableCell>{bundle.well.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        <Typography
          variant="overline"
          sx={{ color: 'primary.main', display: 'block', mb: 1 }}
        >
          File Name Prefix
        </Typography>
        <TextField
          fullWidth
          size="small"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          disabled={isGenerating}
          helperText="The batch will be downloaded as a single PDF using this filename."
        />

        {isGenerating && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption" color="text.secondary">
              Generating PDF file... {progress}%
            </Typography>
          </Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 2.5, py: 1.5, gap: 1 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={onGenerate}
          disabled={isGenerating || bundles.length === 0}
        >
          {isGenerating ? 'Generating...' : 'Generate PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export const WellBatchExport = () => {
  const { open: notify } = useNotification()
  const dataProvider = useDataProvider()
  const ocotilloDataProvider = dataProvider('ocotillo')
  const { triggerAll, isLoading: wellsLoading } = useAll<IWell>({
    resource: 'thing/water-well',
    dataProviderName: 'ocotillo',
    pageSize: 500,
  })

  const [allWells, setAllWells] = useState<IWell[]>([])
  const [pasteValue, setPasteValue] = useState('')
  const [chips, setChips] = useState<WellChipState[]>([])
  const [bundlesByWellId, setBundlesByWellId] = useState<
    Record<number, WellBundle>
  >({})
  const [mapWellsById, setMapWellsById] = useState<Record<number, IWell>>({})
  const [failedMapWellIds, setFailedMapWellIds] = useState<Set<number>>(
    () => new Set()
  )
  const [failedBundleWellIds, setFailedBundleWellIds] = useState<Set<number>>(
    () => new Set()
  )
  const [isLoadingBundles, setIsLoadingBundles] = useState(false)
  const [isResolvingIds, setIsResolvingIds] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [filename, setFilename] = useState(buildBatchFilename())

  const loadWells = useCallback(async () => {
    const wellsResult = await triggerAll()
    setAllWells(wellsResult ?? [])
  }, [triggerAll])

  const wellsById = useMemo(() => {
    const byId = new Map<number, IWell>()
    allWells.forEach((well) => byId.set(well.id, well))
    return byId
  }, [allWells])

  const wellLookup = useMemo(() => buildWellLookup(allWells), [allWells])

  const resolveWellFromToken = useCallback(
    (token: string) => {
      const normalizedToken = normalizeLookupKey(token)
      const compactToken = compactLookupKey(token)
      return (
        wellLookup.get(normalizedToken) ||
        (compactToken ? wellLookup.get(compactToken) : undefined)
      )
    },
    [wellLookup]
  )

  const resolvedIds = useMemo(
    () =>
      chips
        .filter((chip) => chip.status === 'resolved' && chip.wellId !== undefined)
        .map((chip) => chip.wellId as number),
    [chips]
  )

  useEffect(() => {
    const resolvedSet = new Set(resolvedIds)
    setFailedBundleWellIds((prev) => {
      let changed = false
      const next = new Set<number>()
      prev.forEach((id) => {
        if (resolvedSet.has(id)) {
          next.add(id)
        } else {
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [resolvedIds])

  const resolvedWells = useMemo(
    () => resolvedIds.map((id) => wellsById.get(id)).filter(Boolean) as IWell[],
    [resolvedIds, wellsById]
  )

  const selectedWellIds = useMemo(() => new Set(resolvedIds), [resolvedIds])

  const exportBundles = useMemo(
    () =>
      resolvedIds
        .map((id) => bundlesByWellId[id])
        .filter(Boolean) as WellBundle[],
    [resolvedIds, bundlesByWellId]
  )

  const exportReadyBundles = useMemo(
    () =>
      resolvedIds
        .map((id) => {
          const loadedBundle = bundlesByWellId[id]
          if (loadedBundle) return loadedBundle
          if (!isDevelopment) return null

          const fallbackWell = mapWellsById[id] ?? wellsById.get(id)
          if (!fallbackWell) return null

          return {
            well: fallbackWell,
            assets: [],
            contacts: [],
            observations: [],
          } as WellBundle
        })
        .filter(Boolean) as WellBundle[],
    [resolvedIds, bundlesByWellId, mapWellsById, wellsById]
  )

  const mapPreviewWells = useMemo(
    () =>
      resolvedIds
        .map(
          (id) => mapWellsById[id] ?? bundlesByWellId[id]?.well ?? wellsById.get(id)
        )
        .filter(Boolean) as IWell[],
    [resolvedIds, mapWellsById, bundlesByWellId, wellsById]
  )

  const errorChips = chips.filter((chip) => chip.status === 'error')
  const unresolvedCount = errorChips.length
  const unresolvedLabel =
    unresolvedCount > 0 ? ` and ${unresolvedCount} unresolved` : ''
  const skippedResolvedCount = useMemo(
    () => resolvedIds.filter((id) => failedBundleWellIds.has(id)).length,
    [resolvedIds, failedBundleWellIds]
  )

  const fetchBundle = useCallback(
    async (wellId: number): Promise<WellBundle> => {
      const assetsRequest = ocotilloDataProvider
        .getList({
          resource: 'asset',
          meta: {
            params: {
              thing_id: wellId,
            },
          },
        })
        .catch((error) => {
          if (isDevelopment) {
            return {
              data: [] as BaseRecord[],
              total: 0,
            }
          }
          throw error
        })

      const [wellResult, assetsResult, contactsResult, observationsResult] =
        await Promise.all([
          ocotilloDataProvider.getOne({
            resource: 'thing-well',
            id: wellId,
          }),
          assetsRequest,
          ocotilloDataProvider.getList({
            resource: 'contact',
            meta: {
              params: {
                thing_id: wellId,
              },
            },
          }),
          ocotilloDataProvider.getList({
            resource: 'observation/groundwater-level',
            meta: {
              params: {
                thing_id: wellId,
              },
            },
          }),
        ])

      return {
        well: wellResult.data as IWell,
        assets: assetsResult.data ?? [],
        contacts: (contactsResult.data ?? []) as IContact[],
        observations: (observationsResult.data ?? []) as readonly Partial<IObservation>[],
      }
    },
    [ocotilloDataProvider]
  )

  useEffect(() => {
    if (!resolvedIds.length) return

    const missingIds = resolvedIds.filter(
      (id) => !bundlesByWellId[id] && !failedBundleWellIds.has(id)
    )
    if (missingIds.length === 0) return

    let mounted = true

    const loadMissing = async () => {
      setIsLoadingBundles(true)
      try {
        const results = await Promise.allSettled(
          missingIds.map((id) => fetchBundle(id))
        )
        if (!mounted) return

        const bundles: WellBundle[] = []
        const failedIds: number[] = []

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            bundles.push(result.value)
          } else {
            failedIds.push(missingIds[index])
          }
        })

        if (bundles.length > 0) {
          setBundlesByWellId((prev) => {
            const next = { ...prev }
            bundles.forEach((bundle) => {
              next[bundle.well.id] = bundle
            })
            return next
          })
        }

        if (failedIds.length > 0) {
          setFailedBundleWellIds((prev) => {
            const next = new Set(prev)
            failedIds.forEach((id) => next.add(id))
            return next
          })
          notify?.({
            type: 'error',
            message: 'Some wells could not be loaded',
            description: `Skipped ${failedIds.length} well(s): ${failedIds.join(', ')}.`,
          })
        }
      } catch (error) {
        notify?.({
          type: 'error',
          message: 'Batch export data load failed',
          description: 'Unable to load selected wells. Please retry.',
        })
      } finally {
        if (mounted) setIsLoadingBundles(false)
      }
    }

    void loadMissing()

    return () => {
      mounted = false
    }
  }, [resolvedIds, bundlesByWellId, failedBundleWellIds, fetchBundle, notify])

  useEffect(() => {
    if (!resolvedIds.length) return

    const missingMapIds = resolvedIds.filter(
      (id) => !mapWellsById[id] && !failedMapWellIds.has(id)
    )
    if (missingMapIds.length === 0) return

    let mounted = true

    const loadMapWells = async () => {
      const results = await Promise.allSettled(
        missingMapIds.map((id) =>
          ocotilloDataProvider.getOne({
            resource: 'thing-well',
            id,
          })
        )
      )
      if (!mounted) return

      const loaded: IWell[] = []
      const failed: number[] = []

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          loaded.push(result.value.data as IWell)
        } else {
          failed.push(missingMapIds[index])
        }
      })

      if (loaded.length > 0) {
        setMapWellsById((prev) => {
          const next = { ...prev }
          loaded.forEach((well) => {
            next[well.id] = well
          })
          return next
        })
      }

      if (failed.length > 0) {
        setFailedMapWellIds((prev) => {
          const next = new Set(prev)
          failed.forEach((id) => next.add(id))
          return next
        })
      }
    }

    void loadMapWells()

    return () => {
      mounted = false
    }
  }, [resolvedIds, mapWellsById, failedMapWellIds, ocotilloDataProvider])

  useEffect(() => {
    if (!allWells.length) return

    setChips((prev) => {
      let changed = false
      const selectedIds = new Set(
        prev
          .filter((chip) => chip.status === 'resolved' && chip.wellId !== undefined)
          .map((chip) => chip.wellId as number)
      )

      const next = prev.map((chip) => {
        if (chip.status !== 'error') return chip

        const match = resolveWellFromToken(chip.query)
        if (!match || selectedIds.has(match.id)) return chip

        selectedIds.add(match.id)
        changed = true
        return {
          ...chip,
          status: 'resolved' as const,
          wellId: match.id,
        }
      })

      return changed ? next : prev
    })
  }, [allWells, resolveWellFromToken])

  const processPaste = async () => {
    const tokens = parseIds(pasteValue)
    if (tokens.length === 0) return

    setIsResolvingIds(true)
    try {
      let effectiveWells = allWells
      if (effectiveWells.length === 0) {
        const loadedWells = await triggerAll()
        effectiveWells = loadedWells ?? []
        setAllWells(effectiveWells)
      }

      const effectiveLookup = buildWellLookup(effectiveWells)
      const resolveFromEffectiveLookup = (token: string) => {
        const normalizedToken = normalizeLookupKey(token)
        const compactToken = compactLookupKey(token)
        return (
          effectiveLookup.get(normalizedToken) ||
          (compactToken ? effectiveLookup.get(compactToken) : undefined)
        )
      }

      setChips((prev) => {
        const next = [...prev]
        const selectedWellIds = new Set(
          next
            .filter((chip) => chip.status === 'resolved' && chip.wellId !== undefined)
            .map((chip) => chip.wellId as number)
        )

        for (const token of tokens) {
          const normalizedToken = normalizeLookupKey(token)
          const existingIndex = next.findIndex(
            (chip) => normalizeLookupKey(chip.query) === normalizedToken
          )
          const match = resolveFromEffectiveLookup(token)

          if (existingIndex >= 0) {
            const existingChip = next[existingIndex]
            if (existingChip.status === 'resolved') continue
            if (!match || selectedWellIds.has(match.id)) continue

            selectedWellIds.add(match.id)
            next[existingIndex] = {
              query: token,
              status: 'resolved',
              wellId: match.id,
            }
            continue
          }

          if (!match) {
            next.push({
              query: token,
              status: 'error',
            })
            continue
          }

          if (selectedWellIds.has(match.id)) continue

          selectedWellIds.add(match.id)
          next.push({
            query: token,
            status: 'resolved',
            wellId: match.id,
          })
        }

        return next
      })
      setPasteValue('')
    } finally {
      setIsResolvingIds(false)
    }
  }

  const addFromSearch = (well: IWell | null) => {
    if (!well) return
    if (chips.find((chip) => chip.wellId === well.id)) return

    setChips((prev) => [
      ...prev,
      {
        query: String(well.id),
        status: 'resolved',
        wellId: well.id,
      },
    ])
  }

  const removeChip = (query: string) => {
    setChips((prev) => prev.filter((chip) => chip.query !== query))
  }

  const generateBatch = async () => {
    if (exportReadyBundles.length === 0) return

    setIsGenerating(true)
    setProgress(0)
    const baseFilename = safeFilenamePrefix(filename)

    try {
      const blob = await pdf(
        <Document
          title={baseFilename}
          author="NMBGMR Ocotillo"
          creator="NMBGMR Ocotillo System"
          language="en-US"
          subject="Batch Well Field Data Report"
        >
          {exportReadyBundles.map((bundle) => (
            <WellPDF
              key={bundle.well.id}
              well={bundle.well}
              contacts={bundle.contacts}
              assets={bundle.assets}
              observations={bundle.observations}
              asDocument={false}
            />
          ))}
        </Document>
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${baseFilename}.pdf`
      link.click()
      URL.revokeObjectURL(url)
      setProgress(100)

      notify?.({
        type: 'success',
        message: 'Batch export complete',
        description: `Generated 1 PDF file with ${exportReadyBundles.length} field sheets.`,
      })
      setExportOpen(false)
    } catch (error) {
      notify?.({
        type: 'error',
        message: 'Batch PDF generation failed',
      })
    } finally {
      setIsGenerating(false)
      setProgress(0)
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 400 }}>
          Batch Export Field Information Sheets
        </Typography>
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          Paste well IDs, search wells, and generate field sheet PDFs in one run.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 680px', gap: 3 }}>
        <Stack spacing={2}>
          <Paper elevation={0}>
            <Box
              sx={{
                bgcolor: '#f0f3f7',
                borderBottom: '1px solid',
                borderColor: 'divider',
                px: 2,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <ContentPaste sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="overline" sx={{ color: 'primary.main' }}>
                Paste Well IDs
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <TextField
                multiline
                rows={4}
                fullWidth
                value={pasteValue}
                onChange={(e) => setPasteValue(e.target.value)}
                placeholder={'1234\n5678\nNM-2401'}
                size="small"
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  disabled={!pasteValue.trim() || isResolvingIds}
                  onClick={() => {
                    void processPaste()
                  }}
                  startIcon={<ContentPaste />}
                >
                  {isResolvingIds ? 'Resolving...' : 'Resolve IDs'}
                </Button>
              </Box>
            </Box>
          </Paper>

          <Paper elevation={0}>
            <Box
              sx={{
                bgcolor: '#f0f3f7',
                borderBottom: '1px solid',
                borderColor: 'divider',
                px: 2,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Search sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="overline" sx={{ color: 'primary.main' }}>
                Search and Add
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Autocomplete
                options={allWells.filter((well) => !selectedWellIds.has(well.id))}
                loading={wellsLoading}
                getOptionLabel={(well) => `${well.id} · ${well.name}`}
                filterOptions={(options, { inputValue }) => {
                  const q = inputValue.toLowerCase().trim()
                  if (!q) return options
                  return options.filter((option) => {
                    const id = String(option.id).toLowerCase()
                    const name = String(option.name ?? '').toLowerCase()
                    return id.includes(q) || name.includes(q)
                  })
                }}
                onChange={(_, value) => addFromSearch(value)}
                renderOption={(props, option) => (
                  <Box component="li" {...props} sx={{ gap: 1.5 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: 'primary.main', fontWeight: 'bold', minWidth: 72 }}
                    >
                      {option.id}
                    </Typography>
                    <Typography variant="body2">{option.name}</Typography>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Search by id or name"
                  />
                )}
              />
            </Box>
          </Paper>

          <Paper elevation={0}>
            <Box
              sx={{
                bgcolor: '#f0f3f7',
                borderBottom: '1px solid',
                borderColor: 'divider',
                px: 2,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Checklist sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="overline" sx={{ color: 'primary.main' }}>
                Selected Wells
              </Typography>
              {chips.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                  {resolvedWells.length} resolved{unresolvedLabel}
                </Typography>
              )}
            </Box>

            {errorChips.length > 0 && (
              <Alert
                severity="error"
                variant="outlined"
                sx={{ mx: 2, mt: 2, fontSize: '0.8rem', borderRadius: 1 }}
              >
                {errorChips.length} ID{errorChips.length > 1 ? 's' : ''} not
                found: <strong>{errorChips.map((chip) => chip.query).join(', ')}</strong>
              </Alert>
            )}

            <Box sx={{ p: 2, minHeight: 72 }}>
              {chips.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontStyle="italic"
                  textAlign="center"
                  sx={{ py: 2 }}
                >
                  No wells selected yet
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {chips.map((chip) => (
                    <Chip
                      key={chip.query}
                      label={
                        chip.status === 'resolved'
                          ? `${chip.wellId} · ${
                              wellsById.get(chip.wellId as number)?.name ??
                              'Well'
                            }`
                          : `${chip.query} · not found`
                      }
                      onDelete={() => removeChip(chip.query)}
                      size="small"
                      sx={{
                        bgcolor: chip.status === 'error' ? '#fdf2f2' : '#eaf0f6',
                        border: `1px solid ${
                          chip.status === 'error' ? '#f1a9a0' : '#aec6e0'
                        }`,
                        color: chip.status === 'error' ? 'error.main' : 'primary.main',
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>

            {chips.length > 0 && (
              <>
                <Divider />
                <Box
                  sx={{
                    px: 2,
                    py: 1.25,
                    bgcolor: '#f8f9fb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary" fontStyle="italic">
                      {exportReadyBundles.length} ready for export
                      {skippedResolvedCount > 0
                        ? ` (${skippedResolvedCount} skipped)`
                        : ''}
                    </Typography>
                    <Tooltip title="Clear all">
                      <IconButton
                        size="small"
                        onClick={() => setChips([])}
                        sx={{ color: 'text.secondary' }}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{
                      minHeight: 28,
                      px: 1.25,
                      py: 0.25,
                      fontSize: '0.75rem',
                    }}
                    disabled={
                      resolvedWells.length === 0 ||
                      isLoadingBundles ||
                      exportReadyBundles.length === 0
                    }
                    onClick={() => setExportOpen(true)}
                    startIcon={<FileDownload />}
                  >
                    Export Field Sheets
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </Stack>

        <Stack spacing={2}>
          <Paper elevation={0}>
            <Box sx={{ p: 2 }}>
              <BatchRouteMap wells={mapPreviewWells} />
            </Box>
          </Paper>
        </Stack>
      </Box>

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onGenerate={generateBatch}
        isGenerating={isGenerating}
        progress={progress}
        bundles={exportReadyBundles}
        filename={filename}
        setFilename={setFilename}
      />
    </Box>
  )
}
