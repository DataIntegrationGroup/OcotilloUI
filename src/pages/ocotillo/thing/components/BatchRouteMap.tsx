import { useMemo, useRef } from 'react'
import { Box, Typography } from '@mui/material'
import { Map as MapIcon } from '@mui/icons-material'
import { Layer, Source } from 'react-map-gl/maplibre'
import type { FeatureCollection, Geometry } from 'geojson'
import type { IWell } from '@/interfaces/ocotillo'
import MapComponent from '@/components/MapComponent'
import {
  MAP_LAYER_COLORS,
  MAP_SYMBOL_STROKE_COLOR,
} from '@/constants/mapColors'

export const BatchRouteMap = ({ wells }: { wells: IWell[] }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const points = useMemo(
    () => {
      const rawPoints = wells
        .map((well) => {
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
        showNavigation={{ show: true, position: 'top-right' }}
      >
        <Source id="batch-route-source" type="geojson" data={routeData}>
          <Layer
            id="batch-route-points"
            type="circle"
            filter={['==', ['geometry-type'], 'Point']}
            paint={{
              'circle-color': MAP_LAYER_COLORS.locations,
              'circle-stroke-color': MAP_SYMBOL_STROKE_COLOR,
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
              'text-color': MAP_LAYER_COLORS.locations,
              'text-halo-color': '#ffffff',
              'text-halo-width': 1,
            }}
          />
        </Source>
      </MapComponent>
    </Box>
  )
}
