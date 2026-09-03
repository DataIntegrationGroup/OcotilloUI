import { Download, Place } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { Link } from '@refinedev/core'
import { useMemo, useRef, useState } from 'react'
import { Layer, Popup, Source } from 'react-map-gl/maplibre'
import { MapComponent } from '@/components'
import {
  MAP_LAYER_COLORS,
  MAP_SYMBOL_STROKE_COLOR,
} from '@/constants/mapColors'
import { usePublishedThings } from '@/hooks'
import type { Destination } from '@/utils/accessDestinations'
import {
  type PublishedBounds,
  type PublishedCoordinate,
  publishedThingsBounds,
  publishedThingsToCsv,
  publishedThingsToFeatureCollection,
  publishedThingsToRows,
} from './publishedItems'

const COLUMNS: GridColDef[] = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
  { field: 'data_types', headerName: 'Data types', flex: 1, minWidth: 160 },
  { field: 'thing_type', headerName: 'Type', flex: 1, minWidth: 140 },
]

// A published thing is identified only by its id, so link through the generic
// by-id resolver rather than guessing a type-specific show route.
const thingPath = (thingId: number) => `/ocotillo/thing-id-link/show/${thingId}`

// Bureau footprint — the fallback view when nothing has a coordinate yet.
const NEW_MEXICO_CENTER = { longitude: -106.0, latitude: 34.5, zoom: 5.5 }

// Map and grid sit side by side, so they share one height.
const MEDIA_HEIGHT = 420

const dateStamp = (): string => new Date().toISOString().slice(0, 10)

const downloadCsv = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const DestinationItemsPanel = ({
  destination,
}: {
  destination: Destination
}) => {
  const items = usePublishedThings(destination.slug)
  const things = items.data ?? []

  const featureCollection = useMemo(
    () => publishedThingsToFeatureCollection(things),
    [things]
  )
  const bounds = useMemo(() => publishedThingsBounds(things), [things])
  const rows = useMemo(() => publishedThingsToRows(things), [things])

  const onExport = () =>
    downloadCsv(
      publishedThingsToCsv(things),
      `${destination.slug}-published-${dateStamp()}.csv`
    )

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
        >
          <Stack spacing={0.25}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Published items — {destination.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              What {destination.slug} is currently allowed to read.
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              size="small"
              variant="outlined"
              label={items.isLoading ? 'Loading' : `${things.length} items`}
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={<Download />}
              onClick={onExport}
              disabled={items.isLoading || things.length === 0}
            >
              Export CSV
            </Button>
          </Stack>
        </Stack>

        {items.isLoading ? (
          <Stack alignItems="center" spacing={1.5} sx={{ py: 6 }}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary">
              Loading published items...
            </Typography>
          </Stack>
        ) : items.isError ? (
          <Alert severity="error">
            Failed to load published items.
            {items.error instanceof Error ? ` ${items.error.message}` : null}
          </Alert>
        ) : things.length === 0 ? (
          <Alert severity="info" icon={<Place fontSize="inherit" />}>
            Nothing is published to this destination — a retired destination and
            one nobody has consented to both read empty.
          </Alert>
        ) : (
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems="stretch"
          >
            <Box sx={{ flex: 1, minWidth: 0, height: MEDIA_HEIGHT }}>
              <ItemsMap featureCollection={featureCollection} bounds={bounds} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, height: MEDIA_HEIGHT }}>
              <DataGrid
                density="compact"
                rows={rows}
                columns={COLUMNS}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                disableRowSelectionOnClick
                sx={{ height: '100%' }}
              />
            </Box>
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}

type ItemPopup = {
  coordinates: PublishedCoordinate
  thingId: number
  name: string
  thingType: string
}

const ItemsMap = ({
  featureCollection,
  bounds,
}: {
  featureCollection: ReturnType<typeof publishedThingsToFeatureCollection>
  bounds: PublishedBounds | null
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [popup, setPopup] = useState<ItemPopup | null>(null)

  // Frame the map from the data before its first paint, so it opens at the
  // right extent instead of mounting elsewhere and animating out to it. The
  // map branch renders only once things have loaded, so bounds are known here.
  const initialViewState = bounds
    ? { bounds, fitBoundsOptions: { padding: 48, maxZoom: 12 } }
    : NEW_MEXICO_CENTER

  const onPointClick = (
    _event: unknown,
    clicked: {
      layer?: { id?: string }
      properties?: Record<string, unknown>
      geometry?: { coordinates?: number[] }
    }[]
  ) => {
    const point = clicked.find((p) => p.layer?.id === 'published-items-layer')
    const coordinates = point?.geometry?.coordinates
    if (!point?.properties || !coordinates || coordinates.length < 2) {
      setPopup(null)
      return
    }

    setPopup({
      coordinates: [coordinates[0], coordinates[1]],
      thingId: Number(point.properties.thing_id),
      name: String(point.properties.name ?? 'Item'),
      thingType: String(point.properties.thing_type ?? ''),
    })
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        height: '100%',
        width: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <MapComponent
        containerRef={containerRef}
        initialViewState={initialViewState}
        onPointClick={onPointClick}
        style={{ width: '100%', height: '100%' }}
      >
        {featureCollection ? (
          <Source id="published-items" type="geojson" data={featureCollection}>
            <Layer
              id="published-items-layer"
              type="circle"
              paint={{
                'circle-radius': 6,
                'circle-color': MAP_LAYER_COLORS.waterWells,
                'circle-stroke-color': MAP_SYMBOL_STROKE_COLOR,
                'circle-stroke-width': 2,
              }}
            />
          </Source>
        ) : null}
        {popup ? (
          <Popup
            longitude={popup.coordinates[0]}
            latitude={popup.coordinates[1]}
            anchor="bottom"
            offset={12}
            closeOnClick={false}
            onClose={() => setPopup(null)}
            maxWidth="260px"
          >
            <Box sx={{ p: 0.5, minWidth: 140 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {popup.name}
              </Typography>
              {popup.thingType ? (
                <Typography variant="caption" color="text.secondary">
                  {popup.thingType}
                </Typography>
              ) : null}
              <Box sx={{ mt: 0.5 }}>
                <Link
                  to={thingPath(popup.thingId)}
                  style={{ fontSize: 12, color: 'inherit' }}
                >
                  View details
                </Link>
              </Box>
            </Box>
          </Popup>
        ) : null}
      </MapComponent>
    </Box>
  )
}
