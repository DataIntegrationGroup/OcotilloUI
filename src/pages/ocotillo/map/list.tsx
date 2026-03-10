import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Layer, Source } from 'react-map-gl'
import { useGo } from '@refinedev/core'
import {
  Box,
  Checkbox,
  Collapse,
  IconButton,
  LinearProgress,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import BasemapSelector from '@/components/BasemapSelector'
import MapExportControls from '@/components/MapExportControls'
import MapComponent from '@/components/MapComponent'
import { MapPopup } from '@/components'
import { ColorModeContext } from '@/contexts'
import { useMeasuredHeight, useThingLayers } from '@/hooks'
import { DEFAULT_MAPBOX_BASEMAP } from '@/constants'
import {
  buildLayerCsv,
  filterLayerFeaturesBySelection,
  sanitizeLayerExportFilename,
} from '@/utils/layerExport'
import {
  buildSelectedPointPaint,
  buildSelectedPointSourceData,
  getSelectedPointColumnLabel,
  formatSelectedPointCoordinates,
  getFeatureId,
  getSelectedPointDisplayValue,
  getSelectedPointColumns,
  getSelectedPointFeatures,
  getSelectedPointIds,
} from '@/utils/mapSelection'

export const MapView: React.FC = () => {
  const { mode } = useContext(ColorModeContext)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const [visibleLayers, setVisibleLayers] = React.useState<string[]>([
    'ogc-latest-depth-to-water',
  ])
  const THING_LAYERS = useThingLayers(visibleLayers)
  const [basemapCollapsed, setBasemapCollapsed] = useState(true)
  const [selectedPointsCollapsed, setSelectedPointsCollapsed] = useState(false)
  const [layersCollapsed, setLayersCollapsed] = useState(false)
  const [layersPanelPinned, setLayersPanelPinned] = useState(true)
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
  const [exportFormat, setExportFormat] = useState<'csv' | 'geojson'>('csv')
  const [selectionPolygons, setSelectionPolygons] = useState<
    Record<string, any>
  >({})
  const [selectedBasemap, setSelectedBasemap] = useState(
    DEFAULT_MAPBOX_BASEMAP
  )
  const selectedLayerKey = visibleLayers.length === 1 ? visibleLayers[0] : null
  const areDrawToolsEnabled = visibleLayers.length === 1
  const selectedLayer = selectedLayerKey ? THING_LAYERS[selectedLayerKey] : null
  const selectionFeatures = (
    Object.values(selectionPolygons) as any[]
  ).filter((feature) =>
    ['Polygon', 'MultiPolygon'].includes(feature?.geometry?.type)
  )
  const hasSelectionPolygon = selectionFeatures.length > 0

  useEffect(() => {
    if (hasSelectionPolygon || Object.keys(selectionPolygons).length === 0) {
      return
    }

    setSelectionPolygons({})
  }, [hasSelectionPolygon, selectionPolygons])

  const selectedLayerSourceData = useMemo(() => {
    const sourceData = selectedLayer?.sourceData as any
    return sourceData && sourceData.type === 'FeatureCollection'
      ? sourceData
      : { type: 'FeatureCollection', features: [] }
  }, [selectedLayer])
  const exportFeatureCollection = useMemo(() => {
    const features = Array.isArray(selectedLayerSourceData.features)
      ? selectedLayerSourceData.features
      : []

    return {
      ...selectedLayerSourceData,
      features: filterLayerFeaturesBySelection(features, selectionFeatures),
    }
  }, [selectedLayerSourceData, selectionFeatures])

  const downloadBlob = (content: BlobPart, contentType: string, suffix: string) => {
    if (!selectedLayerKey || !selectedLayer) return

    const blob = new Blob([content], { type: contentType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const label = selectedLayer.layerProps?.label || selectedLayerKey
    link.href = url
    link.download = `${sanitizeLayerExportFilename(label)}.${suffix}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const selectedPointFeatures = useMemo(() => {
    if (!selectedLayer) return []
    return getSelectedPointFeatures(exportFeatureCollection, hasSelectionPolygon)
  }, [hasSelectionPolygon, selectedLayer, exportFeatureCollection])

  const selectedPointColumns = useMemo(() => {
    return getSelectedPointColumns(selectedPointFeatures, selectedLayerKey)
  }, [selectedPointFeatures, selectedLayerKey])

  const selectedPointIds = useMemo(
    () => getSelectedPointIds(selectedPointFeatures),
    [selectedPointFeatures]
  )
  const { ref: basemapPanelRef, height: basemapPanelHeight } =
    useMeasuredHeight<HTMLDivElement>([basemapCollapsed, selectedBasemap], 52)

  const downloadSelectedPoints = (format: 'csv' | 'geojson') => {
    if (selectedPointFeatures.length === 0) return

    if (format === 'geojson') {
      downloadBlob(
        JSON.stringify(
          {
            type: 'FeatureCollection',
            features: selectedPointFeatures,
          },
          null,
          2
        ),
        'application/geo+json;charset=utf-8;',
        'geojson'
      )
      return
    }

    downloadBlob(
      buildLayerCsv(selectedPointFeatures),
      'text/csv;charset=utf-8;',
      'csv'
    )
  }

  const onExportSelectedPoints = () => {
    downloadSelectedPoints(exportFormat)
  }

  const onExportLayerCsv = () => {
    if (!selectedLayerKey || !selectedLayer) return

    const features = Array.isArray(exportFeatureCollection.features)
      ? exportFeatureCollection.features
      : []
    const csv = buildLayerCsv(features)

    downloadBlob(csv, 'text/csv;charset=utf-8;', 'csv')
  }

  const onExportLayerGeoJson = () => {
    if (!selectedLayerKey || !selectedLayer) return
    downloadBlob(
      JSON.stringify(exportFeatureCollection, null, 2),
      'application/geo+json;charset=utf-8;',
      'geojson'
    )
  }

  const onExportLayer = () => {
    if (exportFormat === 'geojson') {
      onExportLayerGeoJson()
      return
    }
    onExportLayerCsv()
  }

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

  const onBasemapCollapseToggle = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    event.stopPropagation()
    setBasemapCollapsed((value) => !value)
  }

  const onLayersCollapseToggle = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    event.stopPropagation()
    if (layersCollapsed) {
      setLayersPanelPinned(true)
      setLayersCollapsed(false)
      return
    }

    setLayersCollapsed(true)
  }

  const onSelectedPointsCollapseToggle = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    event.stopPropagation()
    setSelectedPointsCollapsed((value) => !value)
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        mt: -1,
        pb: 2,
      }}
    >
      <Box
        data-testid="ocotillo-map-container"
        component="div"
        sx={{
          flex: 1,
          borderRadius: 2,
          overflow: 'hidden',
          border: '2.5px solid',
          borderColor: 'divider',
          height: 'auto',
          minHeight: 360,
          width: '100%',
          position: 'relative',
        }}
      >
        <Box
          ref={mapContainerRef}
          sx={{
            position: 'absolute',
            inset: 0,
            height: '100%',
            '& .mapboxgl-ctrl-bottom-left, & .mapboxgl-ctrl-bottom-right': {
              bottom: '6px',
            },
            '& .mapboxgl-ctrl-bottom-left .mapboxgl-ctrl, & .mapboxgl-ctrl-bottom-right .mapboxgl-ctrl': {
              marginBottom: 0,
            },
          }}
        >
          <MapComponent
            containerRef={mapContainerRef}
            showDrawControls={{
              show: true,
              position: 'top-right',
              disabled: !areDrawToolsEnabled,
            }}
            setSelectionPolygons={setSelectionPolygons}
            setPopupContent={setPopupContent}
            popupContent={popupContent}
            onPointClick={onMapPointClick}
            onMouseMoveCallback={onMapMouseMove}
            basemapUri={selectedBasemap}
            onBasemapChange={setSelectedBasemap}
          >
            {Object.entries(THING_LAYERS).map(([key, layerDef]) => {
              if (!visibleLayers.includes(key)) return null
              const { sourceProps, layerProps, textLayerProps } = layerDef
              const shouldStylePointSelection =
                key === selectedLayerKey &&
                hasSelectionPolygon &&
                layerProps?.type === 'circle' &&
                selectedPointIds.size > 0
              const sourceData = sourceProps?.data as any
              const styledSourceData =
                shouldStylePointSelection
                  ? buildSelectedPointSourceData({
                      sourceData,
                      selectedPointIds,
                    })
                  : sourceData
              const styledLayerProps = shouldStylePointSelection
                ? {
                    ...layerProps,
                    paint: buildSelectedPointPaint(
                      layerProps.paint,
                      mode === 'dark' ? 'dark' : 'light'
                    ),
                  }
                : layerProps
              return (
                <Source
                  id={key}
                  key={key}
                  {...sourceProps}
                  data={styledSourceData}
                >
                  <Layer
                    id={`location-${key}`}
                    key={`layer-${key}`}
                    {...styledLayerProps}
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
        </Box>
        <Paper
        elevation={6}
        ref={basemapPanelRef}
        sx={(theme) => ({
          position: 'absolute',
          top: 12,
          left: 12,
          width: { xs: 'calc(100% - 24px)', sm: 320 },
          display: 'flex',
          flexDirection: 'column',
          overflow: basemapCollapsed ? 'visible' : 'hidden',
          px: 0.8,
          py: 0.6,
          borderRadius: 1.25,
          backdropFilter: 'blur(6px)',
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          border: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.9),
          zIndex: 2,
          height: basemapCollapsed ? 'auto' : undefined,
        })}
      >
        <Box
          sx={{
            px: 0.3,
            py: 0.2,
            display: 'flex',
            alignItems: 'center',
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
              flex: 1,
            }}
          >
            Base Maps
          </Typography>
          <IconButton
            size="small"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={onBasemapCollapseToggle}
            aria-label={basemapCollapsed ? 'Expand base maps' : 'Collapse base maps'}
          >
            {basemapCollapsed ? (
              <KeyboardArrowDown fontSize="small" />
            ) : (
              <KeyboardArrowUp fontSize="small" />
            )}
          </IconButton>
        </Box>
        <Collapse
          in={!basemapCollapsed}
          unmountOnExit
          sx={{
            minHeight: 0,
            overflowY: 'auto',
          }}
        >
          <Box sx={{ px: 0.5, pb: 0.5 }}>
            <BasemapSelector
              value={selectedBasemap}
              onChange={setSelectedBasemap}
            />
          </Box>
        </Collapse>
        </Paper>
        <Paper
        elevation={6}
        sx={(theme) => ({
          position: 'absolute',
          top: 12 + basemapPanelHeight,
          bottom: layersPanelPinned ? { xs: 44, sm: 40 } : 'auto',
          left: 12,
          width: { xs: 'calc(100% - 24px)', sm: 320 },
          display: 'flex',
          flexDirection: 'column',
          overflow: layersCollapsed ? 'visible' : 'hidden',
          px: 0.8,
          py: 0.6,
          borderRadius: 1.25,
          backdropFilter: 'blur(6px)',
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          border: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.9),
          zIndex: 2,
          height: layersCollapsed ? 'auto' : undefined,
        })}
      >
        <Box
          sx={{
            px: 0.3,
            py: 0.2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 0.35,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.6,
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
            <Box sx={{ flex: 1, minWidth: 0 }} />
            <IconButton
              size="small"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={onLayersCollapseToggle}
              aria-label={layersCollapsed ? 'Expand layers' : 'Collapse layers'}
            >
              {layersCollapsed ? (
                <KeyboardArrowDown fontSize="small" />
              ) : (
                <KeyboardArrowUp fontSize="small" />
              )}
            </IconButton>
          </Box>
        </Box>
        <Collapse
          in={!layersCollapsed}
          unmountOnExit
          onExited={() => setLayersPanelPinned(false)}
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            '& .MuiCollapse-wrapper': {
              display: 'flex',
              flex: 1,
              minHeight: 0,
            },
            '& .MuiCollapse-wrapperInner': {
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <Box
              sx={(theme) => ({
                flex: '0 0 auto',
                px: 0.25,
                pb: 0.35,
                pt: 0.1,
                backgroundColor: alpha(theme.palette.background.paper, 0.96),
                borderBottom: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.75),
              })}
            >
              <MapExportControls
                value={exportFormat}
                onChange={setExportFormat}
                onExport={onExportLayer}
                buttonLabel={hasSelectionPolygon ? 'Export Selected' : 'Export Layer'}
                disabled={!selectedLayerKey}
                tooltipPlacement="right"
                tooltip={
                  selectedLayerKey
                    ? `Click to download ${
                        hasSelectionPolygon ? 'the selected map area' : 'that layer'
                      } as ${exportFormat === 'csv' ? 'CSV' : 'GeoJSON'}.`
                    : 'Disabled unless exactly one layer is selected. Draw tools are also only enabled when exactly one layer is selected.'
                }
              />
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              {(Object.keys(groupedLayers) as Array<keyof typeof groupedLayers>).map(
                (groupKey) => {
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
                                    sx={(theme) => ({
                                      height: 5,
                                      borderRadius: 1,
                                      border: '1px solid',
                                      borderColor: alpha(theme.palette.divider, 0.75),
                                      background: layerDef.legendScale.gradient,
                                    })}
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
                }
              )}
            </Box>
          </Box>
        </Collapse>
        </Paper>
      </Box>
      <Paper
        elevation={6}
        sx={(theme) => ({
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: selectedPointsCollapsed ? 'visible' : 'hidden',
          px: 0.8,
          py: 0.6,
          borderRadius: 1.25,
          backgroundColor: alpha(theme.palette.background.paper, 0.96),
          border: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.9),
        })}
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
            Selected Points
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', flex: 1, minWidth: 0 }}
          >
            {selectedLayerKey && hasSelectionPolygon
              ? `${selectedPointFeatures.length} point${selectedPointFeatures.length === 1 ? '' : 's'} in selection`
              : 'Draw a polygon/rectangle with one layer selected'}
          </Typography>
          {selectedLayerKey && hasSelectionPolygon && selectedPointFeatures.length > 0 ? (
            <Box sx={{ flex: '0 0 auto' }}>
              <MapExportControls
                value={exportFormat}
                onChange={setExportFormat}
                onExport={onExportSelectedPoints}
                buttonLabel="Export Selected"
                selectorWidth={142}
                tooltip={`Click to download the selected points as ${
                  exportFormat === 'csv' ? 'CSV' : 'GeoJSON'
                }.`}
              />
            </Box>
          ) : null}
          <IconButton
            size="small"
            onClick={onSelectedPointsCollapseToggle}
            aria-label={
              selectedPointsCollapsed
                ? 'Expand selected points'
                : 'Collapse selected points'
            }
          >
            {selectedPointsCollapsed ? (
              <KeyboardArrowDown fontSize="small" />
            ) : (
              <KeyboardArrowUp fontSize="small" />
            )}
          </IconButton>
        </Box>
        <Collapse in={!selectedPointsCollapsed} unmountOnExit>
          <Box sx={{ px: 0.5, pb: 0.25 }}>
            {selectedPointFeatures.length > 0 ? (
              <TableContainer
                sx={{
                  maxHeight: 180,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  backgroundColor: 'background.default',
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {selectedPointColumns.map((column) => (
                        <TableCell
                          key={column}
                          sx={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {getSelectedPointColumnLabel(column)}
                        </TableCell>
                      ))}
                      <TableCell
                        sx={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        Coordinates
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedPointFeatures.map((feature: any, index: number) => {
                      const properties = feature?.properties || {}
                      const coordinates = feature?.geometry?.coordinates || []
                      return (
                        <TableRow key={`${feature?.id || index}`}>
                          {selectedPointColumns.map((column) => (
                            <TableCell
                              key={column}
                              sx={{
                                fontSize: '0.7rem',
                                lineHeight: 1.2,
                                verticalAlign: 'top',
                                fontVariantNumeric: 'tabular-nums',
                                fontFeatureSettings: '"tnum" 1',
                              }}
                            >
                              {getSelectedPointDisplayValue({ column, feature })}
                            </TableCell>
                          ))}
                          <TableCell
                            sx={{
                              fontSize: '0.7rem',
                              lineHeight: 1.2,
                              whiteSpace: 'nowrap',
                              verticalAlign: 'top',
                              fontVariantNumeric: 'tabular-nums',
                              fontFeatureSettings: '"tnum" 1',
                            }}
                          >
                            {formatSelectedPointCoordinates(coordinates)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : null}
          </Box>
        </Collapse>
      </Paper>
    </Box>
  )
}
