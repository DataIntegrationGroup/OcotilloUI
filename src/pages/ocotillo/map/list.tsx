import React, { useState } from 'react'
import { Layer, Source } from 'react-map-gl'
import MapComponent from '@/components/MapComponent'
import { useGo } from '@refinedev/core'
import { useThingLayers } from '@/hooks'
import {
  Box,
  Card,
  LinearProgress,
  CardHeader,
  Typography,
  CardContent,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { MapPopup } from '@/components'

export const MapView: React.FC = () => {
  const THING_LAYERS = useThingLayers()
  const [visibleLayers, setVisibleLayers] = React.useState<string[]>(
    Object.keys(THING_LAYERS)
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

  const onMapPointClick = (_: any, points: any[]) => {
    const selectedPoint = points[0]
    if (selectedPoint.properties.thing_type === 'water well') {
      show('ocotillo.thing-well', selectedPoint.properties.id)
    } else if (selectedPoint.properties.thing_type === 'spring') {
      show('ocotillo.thing-spring', selectedPoint.properties.id)
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
    <Card elevation={2}>
      <CardHeader title={<Typography variant="h5">Map</Typography>} />
      <CardContent>
        <Grid container spacing={3}>
          <Grid size={{ xs: 3 }}>
            <Card elevation={2}>
              <Grid container spacing={1} p={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h4">Layers</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Divider />
                </Grid>
                {Object.entries(THING_LAYERS).map((layer) => {
                  const [key, layerDef] = layer
                  const { layerProps, isLoading } = layerDef
                  const color = layerProps.paint['circle-color']

                  return (
                    <Grid
                      container
                      size={{ xs: 12 }}
                      key={key}
                      spacing={1}
                      px={1}
                    >
                      <Grid size={{ xs: 10 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={visibleLayers.includes(key)}
                              onChange={onLayerChangeWrapper(key)}
                              color="primary"
                            />
                          }
                          label={layerProps.label}
                        />
                      </Grid>
                      <Grid
                        size={{ xs: 2 }}
                        display="flex"
                        justifyContent="right"
                        alignItems="center"
                      >
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            display: 'inline-block',
                            backgroundColor: color,
                            borderRadius: '4px',
                            marginRight: 1,
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Box sx={{ height: 4, width: '100%' }}>
                          {isLoading && <LinearProgress sx={{ height: 4 }} />}
                        </Box>
                      </Grid>
                    </Grid>
                  )
                })}
              </Grid>
            </Card>
          </Grid>
          <Grid size={{ xs: 9 }}>
            <Box
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                border: '2.5px solid',
                borderColor: 'divider',
              }}
            >
              <MapComponent
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
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
