import { DataObject, Download } from '@mui/icons-material'
import {
  Alert,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { fetchOGCFeaturePages } from '@/hooks/useOGCLayer'
import { fetcher } from '@/providers/ocotillo-data-provider'
import { settings } from '@/settings'
import {
  collectionDescriptionOf,
  collectionIdOf,
  collectionTitleOf,
} from '@/utils/collectionsView'
import { buildLayerCsv, sanitizeLayerExportFilename } from '@/utils/layerExport'
import type { OgcCollectionRecord } from '@/utils/ogcLayerUtils'

/** The OGC mount these collections are served from. */
export const INTERNAL_PATH_PREFIX = 'ogcapi-internal'

export const internalCollectionsUrl = `${settings.ocotillo_api_url.replace(
  /\/+$/,
  ''
)}/${INTERNAL_PATH_PREFIX}/collections`

/**
 * One page of an export, matching the page size the map layers read at. The
 * endpoint enforces its own cap, so a larger request buys nothing.
 */
export const CSV_PAGE_SIZE = 1000

/**
 * Runaway guard, not a limit on the export.
 *
 * Paging stops when the server says it is done. A server that ignored `offset`
 * and answered every request with a full page would otherwise loop forever and
 * hang the tab, so the loop gives up after this many pages — a hundred million
 * records, far past anything this catalogue holds.
 */
const MAX_PAGES = 100000

/**
 * Downloads a collection as CSV.
 *
 * Rendered here rather than by the API's own `f=csv`: the server's CSV drops
 * the geometry, and a location without its coordinates is the part worth
 * having. `buildLayerCsv` emits the same property columns plus longitude,
 * latitude and geometry_json, and matches what the map exports produce.
 *
 * The request goes through the authenticated client rather than an anchor: the
 * internal mount is behind auth, and a plain link cannot carry a bearer token.
 */
export const fetchInternalCollectionCsv = async (
  collectionId: string
): Promise<{ csv: string; count: number; partial: boolean }> => {
  const itemsPath = `${INTERNAL_PATH_PREFIX}/collections/${encodeURIComponent(
    collectionId
  )}/items`

  // The paging engine swallows a page failure and returns what it has, which
  // suits a map that can draw partial data. An export must not hand back an
  // empty file when the request was rejected, so the error is kept and
  // rethrown if nothing at all came through.
  let pageError: unknown

  const { features, loadedCount, loadStatus } = await fetchOGCFeaturePages(
    async (offset) => {
      try {
        const response = await fetcher(itemsPath, {
          params: { f: 'json', limit: CSV_PAGE_SIZE, offset },
        })

        return { data: response.data }
      } catch (error) {
        pageError = error
        throw error
      }
    },
    {
      pageSize: CSV_PAGE_SIZE,
      // An export takes the whole collection. The map caps itself because it
      // can only draw so much; a file has no such reason to stop early, so
      // paging runs until the server reports it is done — an empty page, a
      // short page, or numberMatched reached.
      pageCeiling: MAX_PAGES,
      maxFeatures: Number.POSITIVE_INFINITY,
      // The map drops features it cannot plot; an internal collection may be
      // a view with no geometry at all, and its rows still belong in a CSV.
      requireGeometry: false,
    }
  )

  if (loadedCount === 0 && pageError) throw pageError

  return {
    csv: buildLayerCsv(features),
    count: loadedCount,
    // Some pages loaded, some failed. The file is short and the caller says so.
    partial: loadStatus === 'partial-error',
  }
}

export type InternalSchemaTarget = {
  collectionId?: string
  title: string
  pathPrefix?: string
}

/**
 * The internal OGC mount, listed flat.
 *
 * These collections are deliberately not grouped: the groups on the published
 * tab come from `REGISTERED_MAP_COLLECTIONS`, which is the map layer registry,
 * and nothing on the internal mount is registered as a map layer. Sorting by
 * title is the only order that means anything here.
 */
export const InternalCollectionsPanel = ({
  collections,
  isLoading,
  isError,
  error,
  onOpenSchema,
}: {
  collections: OgcCollectionRecord[]
  isLoading: boolean
  isError: boolean
  error: unknown
  onOpenSchema: (target: InternalSchemaTarget) => void
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{
    severity: 'error' | 'warning'
    message: string
  } | null>(null)

  const handleDownloadCsv = async (collectionId: string, title: string) => {
    setDownloadingId(collectionId)
    setNotice(null)
    let objectUrl: string | undefined

    try {
      const { csv, count, partial } =
        await fetchInternalCollectionCsv(collectionId)

      // A collection with no records would save a header and nothing else.
      // Saying so beats handing over an empty file and no explanation.
      if (count === 0) {
        setNotice({
          severity: 'warning',
          message: `${title} has no records to export.`,
        })
        return
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = `${sanitizeLayerExportFilename(collectionId)}.csv`
      anchor.click()

      if (partial) {
        setNotice({
          severity: 'warning',
          message: `Part of ${title} failed to load. The file holds the ${count.toLocaleString()} records that came through.`,
        })
      }
    } catch (downloadError) {
      setNotice({
        severity: 'error',
        message:
          downloadError instanceof Error
            ? `Could not export ${title}. ${downloadError.message}`
            : `Could not export ${title}.`,
      })
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      setDownloadingId(null)
    }
  }

  if (isLoading) {
    return (
      <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading internal collections...
        </Typography>
      </Stack>
    )
  }

  if (isError) {
    return (
      <Alert severity="error">
        Failed to load the internal OGC collections.
        {error instanceof Error ? ` ${error.message}` : null}
      </Alert>
    )
  }

  if (collections.length === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{ p: 3, borderRadius: 3, borderStyle: 'dashed' }}
      >
        <Typography variant="body2" color="text.secondary">
          The internal service has no collections.
        </Typography>
      </Paper>
    )
  }

  const rows = [...collections]
    .map((collection) => ({
      id: collectionIdOf(collection),
      title: collectionTitleOf(collection),
      description: collectionDescriptionOf(collection),
    }))
    .sort((a, b) => a.title.localeCompare(b.title))

  return (
    <Stack spacing={1.5}>
      {notice ? (
        <Alert severity={notice.severity}>{notice.message}</Alert>
      ) : null}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderRadius: 3 }}
      >
        <Table size="small" aria-label="Internal OGC datasets">
          <TableHead>
            <TableRow>
              <TableCell>Dataset</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id ?? row.title}>
                <TableCell sx={{ minWidth: 180 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {row.title}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 420 }}>
                  {row.description ? (
                    <Tooltip title={row.description}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {row.description}
                      </Typography>
                    </Tooltip>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No published description.
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="flex-end"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<DataObject fontSize="small" />}
                      disabled={!row.id}
                      onClick={() =>
                        onOpenSchema({
                          collectionId: row.id,
                          title: row.title,
                          pathPrefix: INTERNAL_PATH_PREFIX,
                        })
                      }
                    >
                      Schema
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Download fontSize="small" />}
                      disabled={!row.id || downloadingId === row.id}
                      onClick={() =>
                        row.id && handleDownloadCsv(row.id, row.title)
                      }
                    >
                      {downloadingId === row.id ? 'Preparing...' : 'CSV'}
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )
}
