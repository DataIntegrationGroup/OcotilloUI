import React, { useRef, useState } from 'react'
import { Layer, Source } from 'react-map-gl'
import MapComponent from '@/components/MapComponent'
import { useGo } from '@refinedev/core'
import { useThingLayers } from '@/hooks'
import {
  Box,
  Card,
  LinearProgress,
  Stack,
  Typography,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { MapPopup } from '@/components'
import { Breadcrumb, List } from '@refinedev/mui'

export const MapView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)
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
    <List
      breadcrumb={<Breadcrumb hideIcons={true} />}
      title={
        <Box>
          <Typography variant="h3" fontWeight={700}>
            Map
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: '85ch', mt: 0.5, color: 'text.secondary' }}>
            Explore water wells and springs across New Mexico. Click a point to view site details.
          </Typography>
        </Box>
      }
      canCreate={false}
      wrapperProps={{
        elevation: 0,
        sx: { backgroundColor: 'background.wrapper', boxShadow: 'none', borderRadius: 1, padding: 0 },
      }}
      headerProps={{ sx: { '.MuiCardHeader-action': { alignSelf: 'flex-start', mt: 0.5, mr: 0 } } }}
      contentProps={{ sx: { pt: 1 } }}
    >
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6, lg: 4, xl: 3 }}>
          <Card elevation={2}>
            <Stack spacing={1} p={2}>
              <Typography variant="h4">Layers</Typography>
              <Divider />
              {Object.entries(THING_LAYERS).map(([key, layerDef]) => {
                const { layerProps, isLoading } = layerDef
                const color = layerProps.paint['circle-color']

                return (
                  <Stack key={key} spacing={0.5} px={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          flexShrink: 0,
                          backgroundColor: color,
                          borderRadius: '4px',
                        }}
                      />
                    </Box>
                    <Box sx={{ height: 4 }}>
                      {isLoading && <LinearProgress sx={{ height: 4 }} />}
                    </Box>
                  </Stack>
                )
              })}
            </Stack>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 8, xl: 9 }}>
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
          </Box>
        </Grid>
      </Grid>
    </List>
  )
}
