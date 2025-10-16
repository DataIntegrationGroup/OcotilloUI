import { IWell } from '@/interfaces/ocotillo/IThing'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { Map } from '@mui/icons-material'
import { Layer, MapRef, Source } from 'react-map-gl'
import { MapComponent, MapPopup } from '@/components'
import { useThingLayers } from '@/hooks'
import { parseWktPoint } from '@/utils'
import { useEffect, useRef, useState } from 'react'
import { useGo } from '@refinedev/core'

export const InteractiveSatelliteMapCard = ({ well }: { well: IWell }) => {
  const mapRef = useRef<MapRef>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const THING_LAYERS = useThingLayers()
  const [popupContent, setPopupContent] = useState<any>(null)
  const go = useGo()

  const waterWellsLayer = THING_LAYERS['water-wells']
  const { sourceProps, layerProps } = waterWellsLayer

  const coords = well ? parseWktPoint(well?.current_location?.point) : null

  // Automatically zoom to well coordinates when map loads or well changes
  useEffect(() => {
    if (!coords || !mapRef.current) return

    const map = mapRef.current.getMap()
    map.flyTo({
      center: [coords.lon, coords.lat],
      zoom: 14,
      essential: true, // for accessibility
    })
  }, [well?.id])

  if (!well) {
    return <LoadingCard />
  }

  const highlightFeature = coords
    ? {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [coords.lon, coords.lat],
            },
            properties: { name: well.name },
          },
        ],
      }
    : null

  const onMapPointClick = (_: any, points: any[]) => {
    const selectedPoint = points[0]
    if (selectedPoint.properties.thing_type === 'water well') {
      go({
        to: {
          resource: 'ocotillo.thing-well',
          action: 'show',
          id: selectedPoint.properties.id,
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

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Map color="primary" />
            <Typography variant="body1">Interactive Satellite Map</Typography>
          </Stack>
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
              longitude: coords?.lon || -106.0,
              latitude: coords?.lat || 35.0,
              zoom: 10,
            }}
            onPointClick={onMapPointClick}
            onMouseMoveCallback={onMapMouseMove}
            setPopupContent={setPopupContent}
            popupContent={popupContent}
            style={{ flex: 1, width: '100%', height: '100%' }}
            containerRef={containerRef}
          >
            <Source id="water-wells" {...sourceProps}>
              <Layer id="location-water-wells" {...layerProps} />
            </Source>
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
            <Typography variant="body1">Interactive Satellite Map</Typography>
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
