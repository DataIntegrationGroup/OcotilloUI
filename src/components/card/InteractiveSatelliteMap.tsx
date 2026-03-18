import { useEffect, useRef, useState } from 'react'
import { IWell } from '@/interfaces/ocotillo'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { Directions, Map } from '@mui/icons-material'
import { Layer, MapRef, Source } from 'react-map-gl'
import { MapComponent, MapPopup } from '@/components'
import { useLayer } from '@/hooks'
import { useGo } from '@refinedev/core'

export const InteractiveSatelliteMapCard = ({ well }: { well: IWell }) => {
  const mapRef = useRef<MapRef>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const waterWellsLayer = useLayer({
    thing_type: 'water well',
    label: 'Water Wells',
    color: '#2b7dc0',
  })
  const [popupContent, setPopupContent] = useState<any>(null)
  const go = useGo()

  const sourceProps = waterWellsLayer?.sourceProps
  const layerProps = waterWellsLayer?.layerProps

  const coords = well?.current_location?.geometry?.coordinates as
    | [number, number, number?]
    | undefined

  const [lon, lat, _elevation] = coords ?? []

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

  const getFeatureId = (
    feature?: { id?: number | string; properties?: Record<string, unknown> }
  ): string | undefined => {
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
      (point) => typeof point?.layer?.id === 'string' && point.layer.id.startsWith('location-')
    )
    if (!selectedPoint) return

    const thingType: string = String(selectedPoint?.properties?.thing_type || '').toLowerCase()
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

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Map color="primary" />
            <Typography variant="body1" fontWeight="bold">Interactive Satellite Map</Typography>
          </Stack>
        }
        action={
          googleMapsUrl && (
            <Tooltip title="Open in Google Maps">
              <IconButton
                component="a"
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Directions />
              </IconButton>
            </Tooltip>
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
            height: 650,
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
      </CardContent>
    </Card>
  )
}

const LoadingCard = () => {
  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Map color="primary" />
            <Typography variant="body1" fontWeight="bold">Interactive Satellite Map</Typography>
          </Stack>
        }
      />
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height={650}
          sx={{ borderRadius: '0.5rem' }}
        />
      </CardContent>
    </Card>
  )
}
