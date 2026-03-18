import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  Checklist,
  ContentPaste,
  DeleteOutline,
  FileDownload,
  FactCheck,
  Search,
} from '@mui/icons-material'
import { BaseRecord, useDataProvider, useNotification } from '@refinedev/core'
import { List, useAutocomplete } from '@refinedev/mui'
import { AppBreadcrumb } from '@/components/AppBreadcrumb'
import {
  IContact,
  IObservation,
  IWell,
  WellBundle,
  WellChipState,
} from '@/interfaces/ocotillo'
import { OcotilloDocument, WellPDF } from '@/components'
import { pdf } from '@react-pdf/renderer'
import {
  buildBatchFilename,
  buildWellLookup,
  compactLookupKey,
  normalizeLookupKey,
  parseIds,
  safeFilenamePrefix,
} from '@/utils'
import { BatchRouteMap } from './components/BatchRouteMap'
import { ExportDialog } from './components/ExportDialog'
const TOKEN_RESOLVE_CONCURRENCY = 5
const TOKEN_RESOLVE_PAGE_SIZE = 200
const TOKEN_RESOLVE_MAX_PAGES = 20
const BUNDLE_FETCH_CONCURRENCY = 4
const BUNDLE_RESOURCE_PAGE_SIZE = 100
const BUNDLE_RESOURCE_MAX_PAGES = 20

export const WellBatchExport = () => {
  const { open: notify } = useNotification()
  const dataProvider = useDataProvider()
  const ocotilloDataProvider = dataProvider('ocotillo')
  const { autocompleteProps: searchAutocompleteProps } = useAutocomplete<IWell>({
    resource: 'thing/water-well',
    dataProviderName: 'ocotillo',
    onSearch: (value) => [
      {
        field: 'name',
        operator: 'contains',
        value,
      },
    ],
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
  const [isResolvingIds, setIsResolvingIds] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [filename, setFilename] = useState(buildBatchFilename())

  const upsertWells = useCallback((wells: IWell[]) => {
    if (wells.length === 0) return
    setAllWells((prev) => {
      const nextById = new Map<number, IWell>()
      let changed = false

      prev.forEach((well) => nextById.set(well.id, well))
      wells.forEach((well) => {
        const existing = nextById.get(well.id)
        if (!existing) {
          changed = true
          nextById.set(well.id, well)
          return
        }

        // Avoid render loops by not rewriting unchanged records from autocomplete.
        if (
          existing.name !== well.name ||
          existing.release_status !== well.release_status ||
          existing.thing_type !== well.thing_type
        ) {
          changed = true
          nextById.set(well.id, well)
        }
      })

      return changed ? Array.from(nextById.values()) : prev
    })
  }, [])

  const mapWithConcurrency = useCallback(
    async <T, R>(
      items: T[],
      concurrency: number,
      runner: (item: T) => Promise<R>
    ): Promise<R[]> => {
      if (items.length === 0) return []
      const results = new Array<R>(items.length)
      let cursor = 0

      const worker = async () => {
        while (true) {
          const index = cursor
          cursor += 1
          if (index >= items.length) break
          results[index] = await runner(items[index])
        }
      }

      const workerCount = Math.max(1, Math.min(concurrency, items.length))
      await Promise.all(Array.from({ length: workerCount }, () => worker()))
      return results
    },
    []
  )

  const resolveTokenByApi = useCallback(
    async (token: string): Promise<IWell | undefined> => {
      const normalizedToken = normalizeLookupKey(token)
      const compactToken = compactLookupKey(token)

      const exactResult = await ocotilloDataProvider.getList({
        resource: 'thing/water-well',
        pagination: { currentPage: 1, pageSize: 10 },
        filters: [
          {
            field: 'name',
            operator: 'eq',
            value: token,
          },
        ],
      })
      const exactCandidates = (exactResult.data ?? []) as IWell[]
      const exactNameMatch =
        exactCandidates.find(
          (well) => normalizeLookupKey(String(well.name ?? '')) === normalizedToken
        ) ??
        exactCandidates.find(
          (well) => compactLookupKey(String(well.name ?? '')) === compactToken
        )
      if (exactNameMatch) return exactNameMatch

      let page = 1
      while (page <= TOKEN_RESOLVE_MAX_PAGES) {
        const result = await ocotilloDataProvider.getList({
          resource: 'thing/water-well',
          pagination: { currentPage: page, pageSize: TOKEN_RESOLVE_PAGE_SIZE },
          filters: [
            {
              field: 'name',
              operator: 'contains',
              value: token,
            },
          ],
        })

        const candidates = (result.data ?? []) as IWell[]
        const exactMatch =
          candidates.find(
            (well) =>
              normalizeLookupKey(String(well.name ?? '')) === normalizedToken
          ) ??
          candidates.find(
            (well) => compactLookupKey(String(well.name ?? '')) === compactToken
          )

        if (exactMatch) return exactMatch

        const reachedEnd =
          candidates.length < TOKEN_RESOLVE_PAGE_SIZE ||
          page * TOKEN_RESOLVE_PAGE_SIZE >= (result.total ?? 0)
        if (reachedEnd) break

        page += 1
      }

      return undefined
    },
    [ocotilloDataProvider]
  )

  useEffect(() => {
    const options = (searchAutocompleteProps.options ?? []) as IWell[]
    upsertWells(options)
  }, [searchAutocompleteProps.options, upsertWells])

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

  const resolvedSelections = useMemo(
    () =>
      chips
        .filter((chip) => chip.status === 'resolved' && chip.wellId !== undefined)
        .map((chip) => {
          const id = chip.wellId as number
          return {
            id,
            name: wellsById.get(id)?.name ?? chip.query,
          }
        }),
    [chips, wellsById]
  )
  const resolvedNameById = useMemo(
    () => new Map(resolvedSelections.map((entry) => [entry.id, entry.name])),
    [resolvedSelections]
  )

  const selectedWellIds = useMemo(() => new Set(resolvedIds), [resolvedIds])

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

  const fetchBundle = useCallback(
    async (wellId: number): Promise<WellBundle> => {
      const wellResult = await ocotilloDataProvider.getOne({
        resource: 'thing-well',
        id: wellId,
      })

      const fetchThingResource = async <T extends BaseRecord>(resource: string) => {
        let page = 1
        const rows: T[] = []

        while (page <= BUNDLE_RESOURCE_MAX_PAGES) {
          const result = await ocotilloDataProvider.getList({
            resource,
            pagination: { currentPage: page,
              pageSize: BUNDLE_RESOURCE_PAGE_SIZE,
            },
            meta: {
              params: {
                thing_id: wellId,
              },
            },
          })

          const pageRows = (result.data ?? []) as T[]
          rows.push(...pageRows)

          const reachedEnd =
            pageRows.length < BUNDLE_RESOURCE_PAGE_SIZE ||
            page * BUNDLE_RESOURCE_PAGE_SIZE >= (result.total ?? 0)
          if (reachedEnd) break
          page += 1
        }

        return rows
      }

      const [assets, contacts, observations] = await Promise.all([
        fetchThingResource<BaseRecord>('asset').catch((error) => {
          console.warn(`Failed to load assets for well ${wellId}`, error)
          return [] as BaseRecord[]
        }),
        fetchThingResource<IContact>('contact').catch((error) => {
          console.warn(`Failed to load contacts for well ${wellId}`, error)
          return [] as IContact[]
        }),
        fetchThingResource<Partial<IObservation>>('observation/groundwater-level').catch(
          (error) => {
            console.warn(`Failed to load observations for well ${wellId}`, error)
            return [] as Partial<IObservation>[]
          }
        ),
      ])

      return {
        well: wellResult.data as IWell,
        assets,
        contacts,
        observations,
      }
    },
    [ocotilloDataProvider]
  )

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
      const tokenMatches = await mapWithConcurrency(
        tokens,
        TOKEN_RESOLVE_CONCURRENCY,
        async (token) => {
          const fromCache = resolveWellFromToken(token)
          const match = fromCache ?? (await resolveTokenByApi(token))
          return { token, match }
        }
      )

      upsertWells(tokenMatches.map((entry) => entry.match).filter(Boolean) as IWell[])
      const matchedByToken = new Map<string, IWell | undefined>(
        tokenMatches.map((entry) => [normalizeLookupKey(entry.token), entry.match])
      )

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
          const match = matchedByToken.get(normalizeLookupKey(token))

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
        query: String(well.name ?? well.id),
        status: 'resolved',
        wellId: well.id,
      },
    ])
  }

  const removeChip = (query: string) => {
    setChips((prev) => prev.filter((chip) => chip.query !== query))
  }

  const generateBatch = async () => {
    if (resolvedIds.length === 0) return

    setIsGenerating(true)
    setProgress(0)
    const baseFilename = safeFilenamePrefix(filename)

    try {
      const localBundlesByWellId = { ...bundlesByWellId }
      const bundleIdsToRefresh = [...resolvedIds]

      if (bundleIdsToRefresh.length > 0) {
        const results = await mapWithConcurrency(
          bundleIdsToRefresh,
          BUNDLE_FETCH_CONCURRENCY,
          async (id) => {
            try {
              return {
                status: 'fulfilled' as const,
                id,
                value: await fetchBundle(id),
              }
            } catch (error) {
              return {
                status: 'rejected' as const,
                id,
                reason: error,
              }
            }
          }
        )

        const loadedBundles: WellBundle[] = []
        const failedIds: number[] = []
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            loadedBundles.push(result.value)
          } else {
            failedIds.push(result.id)
          }
        })

        if (loadedBundles.length > 0) {
          loadedBundles.forEach((bundle) => {
            localBundlesByWellId[bundle.well.id] = bundle
          })
          setBundlesByWellId((prev) => {
            const next = { ...prev }
            loadedBundles.forEach((bundle) => {
              next[bundle.well.id] = bundle
            })
            return next
          })
        }

        if (failedIds.length > 0) {
          // Preserve previously loaded bundle data when refresh fails.
          failedIds.forEach((id) => {
            if (localBundlesByWellId[id]) return
            const cachedBundle = bundlesByWellId[id]
            if (!cachedBundle) return
            localBundlesByWellId[id] = cachedBundle
          })

          failedIds.forEach((id) => {
            if (localBundlesByWellId[id]) return
            const fallbackWell = mapWellsById[id] ?? wellsById.get(id)
            if (!fallbackWell) return
            localBundlesByWellId[id] = {
              well: fallbackWell,
              assets: [],
              contacts: [],
              observations: [],
            }
          })

          const failedWellNames = failedIds
            .map((id) => {
              return resolvedNameById.get(id) ?? String(id)
            })
            .join(', ')

          // Don't interrupt successful batch exports with a hard error.
          // Show a warning only when at least one sheet is still exportable.
          if (loadedBundles.length > 0) {
            notify?.({
              type: 'success',
              message: 'Some wells were skipped',
              description: `Skipped ${failedIds.length} well(s): ${failedWellNames}.`,
            })
          }
        }
      }

      const bundlesForExport = resolvedIds
        .map((id) => localBundlesByWellId[id])
        .filter(Boolean) as WellBundle[]

      if (bundlesForExport.length === 0) {
        notify?.({
          type: 'error',
          message: 'Batch export data load failed',
          description: 'No wells could be prepared for PDF export.',
        })
        return
      }

      const blob = await pdf(
        <OcotilloDocument
          title={baseFilename}
          subject="Batch Well Field Data Report"
        >
          {bundlesForExport.map((bundle) => (
            <WellPDF
              key={bundle.well.id}
              well={bundle.well}
              contacts={bundle.contacts}
              assets={bundle.assets}
              observations={bundle.observations}
              standalone={false}
            />
          ))}
        </OcotilloDocument>
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
        description: `Generated 1 PDF file with ${bundlesForExport.length} field sheets.`,
      })
      setExportOpen(false)
    } catch {
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
    <List
      title={
        <Box>
          <Typography variant="h3" fontWeight={700}>
            Field Sheets
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: '85ch', mt: 0.5, color: 'text.secondary' }}>
            Paste well names, search wells, and generate field sheet PDFs in one run.
          </Typography>
        </Box>
      }
      breadcrumb={<AppBreadcrumb />}
      headerButtons={() => <></>}
      wrapperProps={{
        elevation: 0,
        sx: { backgroundColor: 'background.wrapper', boxShadow: 'none', borderRadius: 1, padding: 0 },
      }}
      headerProps={{
        sx: {
          pt:1,
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          '.MuiCardHeader-action': { alignSelf: { xs: 'flex-end', md: 'flex-start' }, mt: { xs: 1, md: 0.5 }, mr: 0 },
        },
      }}
      contentProps={{ sx: { pt: 1 } }}
    >
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
                Paste Well Names
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <TextField
                multiline
                rows={4}
                fullWidth
                value={pasteValue}
                onChange={(e) => setPasteValue(e.target.value)}
                placeholder={'AB-0001\nAB-0002\nAB-0003'}
                size="small"
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    minHeight: 28,
                    px: 1.25,
                    py: 0.25,
                    fontSize: '0.75rem',
                  }}
                  disabled={!pasteValue.trim() || isResolvingIds}
                  onClick={() => {
                    void processPaste()
                  }}
                  startIcon={<FactCheck />}
                >
                  {isResolvingIds ? 'Resolving...' : 'Resolve Names'}
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
                {...searchAutocompleteProps}
                options={((searchAutocompleteProps.options as IWell[]) ?? []).filter(
                  (well) => !selectedWellIds.has(well.id)
                )}
                loading={Boolean(searchAutocompleteProps.loading)}
                getOptionLabel={(well: any) => well.name ?? ''}
                filterOptions={(options) => options}
                onChange={(_, value: any) => addFromSearch(value)}
                renderOption={(props, option: any) => (
                  <Box component="li" {...props} sx={{ gap: 1.5 }}>
                    <Typography variant="body2">
                      {option.name}
                    </Typography>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Search by thing name"
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
                  {resolvedIds.length} resolved{unresolvedLabel}
                </Typography>
              )}
            </Box>

            {errorChips.length > 0 && (
              <Alert
                severity="error"
                variant="outlined"
                sx={{ mx: 2, mt: 2, fontSize: '0.8rem', borderRadius: 1 }}
              >
                {errorChips.length} name{errorChips.length > 1 ? 's' : ''} not
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
                          ? (wellsById.get(chip.wellId as number)?.name ?? chip.query)
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
                      {resolvedIds.length} ready for export
                    </Typography>
                    <Tooltip title="Clear all">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setChips([])
                        }}
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
                      resolvedIds.length === 0 ||
                      isGenerating
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
        rows={resolvedSelections}
        resolvedCount={resolvedIds.length}
        filename={filename}
        setFilename={setFilename}
      />
    </List>
  )
}
