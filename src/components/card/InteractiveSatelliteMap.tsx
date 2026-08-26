import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import wellknown from 'wellknown'
import { IWell } from '@/interfaces/ocotillo'
import type { IGroup } from '@/interfaces/ocotillo/IGroup'
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
import { Layer, MapRef, Source } from 'react-map-gl/maplibre'
import {
  BasemapControl,
  MapComponent,
  MapPopup,
  CardHeaderTitle,
} from '@/components'
import { useLayer } from '@/hooks'
import { useGo } from '@refinedev/core'
import { captureEvent } from '@/analytics/posthog'
import { ColorModeContext } from '@/contexts'
import { THEMED_BASEMAP_IDS } from '@/basemaps'
import {
  MAP_HIGHLIGHT_COLOR,
  MAP_HIGHLIGHT_STROKE_COLOR,
  MAP_LAYER_COLORS,
  MAP_SYMBOL_STROKE_COLOR,
} from '@/constants/mapColors'

const MAP_HEIGHT = 450

/**
 * Basemap state for a map card. Seeded from the active color mode so the map
 * matches the app theme on first paint; MapComponent keeps the two in sync
 * until the user picks a basemap of their own.
 */
const useCardBasemap = (surface: 'well' | 'project') => {
  const { mode } = useContext(ColorModeContext)
  const [basemapId, setBasemapId] = useState<string>(
    () => THEMED_BASEMAP_IDS[mode === 'dark' ? 'dark' : 'light']
  )

  const onBasemapChange = (nextBasemap: string) => {
    setBasemapId(nextBasemap)
  }

  const onUserBasemapChange = (nextBasemap: string) => {
    setBasemapId(nextBasemap)
    captureEvent('map_basemap_changed', { basemap: nextBasemap, surface })
  }

  return { basemapId, onBasemapChange, onUserBasemapChange }
}

const MapCardHeader = ({ title }: { title: string }) => (
  <CardHeaderTitle icon={<Map color="primary" />} title={title} />
)

type WellMapProps = {
  variant: 'well'
  well: IWell
}

type ProjectMapProps = {
  variant: 'project'
  wells: IWell[]
  projectArea?: IGroup['project_area']
  mapTitle?: string
  isLoading?: boolean
}

export type InteractiveSatelliteMapCardProps = WellMapProps | ProjectMapProps

export const InteractiveSatelliteMapCard = (
  props: InteractiveSatelliteMapCardProps
) => {
  if (props.variant === 'project') {
    return (
      <ProjectMapView
        wells={props.wells}
        projectArea={props.projectArea}
        mapTitle={props.mapTitle}
        isLoading={props.isLoading}
      />
    )
  }
  return <WellMapView well={props.well} />
}

const parseProjectArea = (projectArea: IGroup['project_area']) => {
  if (!projectArea) return null
  try {
    if (typeof projectArea === 'string') {
      return wellknown.parse(projectArea)
    }
    return projectArea
  } catch (error) {
    console.error('Invalid project area geometry:', projectArea, error)
    return null
  }
}

const wellsToFeatureCollection = (wells: IWell[]) => {
  const features = wells
    .filter((well) => {
      const coords = well.current_location?.geometry?.coordinates
      return coords && coords.length >= 2
    })
    .map((well) => {
      const coords = well.current_location!.geometry!
        .coordinates as [number, number, number?]
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [coords[0], coords[1]],
        },
        properties: {
          name: well.name,
          thing_id: well.id,
          thing_type: 'water well',
        },
      }
    })

  return features.length > 0
    ? { type: 'FeatureCollection' as const, features }
    : null
}

const ProjectMapView = ({
  wells,
  projectArea,
  mapTitle = 'Project Map',
  isLoading = false,
}: Omit<ProjectMapProps, 'variant'>) => {
  const mapRef = useRef<MapRef>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [popupContent, setPopupContent] = useState<any>(null)
  const go = useGo()
  const { basemapId, onBasemapChange, onUserBasemapChange } =
    useCardBasemap('project')

  const boundary = useMemo(() => parseProjectArea(projectArea), [projectArea])
  const wellsFeatureCollection = useMemo(
    () => wellsToFeatureCollection(wells),
    [wells]
  )
  const mapPoints = wellsFeatureCollection?.features ?? []

  const centerLon =
    mapPoints.length > 0
      ? mapPoints.reduce(
          (sum, feature) => sum + (feature.geometry.coordinates[0] ?? 0),
          0
        ) / mapPoints.length
      : -106.4
  const centerLat =
    mapPoints.length > 0
      ? mapPoints.reduce(
          (sum, feature) => sum + (feature.geometry.coordinates[1] ?? 0),
          0
        ) / mapPoints.length
      : 34.5

  useEffect(() => {
    if (!mapRef.current || mapPoints.length === 0) return

    const map = mapRef.current.getMap()

    if (mapPoints.length === 1) {
      const [lon, lat] = mapPoints[0].geometry.coordinates
      map.flyTo({ center: [lon, lat], zoom: 12, essential: true })
      return
    }

    const lons = mapPoints.map((feature) => feature.geometry.coordinates[0] ?? 0)
    const lats = mapPoints.map((feature) => feature.geometry.coordinates[1] ?? 0)
    map.fitBounds(
      [
        [Math.min(...lons), Math.min(...lats)],
        [Math.max(...lons), Math.max(...lats)],
      ],
      { padding: 48, maxZoom: 12, duration: 0 }
    )
  }, [mapPoints])

  const getFeatureId = (feature?: {
    id?: number | string
    properties?: Record<string, unknown>
  }): string | undefined => {
    const p = feature?.properties
    const featureId =
      p?.['thing_id'] ??
      p?.['well_id'] ??
      p?.['id'] ??
      p?.['fid'] ??
      p?.['feature_id'] ??
      feature?.id

    return featureId != null && featureId !== '' ? String(featureId) : undefined
  }

  const onMapPointClick = (_: unknown, points: any[]) => {
    const selectedPoint = points.find(
      (point) =>
        typeof point?.layer?.id === 'string' &&
        point.layer.id.startsWith('location-')
    )
    if (!selectedPoint) return

    const id = getFeatureId(selectedPoint)
    if (!id) return

    go({
      to: {
        resource: 'ocotillo.thing-well',
        action: 'show',
        id,
      },
    })
  }

  const onMapMouseMove = (_e: unknown, features: any[], mapRefObj: any) => {
    const locationFeatures = features.filter((feature) =>
      feature.layer?.id?.startsWith('location-')
    )
    if (locationFeatures.length > 0 && mapRefObj?.current) {
      mapRefObj.current.getCanvas().style.cursor = 'pointer'
      setPopupContent({
        coordinates: locationFeatures[0].geometry.coordinates,
        children: <MapPopup features={locationFeatures} />,
        maxWidth: '800px',
      })
    } else if (mapRefObj?.current) {
      mapRefObj.current.getCanvas().style.cursor = 'grab'
      setPopupContent(null)
    }
  }

  if (isLoading) {
    return <LoadingCard title={mapTitle} showCoordSkeleton={false} />
  }

  return (
    <Card
      elevation={2}
      sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}
    >
      <CardHeader title={<MapCardHeader title={mapTitle} />} />
      <CardContent>
        {!boundary && mapPoints.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No project boundary or well locations to display.
          </Typography>
        ) : (
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
                longitude: centerLon,
                latitude: centerLat,
                zoom: mapPoints.length > 0 ? 8 : 6,
              }}
              onPointClick={onMapPointClick}
              onMouseMoveCallback={onMapMouseMove}
              setPopupContent={setPopupContent}
              popupContent={popupContent}
              basemapId={basemapId}
              onBasemapChange={onBasemapChange}
              style={{ flex: 1, width: '100%', height: '100%' }}
              containerRef={containerRef}
            >
              {boundary ? (
                <Source id="project-area" type="geojson" data={boundary}>
                  <Layer
                    type="fill"
                    id="project-area-fill"
                    paint={{
                      'fill-color': '#007bff',
                      'fill-opacity': 0.2,
                    }}
                  />
                  <Layer
                    type="line"
                    id="project-area-outline"
                    paint={{
                      'line-color': '#007bff',
                      'line-width': 2,
                    }}
                  />
                </Source>
              ) : null}
              {wellsFeatureCollection ? (
                <Source
                  id="project-wells"
                  type="geojson"
                  data={wellsFeatureCollection}
                >
                  <Layer
                    id="location-project-wells"
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
            </MapComponent>
            <BasemapControl
              value={basemapId}
              onChange={onUserBasemapChange}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

const WellMapView = ({ well }: { well: IWell }) => {
  const mapRef = useRef<MapRef>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [loadNearbyWells, setLoadNearbyWells] = useState(false)
  const waterWellsLayer = useLayer({
    thing_type: 'water well',
    label: 'Water Wells',
    color: MAP_LAYER_COLORS.waterWells,
    enabled: loadNearbyWells,
  })
  const [popupContent, setPopupContent] = useState<any>(null)
  const go = useGo()
  const { basemapId, onBasemapChange, onUserBasemapChange } =
    useCardBasemap('well')

  const sourceProps = waterWellsLayer?.sourceProps
  const layerProps = waterWellsLayer?.layerProps

  const coords = well?.current_location?.geometry?.coordinates as
    | [number, number, number?]
    | undefined

  const [lon, lat] = coords ?? []

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

  useEffect(() => {
    if (!lon || !lat || !mapRef.current) return

    const map = mapRef.current.getMap()
    map.flyTo({
      center: [lon, lat],
      zoom: 14,
      essential: true,
    })
  }, [well?.id, lon, lat])

  if (!well) {
    return <LoadingCard title="Location" />
  }

  const highlightFeature =
    lon && lat
      ? {
          type: 'FeatureCollection' as const,
          features: [
            {
              type: 'Feature' as const,
              geometry: {
                type: 'Point' as const,
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
    const featureId =
      p?.['thing_id'] ??
      p?.['well_id'] ??
      p?.['id'] ??
      p?.['fid'] ??
      p?.['feature_id'] ??
      feature?.id

    return featureId != null && featureId !== '' ? String(featureId) : undefined
  }

  const onMapPointClick = (_: unknown, points: any[]) => {
    const selectedPoint = points.find(
      (point) =>
        typeof point?.layer?.id === 'string' &&
        point.layer.id.startsWith('location-')
    )
    if (!selectedPoint) return

    const thingType: string = String(
      selectedPoint?.properties?.thing_type || ''
    ).toLowerCase()
    const featureId = getFeatureId(selectedPoint)
    if (!featureId) return

    if (thingType === 'water well' || thingType === 'geothermal well') {
      go({
        to: {
          resource: 'ocotillo.thing-well',
          action: 'show',
          id: featureId,
        },
      })
    }
  }

  const onMapMouseMove = (_e: unknown, features: any[], mapRefObj: any) => {
    const locationFeatures = features.filter((feature) =>
      feature.layer?.id?.startsWith('location-')
    )
    if (locationFeatures.length > 0 && mapRefObj?.current) {
      mapRefObj.current.getCanvas().style.cursor = 'pointer'
      setPopupContent({
        coordinates: locationFeatures[0].geometry.coordinates,
        children: <MapPopup features={locationFeatures} />,
        maxWidth: '800px',
      })
    } else if (mapRefObj?.current) {
      mapRefObj.current.getCanvas().style.cursor = 'grab'
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
        title={<MapCardHeader title="Location" />}
        action={
          googleMapsUrl ? (
            <Button
              component="a"
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<Directions />}
            >
              Open in Google Maps
            </Button>
          ) : null
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
            basemapId={basemapId}
            onBasemapChange={onBasemapChange}
            style={{ flex: 1, width: '100%', height: '100%' }}
            containerRef={containerRef}
          >
            {sourceProps && layerProps ? (
              <Source id="water-wells" {...sourceProps}>
                <Layer id="location-water-wells" {...layerProps} />
              </Source>
            ) : null}
            {highlightFeature ? (
              <Source id="highlight-well" type="geojson" data={highlightFeature}>
                <Layer
                  id="highlight-layer"
                  type="circle"
                  paint={{
                    'circle-radius': 6,
                    'circle-color': MAP_HIGHLIGHT_COLOR,
                    'circle-stroke-color': MAP_HIGHLIGHT_STROKE_COLOR,
                    'circle-stroke-width': 2,
                  }}
                />
              </Source>
            ) : null}
          </MapComponent>
          <BasemapControl value={basemapId} onChange={onUserBasemapChange} />
        </Box>
        {locationNote ? (
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
              {locationNote.content}
            </Typography>
          </>
        ) : null}
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
          {coordinateNotes ? (
            <CoordRow label="Coordinate Notes" value={coordinateNotes} />
          ) : null}
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
      {copyValue ? (
        <Tooltip title={`Copy ${label.toLowerCase()}`}>
          <IconButton size="small" onClick={handleCopy} sx={{ p: 0.25 }}>
            <ContentCopy fontSize="inherit" />
          </IconButton>
        </Tooltip>
      ) : null}
    </Box>
  )
}

const LoadingCard = ({
  title,
  showCoordSkeleton = true,
}: {
  title: string
  showCoordSkeleton?: boolean
}) => (
  <Card elevation={2} sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}>
    <CardHeader title={<MapCardHeader title={title} />} />
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
      {showCoordSkeleton ? (
        <>
          <Skeleton
            variant="rectangular"
            width={200}
            height={28}
            sx={{ borderRadius: '0.5rem', alignSelf: 'flex-start' }}
          />
          <Skeleton
            variant="rectangular"
            width="100%"
            height={64}
            sx={{ borderRadius: '0.5rem' }}
          />
        </>
      ) : null}
    </CardContent>
  </Card>
)
