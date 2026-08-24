import { useEffect, useRef, useState } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { Map } from '@mui/icons-material'
import { Layer, MapRef, Source } from 'react-map-gl/maplibre'
import { Link } from '@refinedev/core'
import type { IThing } from '@/interfaces/ocotillo'
import { MapComponent } from '@/components'
import {
  MAP_LAYER_COLORS,
  MAP_SYMBOL_STROKE_COLOR,
} from '@/constants/mapColors'

type AssociatedSitesMapCardProps = {
  things?: IThing[] | null
}

const getShowPath = (thingType: string, id: number) => {
  const type = (thingType || '').toLowerCase()
  if (type === 'water well' || type === 'geothermal well') {
    return `/ocotillo/well/show/${id}`
  }
  if (type === 'spring') {
    return `/ocotillo/spring/show/${id}`
  }
  return `/ocotillo/well/show/${id}`
}

export const AssociatedSitesMapCard = ({ things }: AssociatedSitesMapCardProps) => {
  const mapRef = useRef<MapRef>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [popupContent, setPopupContent] = useState<{
    coordinates: [number, number]
    name: string
    id: number
    thingType: string
  } | null>(null)

  const thingsWithCoords = (things ?? []).filter((t) => {
    const coords = t.current_location?.geometry?.coordinates
    return coords && coords.length >= 2
  })

  const features = thingsWithCoords.map((t) => {
    const coords = t.current_location!.geometry!.coordinates as [number, number, number?]
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [coords[0], coords[1]],
      },
      properties: {
        name: t.name,
        thing_id: t.id,
        thing_type: t.thing_type,
      },
    }
  })

  const featureCollection =
    features.length > 0
      ? { type: 'FeatureCollection' as const, features }
      : null

  const centerLon =
    features.length > 0
      ? features.reduce((sum, f) => sum + (f.geometry.coordinates[0] ?? 0), 0) /
        features.length
      : -106.0
  const centerLat =
    features.length > 0
      ? features.reduce((sum, f) => sum + (f.geometry.coordinates[1] ?? 0), 0) /
        features.length
      : 35.0

  useEffect(() => {
    if (!mapRef.current || !featureCollection) return

    const map = mapRef.current.getMap()

    if (features.length === 1) {
      const [lon, lat] = features[0].geometry.coordinates
      map.flyTo({
        center: [lon, lat],
        zoom: 14,
        essential: true,
      })
    } else if (features.length > 1) {
      const lons = features.map((f) => f.geometry.coordinates[0] ?? 0)
      const lats = features.map((f) => f.geometry.coordinates[1] ?? 0)
      const bounds: [[number, number], [number, number]] = [
        [Math.min(...lons), Math.min(...lats)],
        [Math.max(...lons), Math.max(...lats)],
      ]
      map.fitBounds(bounds, {
        padding: 40,
        maxZoom: 14,
        duration: 0,
      })
    }
  }, [thingsWithCoords.map((t) => t.id).join(','), features.length])

  const onMapPointClick = (
    _e: unknown,
    points: { layer?: { id?: string }; properties?: Record<string, unknown>; geometry?: { coordinates?: number[] } }[]
  ) => {
    const point = points.find((p) => p.layer?.id === 'contact-sites-layer')
    if (!point?.properties) {
      setPopupContent(null)
      return
    }

    const coords = point.geometry?.coordinates as [number, number] | undefined
    if (!coords) return

    setPopupContent({
      coordinates: coords,
      name: String(point.properties.name ?? 'Site'),
      id: Number(point.properties.thing_id),
      thingType: String(point.properties.thing_type ?? ''),
    })
  }

  const onMapMouseMove = (
    _e: unknown,
    features: { layer?: { id?: string } }[],
    mapRefObj: React.RefObject<MapRef>
  ) => {
    const contactFeatures = features.filter((f) => f.layer?.id === 'contact-sites-layer')
    if (contactFeatures.length > 0 && mapRefObj?.current) {
      mapRefObj.current.getCanvas().style.cursor = 'pointer'
    } else if (mapRefObj?.current) {
      mapRefObj.current.getCanvas().style.cursor = 'grab'
    }
  }

  if (thingsWithCoords.length === 0) {
    return null
  }

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Map color="primary" />
        <Typography variant="body1" fontWeight="bold">
          Associated Sites Map
        </Typography>
      </Box>
      <Box sx={{ px: 2, py: 1, pb: 2 }}>
        <Box
          ref={containerRef}
          sx={{
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden',
            border: '2.5px solid',
            borderColor: 'divider',
            height: 350,
            width: '100%',
          }}
        >
          <MapComponent
            mapRef={mapRef}
            initialViewState={{
              longitude: centerLon,
              latitude: centerLat,
              zoom: 10,
            }}
            onPointClick={onMapPointClick}
            onMouseMoveCallback={onMapMouseMove}
            setPopupContent={setPopupContent}
            popupContent={
              popupContent
                ? {
                    coordinates: popupContent.coordinates,
                    children: (
                      <Box sx={{ p: 1, minWidth: 120 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {popupContent.name}
                        </Typography>
                        <Link
                          to={getShowPath(popupContent.thingType, popupContent.id)}
                          style={{ fontSize: 12, color: 'inherit' }}
                        >
                          View details
                        </Link>
                      </Box>
                    ),
                    maxWidth: '300px',
                  }
                : undefined
            }
            style={{ width: '100%', height: '100%' }}
            containerRef={containerRef}
          >
            {featureCollection && (
              <Source id="contact-sites" type="geojson" data={featureCollection}>
                <Layer
                  id="contact-sites-layer"
                  type="circle"
                  paint={{
                    'circle-radius': 6,
                    'circle-color': MAP_LAYER_COLORS.waterWells,
                    'circle-stroke-color': MAP_SYMBOL_STROKE_COLOR,
                    'circle-stroke-width': 2,
                  }}
                />
              </Source>
            )}
          </MapComponent>
        </Box>
      </Box>
    </Paper>
  )
}
