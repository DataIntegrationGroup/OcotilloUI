import React from 'react'
import { Layer, Source } from 'react-map-gl'
import MapComponent from '@/components/MapComponent'
import { useDataProvider, useList, useOne } from '@refinedev/core'
import { Box, Card, CircularProgress, LinearProgress } from '@mui/material'
import Grid from '@mui/material/Grid2'

const useLayer = (thing_type: string, label: string, color: string) => {
  const { data, isLoading } = useOne({
    dataProviderName: 'dataforge',
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
  }
  const [visibleLayers, setVisibleLayers] = React.useState<string[]>(
    Object.keys(defaultLayers)
  )

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
                  <Grid container>
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
            // setPopupContent={setPopupContent}
            // popupContent={popupContent}
            // onMouseMoveCallback={onMouseMove}
          >
            {Object.entries(defaultLayers).map(([key, layerDef]) => {
              if (!visibleLayers.includes(key)) return null
              const { sourceProps, layerProps } = layerDef
              return (
                <Source id={key} key={key} {...sourceProps}>
                  <Layer key={key} {...layerProps} />
                </Source>
              )
            })}
          </MapComponent>
        </Grid>
      </Grid>
    </Box>
  )
}
