import React, { useState } from 'react'
import { Layer, Source } from 'react-map-gl'
import MapComponent from '@/components/MapComponent'
import {
  useDataProvider,
  useList,
  useOne,
  useGo,
  useGetToPath,
  useResource,
} from '@refinedev/core'
import {
  Box,
  Card,
  CircularProgress,
  LinearProgress,
  TableHead,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
} from '@mui/material'
import Grid from '@mui/material/Grid2'

const useLayer = (thing_type: string, label: string, color: string) => {
  const { data, isLoading } = useOne({
    dataProviderName: 'ocotillo',
    resource: 'geospatial',
    id: null,
    queryOptions: {
      cacheTime: 60000, // Cache for 1 minute
      staleTime: 30000, // Consider data fresh for 30 seconds
    },
    meta: {
      requestConfig: {
        params: {
          thing_type: thing_type,
          format: 'geojson',
        },
      },
    },
  })

  return {
    sourceProps: { type: 'geojson', data: data?.data },
    layerProps: {
      label: label,
      type: 'circle' as const,
      paint: {
        'circle-radius': 3,
        'circle-color': color,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
      },
    },
    isLoading: isLoading,
  }
}

export const MapView: React.FC = () => {
  const defaultLayers = {
    'water-wells': useLayer('water well', 'Water Wells', '#9cd0ab'),
    springs: useLayer('spring', 'Springs', '#f0c0a0'),
    'ephemeral-streams': useLayer(
      'ephemeral stream',
      'Ephemeral Streams',
      '#f5df73'
    ),
    'perennial-streams': useLayer(
      'perennial stream',
      'Perennial Streams',
      '#da55c4'
    ),
    'meteorological-stations': useLayer(
      'meteorological station',
      'Meteorological Stations',
      '#2b7dc0'
    ),
  }

  const [visibleLayers, setVisibleLayers] = React.useState<string[]>(
    Object.keys(defaultLayers)
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

  const onMapPointClick = (e: any, points: any[]) => {
    const selectedPoint = points[0]
    // console.log('selectedPoint', selectedPoint.properties)
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
      // SetMapPopupContent({ features, setPopupContent })
      const children = (
        <Box sx={{ width: '300px' }}>
          <h3 style={{ color: 'black' }}>Click for more details</h3>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell align={'right'}>
                    <strong>ID</strong>
                  </TableCell>
                  <TableCell align={'right'}>
                    <strong>Name</strong>
                  </TableCell>
                  <TableCell align={'right'}>
                    <strong>Type</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {features.map((feature, index) => (
                  <TableRow key={index}>
                    <TableCell component="th" scope="row" align={'right'}>
                      {feature.properties.id}
                    </TableCell>
                    <TableCell align={'right'}>
                      {feature.properties.name}
                    </TableCell>
                    <TableCell align={'right'}>
                      {feature.properties.thing_type}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )
      setPopupContent({
        coordinates: features[0].geometry.coordinates,
        children,
        maxWidth: '800px',
      })
    } else {
      mapRef.current.getCanvas().style.cursor = 'grab'
      setPopupContent(null)
    }
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid size={3}>
          <Card>
            <Box sx={{ padding: 2 }}>
              <h2>Layers</h2>
              {Object.entries(defaultLayers).map((layer) => {
                const [key, layerDef] = layer
                const { layerProps, isLoading } = layerDef
                const color = layerProps.paint['circle-color']

                return (
                  <Grid container key={key}>
                    <Grid size={10}>
                      <label>
                        <input
                          type="checkbox"
                          checked={visibleLayers.includes(key)}
                          onChange={onLayerChangeWrapper(key)}
                        />
                        {layerProps.label}
                      </label>
                    </Grid>
                    <Grid size={2}>
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
                    <Grid size={12}>{isLoading && <LinearProgress />}</Grid>
                  </Grid>
                )
              })}
            </Box>
          </Card>
        </Grid>
        <Grid size={9}>
          <MapComponent
            showDrawControls={{ show: true, position: 'top-right' }}
            // setSelectionPolygons={setSelectionPolygons}
            setPopupContent={setPopupContent}
            popupContent={popupContent}
            onPointClick={onMapPointClick}
            onMouseMoveCallback={onMapMouseMove}
          >
            {Object.entries(defaultLayers).map(([key, layerDef]) => {
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
        </Grid>
      </Grid>
    </Box>
  )
}
