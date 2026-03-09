import React, { useRef, useState } from 'react'
import { Layer, Source } from 'react-map-gl'
import { Breadcrumb, List } from '@refinedev/mui'
import { useGo } from '@refinedev/core'
import {
  Box,
  Checkbox,
  Collapse,
  IconButton,
  LinearProgress,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material'
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import MapComponent from '@/components/MapComponent'
import { MapPopup } from '@/components'
import { useThingLayers } from '@/hooks'

export const MapView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [visibleLayers, setVisibleLayers] = React.useState<string[]>([
    'ogc-latest-depth-to-water',
  ])
  const THING_LAYERS = useThingLayers(visibleLayers)
  const [layersCollapsed, setLayersCollapsed] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      groundwater: true,
      surfaceWater: true,
      climate: true,
      geoscience: true,
      reference: true,
    }
  )
  const [popupContent, setPopupContent] = useState<any>(null)

  const onLayerChangeWrapper = (layerKey: string) => {
    const fn = () => {
      setVisibleLayers((prev) =>
        prev.includes(layerKey)
          ? prev.filter((layer) => layer !== layerKey)
          : [...prev, layerKey]
      )
    }
    return fn
  }

  const onGroupToggle = (groupKey: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }))
  }

  const getLayerGroupKey = (layerKey: string): keyof typeof expandedGroups => {
    if (
      layerKey.includes('water-well') ||
      layerKey.includes('depth-to-water') ||
      layerKey.includes('tds') ||
      layerKey.includes('trend') ||
      layerKey.includes('water-elevation')
    ) {
      return 'groundwater'
    }
    if (
      layerKey.includes('springs') ||
      layerKey.includes('surface-water') ||
      layerKey.includes('ephemeral-streams') ||
      layerKey.includes('perennial-streams') ||
      layerKey.includes('lakes-ponds-reservoirs') ||
      layerKey.includes('outfalls-return-flow')
    ) {
      return 'surfaceWater'
    }
    if (layerKey.includes('meteorological-stations')) {
      return 'climate'
    }
    if (
      layerKey.includes('rock-sample-locations') ||
      layerKey.includes('soil-gas-sample-locations')
    ) {
      return 'geoscience'
    }
    return 'reference'
  }

  const groupLabels: Record<keyof typeof expandedGroups, string> = {
    groundwater: 'Groundwater',
    surfaceWater: 'Surface Water',
    climate: 'Climate',
    geoscience: 'Geoscience',
    reference: 'Reference',
  }

  const groupedLayers = (
    Object.entries(THING_LAYERS) as Array<[string, any]>
  ).reduce(
    (acc, entry) => {
      const groupKey = getLayerGroupKey(entry[0])
      acc[groupKey].push(entry)
      return acc
    },
    {
      groundwater: [] as Array<[string, any]>,
      surfaceWater: [] as Array<[string, any]>,
      climate: [] as Array<[string, any]>,
      geoscience: [] as Array<[string, any]>,
      reference: [] as Array<[string, any]>,
    }
  )

  const go = useGo()
  const show = (resource: string, id: string) => {
    go({
      to: {
        resource: resource,
        action: 'show',
        id: id,
      },
    })
  }

  const getFeatureId = (feature: any): string | undefined => {
    const props = feature?.properties || {}
    const candidates = [
      props.thing_id,
      props.well_id,
      props.id,
      props.fid,
      props.feature_id,
      feature?.id,
    ]
    const value = candidates.find(
      (candidate) =>
        candidate !== undefined && candidate !== null && candidate !== ''
    )
    return value === undefined ? undefined : String(value)
  }

  const onMapPointClick = (_: any, points: any[]) => {
    const selectedPoint = points.find(
      (point) =>
        typeof point?.layer?.id === 'string' &&
        point.layer.id.startsWith('location-') &&
        point?.geometry?.type === 'Point'
    )
    if (!selectedPoint) return

    const layerId: string = selectedPoint.layer.id
    const thingType: string = String(
      selectedPoint?.properties?.thing_type || ''
    ).toLowerCase()
    const id = getFeatureId(selectedPoint)
    if (!id) return

    const isWaterWellLayer =
      layerId.includes('ogc-water-wells') ||
      layerId.includes('ogc-water-well-summary') ||
      layerId.includes('ogc-latest-depth-to-water') ||
      layerId.includes('ogc-average-tds') ||
      layerId.includes('ogc-latest-tds') ||
      layerId.includes('ogc-depth-to-water-trend')

    if (
      isWaterWellLayer ||
      thingType === 'water well' ||
      thingType === 'geothermal well'
    ) {
      show('ocotillo.thing-well', id)
      return
    }

    if (layerId.includes('ogc-springs') || thingType === 'spring') {
      show('ocotillo.thing-spring', id)
    }
  }

  const onMapMouseMove = (_e: any, features: any[], mapRef: any) => {
    features = features.filter(
      (f) => f.layer.id.startsWith('location-') && f?.geometry?.type === 'Point'
    )
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
    <List
      breadcrumb={<Breadcrumb hideIcons={true} />}
      title={
        <Box>
          <Typography variant="h3" fontWeight={700}>
            Map
          </Typography>
          <Typography
            variant="body1"
            sx={{ maxWidth: '85ch', mt: 0.5, color: 'text.secondary' }}
          >
            Explore water wells and springs across New Mexico. Click a point to
            view site details.
          </Typography>
        </Box>
      }
      canCreate={false}
      wrapperProps={{
        elevation: 0,
        sx: {
          backgroundColor: 'background.wrapper',
          boxShadow: 'none',
          borderRadius: 1,
          padding: 0,
        },
      }}
      headerProps={{
        sx: { '.MuiCardHeader-action': { alignSelf: 'flex-start', mt: 0.5 } },
      }}
      contentProps={{ sx: { pt: 1 } }}
    >
      <Box
        data-testid="ocotillo-map-container"
        component="div"
        ref={containerRef}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          border: '2.5px solid',
          borderColor: 'divider',
          height: { xs: 'calc(100vh - 140px)', md: 'calc(100vh - 120px)' },
          minHeight: 560,
          width: '100%',
          position: 'relative',
        }}
      >
        <MapComponent
          containerRef={containerRef}
          showDrawControls={{ show: true, position: 'top-right' }}
          setPopupContent={setPopupContent}
          popupContent={popupContent}
          onPointClick={onMapPointClick}
          onMouseMoveCallback={onMapMouseMove}
        >
          {Object.entries(THING_LAYERS).map(([key, layerDef]) => {
            if (!visibleLayers.includes(key)) return null
            const { sourceProps, layerProps, textLayerProps } = layerDef
            return (
              <Source id={key} key={key} {...sourceProps}>
                <Layer
                  id={`location-${key}`}
                  key={`layer-${key}`}
                  {...layerProps}
                />
                {textLayerProps && (
                  <Layer
                    id={`location-label-${key}`}
                    key={`layer-label-${key}`}
                    {...textLayerProps}
                  />
                )}
              </Source>
            )
          })}
        </MapComponent>
        <Paper
          elevation={6}
          sx={{
            position: 'absolute',
            top: { xs: 58, sm: 62 },
            left: 12,
            width: { xs: 'calc(100% - 24px)', sm: 320 },
            maxHeight: { xs: '68%', sm: '78%' },
            overflowY: 'auto',
            px: 0.8,
            py: 0.6,
            borderRadius: 1.25,
            backdropFilter: 'blur(6px)',
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: '1px solid',
            borderColor: 'divider',
            zIndex: 2,
          }}
        >
          <Box
            sx={{
              px: 0.3,
              py: 0.2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography
              variant="overline"
              sx={{
                px: 0.55,
                py: 0.25,
                fontWeight: 700,
                letterSpacing: 0.7,
                fontSize: '0.68rem',
                lineHeight: 1.2,
              }}
            >
              Layers
            </Typography>
            <IconButton
              size="small"
              onClick={() => setLayersCollapsed((value) => !value)}
              aria-label={layersCollapsed ? 'Expand layers' : 'Collapse layers'}
            >
              {layersCollapsed ? (
                <KeyboardArrowDown fontSize="small" />
              ) : (
                <KeyboardArrowUp fontSize="small" />
              )}
            </IconButton>
          </Box>
          <Collapse in={!layersCollapsed}>
            {(
              Object.keys(groupedLayers) as Array<keyof typeof groupedLayers>
            ).map((groupKey) => {
              const layers = groupedLayers[groupKey]
              if (layers.length === 0) return null

              return (
                <Box key={groupKey} sx={{ py: 0.1 }}>
                  <Box
                    sx={{
                      px: 0.25,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: 0.8,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 0.4,
                        color: 'text.secondary',
                      }}
                    >
                      {groupLabels[groupKey]}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => onGroupToggle(groupKey)}
                      aria-label={
                        expandedGroups[groupKey]
                          ? `Collapse ${groupLabels[groupKey]}`
                          : `Expand ${groupLabels[groupKey]}`
                      }
                      sx={{ p: 0.2 }}
                    >
                      {expandedGroups[groupKey] ? (
                        <KeyboardArrowUp sx={{ fontSize: 15 }} />
                      ) : (
                        <KeyboardArrowDown sx={{ fontSize: 15 }} />
                      )}
                    </IconButton>
                  </Box>
                  <Collapse in={expandedGroups[groupKey]}>
                    {layers.map(([key, layerDef]) => {
                      const { layerProps, isLoading } = layerDef
                      const paint = layerProps.paint || {}
                      const paintColor =
                        paint['circle-color'] ||
                        paint['line-color'] ||
                        paint['fill-color']
                      const color =
                        layerDef.legendColor ||
                        (typeof paintColor === 'string'
                          ? paintColor
                          : '#9e9e9e')

                      return (
                        <Box key={key} sx={{ px: 0.2, py: 0.05 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.35,
                              minHeight: 24,
                            }}
                          >
                            <Checkbox
                              checked={visibleLayers.includes(key)}
                              onChange={onLayerChangeWrapper(key)}
                              size="small"
                              sx={{ p: 0.2 }}
                            />
                            {!layerDef.legendScale && (
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '2px',
                                  backgroundColor: color,
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <ListItemText
                              primary={layerProps.label}
                              primaryTypographyProps={{
                                lineHeight: 1.15,
                                fontSize: '0.75rem',
                              }}
                              sx={{ m: 0, my: -0.15 }}
                            />
                          </Box>
                          {layerDef.legendScale && (
                            <Box sx={{ pl: 3.1, pr: 0.6, pb: 0.15 }}>
                              <Box
                                sx={{
                                  height: 5,
                                  borderRadius: 1,
                                  border: '1px solid',
                                  borderColor: 'rgba(0,0,0,0.18)',
                                  background: layerDef.legendScale.gradient,
                                }}
                              />
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  mt: 0.1,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{ fontSize: '0.6rem', lineHeight: 1 }}
                                >
                                  {layerDef.legendScale.minLabel}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ fontSize: '0.6rem', lineHeight: 1 }}
                                >
                                  {layerDef.legendScale.maxLabel}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                          <Box sx={{ height: 2, mt: 0 }}>
                            {isLoading && <LinearProgress sx={{ height: 2 }} />}
                          </Box>
                        </Box>
                      )
                    })}
                  </Collapse>
                </Box>
              )
            })}
          </Collapse>
        </Paper>
      </Box>
    </List>
  )
}
