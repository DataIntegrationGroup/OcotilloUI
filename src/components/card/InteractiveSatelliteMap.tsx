import { useEffect, useRef, useState } from 'react'
import { IWell } from '@/interfaces/ocotillo'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { ContentCopy, Directions, Map } from '@mui/icons-material'
import { Layer, MapRef, Source } from 'react-map-gl'
import { MapComponent, MapPopup, CardHeaderTitle } from '@/components'
import { useLayer } from '@/hooks'
import { useGo } from '@refinedev/core'

const MAP_HEIGHT = 450

const HeaderTitle = () => (
  <CardHeaderTitle
    icon={<Map color="primary" />}
    title="Location"
  />
)

export const InteractiveSatelliteMapCard = ({ well }: { well: IWell }) => {
  const mapRef = useRef<MapRef>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [loadNearbyWells, setLoadNearbyWells] = useState(false)
  const waterWellsLayer = useLayer({
    thing_type: 'water well',
    label: 'Water Wells',
    color: '#2b7dc0',
    enabled: loadNearbyWells,
  })
  const [popupContent, setPopupContent] = useState<any>(null)
  const go = useGo()

  const sourceProps = waterWellsLayer?.sourceProps
  const layerProps = waterWellsLayer?.layerProps

  const coords = well?.current_location?.geometry?.coordinates as
    | [number, number, number?]
    | undefined

  const [lon, lat, _elevation] = coords ?? []

  const { easting, northing } = well?.current_location?.properties
    ?.utm_coordinates ?? { easting: null, northing: null }
  const latLonValue =
    lat != null && lon != null
      ? `${lat.toFixed(6)}, ${lon.toFixed(6)}`
      : 'N/A'
  const utmValue =
    easting != null && northing != null
      ? `${easting.toFixed(0)}, ${northing.toFixed(0)}`
      : 'N/A'
  const coordinateNotes =
    well?.current_location?.properties?.notes
      ?.filter((note) => note.note_type === 'Coordinate')
      .map((note) => note.content)
      .filter(Boolean)
      .join('\n') || null

  useEffect(() => {
    const timer = window.setTimeout(() => setLoadNearbyWells(true), 0)
    return () => window.clearTimeout(timer)
  }, [])

  // Automatically zoom to well coordinates when map loads or well changes
  useEffect(() => {
    if (!lon || !lat || !mapRef.current) return

    const map = mapRef.current.getMap()
    map.flyTo({
      center: [lon, lat],
      zoom: 14,
      essential: true, // for accessibility
    })
  }, [well?.id])

  if (!well) {
    return <LoadingCard />
  }

  const highlightFeature =
    lon && lat
      ? {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [lon, lat],
              },
              properties: { name: well.name },
            },
          ],
        }
      : null

  const getFeatureId = (feature?: {
    id?: number | string
    properties?: Record<string, unknown>
  }): string | undefined => {
    const p = feature?.properties
    const id =
      p?.['thing_id'] ??
      p?.['well_id'] ??
      p?.['id'] ??
      p?.['fid'] ??
      p?.['feature_id'] ??
      feature?.id

    return id != null && id !== '' ? String(id) : undefined
  }

  const onMapPointClick = (_: any, points: any[]) => {
    const selectedPoint = points.find(
      (point) =>
        typeof point?.layer?.id === 'string' &&
        point.layer.id.startsWith('location-')
    )
    if (!selectedPoint) return

    const thingType: string = String(
      selectedPoint?.properties?.thing_type || ''
    ).toLowerCase()
    const id = getFeatureId(selectedPoint)
    if (!id) return

    if (thingType === 'water well' || thingType === 'geothermal well') {
      go({
        to: {
          resource: 'ocotillo.thing-well',
          action: 'show',
          id,
        },
      })
    }
  }

  const onMapMouseMove = (_e: any, features: any[], mapRef: any) => {
    features = features.filter((f) => f.layer.id.startsWith('location-'))
    if (features.length > 0) {
      mapRef.current.getCanvas().style.cursor = 'pointer'
      setPopupContent({
        coordinates: features[0].geometry.coordinates,
        children: <MapPopup features={features} />,
        maxWidth: '800px',
      })
    } else {
      mapRef.current.getCanvas().style.cursor = 'grab'
      setPopupContent(null)
    }
  }

  const googleMapsUrl =
    lon && lat
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
      : null

  const locationNote = well.current_location?.properties?.notes
    ?.filter((note) => note.note_type === 'General')
    .shift()

  return (
    <Card
      elevation={2}
      sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}
    >
      <CardHeader
        title={<HeaderTitle />}
        action={
          googleMapsUrl && (
            <Button
              component="a"
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<Directions />}
            >
              Open in Google Maps
            </Button>
          )
        }
      />
      <CardContent>
        <Box
          data-testid="ocotillo-map-container"
          ref={containerRef}
          sx={{
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden',
            border: '2.5px solid',
            borderColor: 'divider',
            height: MAP_HEIGHT,
            width: '100%',
            display: 'flex',
          }}
        >
          <MapComponent
            mapRef={mapRef}
            initialViewState={{
              longitude: lon || -106.0,
              latitude: lat || 35.0,
              zoom: 10,
            }}
            onPointClick={onMapPointClick}
            onMouseMoveCallback={onMapMouseMove}
            setPopupContent={setPopupContent}
            popupContent={popupContent}
            style={{ flex: 1, width: '100%', height: '100%' }}
            containerRef={containerRef}
          >
            {sourceProps && layerProps && (
              <Source id="water-wells" {...sourceProps}>
                <Layer id="location-water-wells" {...layerProps} />
              </Source>
            )}
            {highlightFeature && (
              <Source
                id="highlight-well"
                type="geojson"
                data={highlightFeature}
              >
                <Layer
                  id="highlight-layer"
                  type="circle"
                  paint={{
                    'circle-radius': 6,
                    'circle-color': '#ff4d4d', // bright red highlight
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 2,
                  }}
                />
              </Source>
            )}
          </MapComponent>
        </Box>
        {locationNote && (
          <>
            <Typography variant="h6" component="div" sx={{ pt: 1 }}>
              Directions to the site
            </Typography>
            <Typography
              variant="body2"
              component="div"
              color="textSecondary"
              sx={{ pt: 1 }}
            >
              {locationNote?.content}
            </Typography>
          </>
        )}
        <Stack spacing={0.75} sx={{ pt: 1.5 }}>
          <CoordRow
            label="Latitude / Longitude"
            value={latLonValue}
            copyValue={latLonValue !== 'N/A' ? latLonValue : undefined}
          />
          <CoordRow
            label="Easting / Northing"
            value={utmValue}
            copyValue={utmValue !== 'N/A' ? utmValue : undefined}
          />
          {coordinateNotes && (
            <CoordRow label="Coordinate Notes" value={coordinateNotes} />
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

const CoordRow = ({
  label,
  value,
  copyValue,
}: {
  label: string
  value: string
  copyValue?: string
}) => {
  const handleCopy = async () => {
    if (!copyValue) return
    try {
      await navigator.clipboard.writeText(copyValue)
    } catch (error) {
      console.error(`Failed to copy ${label}`, error)
    }
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
      <Typography variant="body2" component="span">
        {label}:
      </Typography>
      <Typography variant="body2" color="text.secondary" component="span">
        {value}
      </Typography>
      {copyValue && (
        <Tooltip title={`Copy ${label.toLowerCase()}`}>
          <IconButton size="small" onClick={handleCopy} sx={{ p: 0.25 }}>
            <ContentCopy fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  )
}

const LoadingCard = () => {
  return (
    <Card
      elevation={2}
      sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}
    >
      <CardHeader title={<HeaderTitle />} />
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height={MAP_HEIGHT}
          sx={{ borderRadius: '0.5rem' }}
        />
        <Skeleton
          variant="rectangular"
          width={200}
          height={28}
          sx={{
            borderRadius: '0.5rem',
            alignSelf: 'flex-start',
          }}
        />
        <Skeleton
          variant="rectangular"
          width="100%"
          height={64}
          sx={{ borderRadius: '0.5rem' }}
        />
      </CardContent>
    </Card>
  )
}
