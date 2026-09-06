import { ContentCopy, Download, Lock } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { axiosInstance } from '@/providers/ocotillo-data-provider'
import {
  deriveInternalGisConnection,
  findGisConnection,
  GIS_CLIENT_LABELS,
  type GisCatalog,
  type GisDownload,
  type GisLayer,
} from '@/utils/gisArtifacts'

/**
 * Anonymous artifacts are plain attachments, so a plain anchor is the whole
 * implementation — the browser handles the save dialog, progress and errors.
 * The filename comes from the catalogue: CORS on the API exposes no headers, so
 * `Content-Disposition` is unreadable from JS even though it is on the wire.
 */
const DownloadButton = ({
  download,
  label,
  variant = 'outlined',
}: {
  download: GisDownload
  label: string
  variant?: 'outlined' | 'contained'
}) => (
  <Button
    component="a"
    href={download.href}
    download={download.filename}
    size="small"
    variant={variant}
    startIcon={<Download fontSize="small" />}
  >
    {label}
  </Button>
)

/**
 * Per-layer artifacts for one collection, rendered inline on the datasets page.
 */
export const GisLayerDownloads = ({ layer }: { layer: GisLayer }) => {
  if (layer.downloads.length === 0) return null

  return (
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
      {layer.downloads.map((download) => (
        <DownloadButton
          key={download.href}
          download={download}
          label={GIS_CLIENT_LABELS[download.client]}
        />
      ))}
    </Stack>
  )
}

const CopyableUrl = ({ url }: { url: string }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Typography
        component="code"
        variant="caption"
        sx={{
          px: 1,
          py: 0.5,
          borderRadius: 1,
          bgcolor: 'action.hover',
          overflowWrap: 'anywhere',
        }}
      >
        {url}
      </Typography>
      <Tooltip title={copied ? 'Copied' : 'Copy service URL'}>
        <IconButton
          size="small"
          onClick={handleCopy}
          aria-label="Copy service URL"
        >
          <ContentCopy fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </Stack>
  )
}

/**
 * The internal connections file is the one artifact behind auth, and an anchor
 * cannot send a bearer token — hence the blob round-trip through the
 * authenticated axios instance, which also carries the refresh interceptor.
 */
const InternalConnectionsButton = ({ download }: { download: GisDownload }) => {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    setIsDownloading(true)
    setError(null)
    let objectUrl: string | undefined
    try {
      const response = await axiosInstance.get(download.href, {
        responseType: 'blob',
      })
      objectUrl = URL.createObjectURL(response.data)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = download.filename
      anchor.click()
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : 'Download failed.'
      )
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      setIsDownloading(false)
    }
  }

  return (
    <Stack spacing={0.75} alignItems="flex-start">
      <Button
        size="small"
        variant="outlined"
        startIcon={<Lock fontSize="small" />}
        onClick={handleDownload}
        disabled={isDownloading}
      >
        {isDownloading ? 'Preparing…' : 'QGIS connections (internal)'}
      </Button>
      {error ? (
        <Alert severity="error" sx={{ py: 0 }}>
          {error}
        </Alert>
      ) : null}
    </Stack>
  )
}

/**
 * The "connect to everything" surface: one connections file for QGIS, and the
 * service URL for ArcGIS Pro, which has no importable connection file from us.
 */
export const GisConnectionsPanel = ({
  catalog,
  canViewInternal,
}: {
  catalog: GisCatalog
  canViewInternal: boolean
}) => {
  const qgisConnections = findGisConnection(catalog, 'qgis')
  const internalConnections = deriveInternalGisConnection(catalog)

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6">
            Open these datasets in desktop GIS
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Load every published collection at once with the connections file,
            or download a single styled layer from a dataset below.
          </Typography>
        </Box>

        <Stack spacing={1}>
          <Typography variant="subtitle2">QGIS</Typography>
          {qgisConnections ? (
            <DownloadButton
              download={qgisConnections}
              label="Download connections file"
              variant="contained"
            />
          ) : null}
          <Typography variant="body2" color="text.secondary">
            In QGIS: Browser panel → right-click{' '}
            <strong>WFS / OGC API - Features</strong> →{' '}
            <strong>Load Connections</strong>, then pick the downloaded file.
          </Typography>
          {canViewInternal && internalConnections ? (
            <InternalConnectionsButton download={internalConnections} />
          ) : null}
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">ArcGIS Pro</Typography>
          <Typography variant="body2" color="text.secondary">
            ArcGIS Pro has no importable connection file. Add the server once
            via{' '}
            <strong>Insert → Connections → Server → New OGC API Server</strong>{' '}
            and paste this service URL:
          </Typography>
          <CopyableUrl url={catalog.service_url} />
        </Stack>
      </Stack>
    </Paper>
  )
}
