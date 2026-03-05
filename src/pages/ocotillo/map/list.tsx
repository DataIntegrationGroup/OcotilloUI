import React, { useRef, useState } from 'react'
import { Layer, Source } from 'react-map-gl'
import MapComponent from '@/components/MapComponent'
import { useGo } from '@refinedev/core'
import { useThingLayers } from '@/hooks'
import {
  Box,
  LinearProgress,
  Typography,
  Checkbox,
  ListItemText,
  Paper,
  IconButton,
  Collapse,
} from '@mui/material'
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import { MapPopup } from '@/components'
import { Breadcrumb, List } from '@refinedev/mui'

export const MapView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const THING_LAYERS = useThingLayers()
  const [visibleLayers, setVisibleLayers] = React.useState<string[]>(
    Object.keys(THING_LAYERS)
  )
  const [layersCollapsed, setLayersCollapsed] = useState(false)
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
      (candidate) => candidate !== undefined && candidate !== null && candidate !== ''
    )
    return value === undefined ? undefined : String(value)
  }

  const onMapPointClick = (_: any, points: any[]) => {
    const selectedPoint = points.find(
      (point) => typeof point?.layer?.id === 'string' && point.layer.id.startsWith('location-')
    )
    if (!selectedPoint) return

    const layerId: string = selectedPoint.layer.id
    const thingType: string = String(selectedPoint?.properties?.thing_type || '').toLowerCase()
    const id = getFeatureId(selectedPoint)
    if (!id) return

    const isWaterWellLayer =
      layerId.includes('ogc-water-wells') ||
      layerId.includes('ogc-water-well-summary') ||
      layerId.includes('ogc-latest-depth-to-water') ||
      layerId.includes('ogc-average-tds') ||
      layerId.includes('ogc-latest-tds') ||
      layerId.includes('ogc-depth-to-water-trend')

    if (isWaterWellLayer || thingType === 'water well' || thingType === 'geothermal well') {
      show('ocotillo.thing-well', id)
      return
    }

    if (layerId.includes('ogc-springs') || thingType === 'spring') {
      show('ocotillo.thing-spring', id)
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
    <List
      breadcrumb={<Breadcrumb hideIcons={true} />}
      title="Map"
      canCreate={false}
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
          height: 650,
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
            const { sourceProps, layerProps } = layerDef
            return (
              <Source id={key} key={key} {...sourceProps}>
                <Layer
                  id={`location-${key}`}
                  key={`layer-${key}`}
                  {...layerProps}
                />
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
            {Object.entries(THING_LAYERS).map((layer) => {
              const [key, layerDef] = layer
              const { layerProps, isLoading } = layerDef
              const paintColor = layerProps.paint['circle-color']
              const color =
                layerDef.legendColor ||
                (typeof paintColor === 'string' ? paintColor : '#9e9e9e')

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
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '2px',
                        backgroundColor: color,
                        flexShrink: 0,
                      }}
                    />
                    <ListItemText
                      primary={layerProps.label}
                      primaryTypographyProps={{
                        lineHeight: 1.15,
                        fontSize: '0.75rem',
                      }}
                      sx={{ m: 0, my: -0.15 }}
                    />
                  </Box>
                  <Box sx={{ height: 2, mt: 0 }}>
                    {isLoading && <LinearProgress sx={{ height: 2 }} />}
                  </Box>
                </Box>
              )
            })}
          </Collapse>
        </Paper>
      </Box>
    </List>
  )
}
