import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Layer, Source } from 'react-map-gl'
import { useGo } from '@refinedev/core'
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  Drawer,
  IconButton,
  LinearProgress,
  ListItemText,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  Download,
  Close,
  KeyboardArrowDown,
  KeyboardArrowUp,
  ScienceOutlined,
} from '@mui/icons-material'
import BasemapSelector from '@/components/BasemapSelector'
import MapExportControls from '@/components/MapExportControls'
import MapComponent from '@/components/MapComponent'
import {
  PiperDiagram,
  type PiperDiagramHandle,
} from '@/components/PiperDiagram'
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
  const piperDiagramRef = useRef<PiperDiagramHandle | null>(null)
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
      usgsNwisOgc: true,
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
  const [isPiperDrawerOpen, setIsPiperDrawerOpen] = useState(false)
  const [activePiperFeatureId, setActivePiperFeatureId] = useState<string | null>(null)
  const SELECTED_POINTS_BOTTOM_GUTTER = 30
  const SELECTED_POINTS_LAYER_GAP = 12
  const SELECTED_POINTS_FALLBACK_HEIGHT = 52
  const selectedLayerKey = visibleLayers.length === 1 ? visibleLayers[0] : null
  const areDrawToolsEnabled = visibleLayers.length > 0
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

  const exportableLayers = useMemo(
    () =>
      visibleLayers
        .flatMap((layerKey) => {
          const layerDef = THING_LAYERS[layerKey]
          if (!layerDef) return []

          return [{
            layerKey,
            layerDef,
            label: layerDef.layerProps?.label || layerKey,
            featureCollection: {
              ...(layerDef.sourceData?.type === 'FeatureCollection'
                ? layerDef.sourceData
                : { type: 'FeatureCollection', features: [] }),
              features: filterLayerFeaturesBySelection(
                Array.isArray(layerDef.sourceData?.features)
                  ? layerDef.sourceData.features
                  : [],
                selectionFeatures
                ),
            },
          }]
        }),
    [THING_LAYERS, visibleLayers, selectionFeatures]
  )

  const selectedPointsByLayer = useMemo(
    () =>
      exportableLayers
        .map(({ layerKey, label, featureCollection }) => {
          const features = getSelectedPointFeatures(
            featureCollection,
            hasSelectionPolygon
          )

          return {
            layerKey,
            label,
            features,
            columns: getSelectedPointColumns(features, layerKey),
          }
        })
        .filter(({ features }) => features.length > 0),
    [exportableLayers, hasSelectionPolygon]
  )

  const selectedPointFeatures = useMemo(
    () =>
      selectedLayerKey
        ? selectedPointsByLayer.find(({ layerKey }) => layerKey === selectedLayerKey)
            ?.features || []
        : [],
    [selectedLayerKey, selectedPointsByLayer]
  )
  const selectedMajorChemistryPoints = useMemo(
    () => {
      const selectedFeatures =
        selectedPointsByLayer.find(
          ({ layerKey }) => layerKey === 'ogc-major-chemistry'
        )?.features || []

      if (hasSelectionPolygon) {
        return selectedFeatures
      }

      const allFeatures = THING_LAYERS['ogc-major-chemistry']?.sourceData?.features
      return Array.isArray(allFeatures)
        ? allFeatures.filter((feature) => feature?.geometry?.type === 'Point')
        : []
    },
    [THING_LAYERS, hasSelectionPolygon, selectedPointsByLayer]
  )
  const activeMajorChemistryFeature = useMemo(
    () =>
      selectedMajorChemistryPoints.find(
        (feature) => getFeatureId(feature) === activePiperFeatureId
      ) || null,
    [activePiperFeatureId, selectedMajorChemistryPoints]
  )
  const isMajorChemistryVisible = visibleLayers.includes('ogc-major-chemistry')

  const totalSelectedPointCount = useMemo(
    () =>
      selectedPointsByLayer.reduce(
        (sum, { features }) => sum + features.length,
        0
      ),
    [selectedPointsByLayer]
  )
  const canExpandSelectedPoints =
    hasSelectionPolygon && selectedPointsByLayer.length > 0

  const selectedPointIdsByLayer = useMemo(
    () =>
      Object.fromEntries(
        selectedPointsByLayer.map(({ layerKey, features }) => [
          layerKey,
          getSelectedPointIds(features),
        ])
      ) as Record<string, Set<string>>,
    [selectedPointsByLayer]
  )
  const hasExportableLayers = exportableLayers.length > 0
  const { ref: basemapPanelRef, height: basemapPanelHeight } =
    useMeasuredHeight<HTMLDivElement>([basemapCollapsed, selectedBasemap], 52)
  const {
    ref: selectedPointsDrawerRef,
    height: selectedPointsDrawerHeight,
  } = useMeasuredHeight<HTMLDivElement>(
    [selectedPointsCollapsed, selectedPointsByLayer, hasSelectionPolygon],
    SELECTED_POINTS_FALLBACK_HEIGHT
  )
  const selectedPointsDrawerReservedSpace = `${
    selectedPointsDrawerHeight +
    SELECTED_POINTS_BOTTOM_GUTTER +
    SELECTED_POINTS_LAYER_GAP
  }px`

  const downloadLayerBlob = (
    content: BlobPart,
    contentType: string,
    suffix: string,
    label: string,
    index = 0
  ) => {
    window.setTimeout(() => {
      const blob = new Blob([content], { type: contentType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${sanitizeLayerExportFilename(label)}.${suffix}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, index * 150)
  }

  const exportLayerCollection = (
    featureCollection: any,
    label: string,
    format: 'csv' | 'geojson',
    index = 0
  ) => {
    const features = Array.isArray(featureCollection?.features)
      ? featureCollection.features
      : []

    if (format === 'geojson') {
      downloadLayerBlob(
        JSON.stringify(featureCollection, null, 2),
        'application/geo+json;charset=utf-8;',
        'geojson',
        label,
        index
      )
      return
    }

    downloadLayerBlob(
      buildLayerCsv(features),
      'text/csv;charset=utf-8;',
      'csv',
      label,
      index
    )
  }

  const onExportSelectedPoints = () => {
    selectedPointsByLayer.forEach(({ label, features }, index) => {
      exportLayerCollection(
        {
          type: 'FeatureCollection',
          features,
        },
        label,
        exportFormat,
        index
      )
    })
  }

  const onExportLayer = () => {
    exportableLayers.forEach(({ featureCollection, label }, index) => {
      exportLayerCollection(featureCollection, label, exportFormat, index)
    })
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

  const getLayerGroupKey = (
    layerKey: string,
    layerDef?: { layerProps?: { label?: string } }
  ): keyof typeof expandedGroups => {
    const label = String(layerDef?.layerProps?.label || '').toLowerCase()
    const normalizedKey = layerKey.toLowerCase()
    if (
      normalizedKey.includes('usgs') ||
      normalizedKey.includes('nwis') ||
      label.includes('usgs') ||
      label.includes('nwis') ||
      label.includes('national water information system')
    ) {
      return 'usgsNwisOgc'
    }

    if (
      layerKey.includes('water-well') ||
      layerKey.includes('depth-to-water') ||
      layerKey.includes('tds') ||
      layerKey.includes('chemistry') ||
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
    usgsNwisOgc: 'USGS NWIS OGC',
    surfaceWater: 'Surface Water',
    climate: 'Climate',
    geoscience: 'Geoscience',
    reference: 'Reference',
  }

  const groupedLayers = (
    Object.entries(THING_LAYERS) as Array<[string, any]>
  ).reduce(
    (acc, entry) => {
      const groupKey = getLayerGroupKey(entry[0], entry[1])
      acc[groupKey].push(entry)
      return acc
    },
    {
      groundwater: [] as Array<[string, any]>,
      usgsNwisOgc: [] as Array<[string, any]>,
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
    if (!canExpandSelectedPoints) return
    setSelectedPointsCollapsed((value) => !value)
  }

  useEffect(() => {
    if (!canExpandSelectedPoints) {
      setSelectedPointsCollapsed(true)
    }
  }, [canExpandSelectedPoints])

  useEffect(() => {
    if (!isMajorChemistryVisible) {
      setIsPiperDrawerOpen(false)
      setActivePiperFeatureId(null)
    }
  }, [isMajorChemistryVisible])

  useEffect(() => {
    if (!isPiperDrawerOpen) {
      setActivePiperFeatureId(null)
    }
  }, [isPiperDrawerOpen])

  useEffect(() => {
    if (
      activePiperFeatureId &&
      !selectedMajorChemistryPoints.some(
        (feature) => getFeatureId(feature) === activePiperFeatureId
      )
    ) {
      setActivePiperFeatureId(null)
    }
  }, [activePiperFeatureId, selectedMajorChemistryPoints])

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
              const selectedPointIds = selectedPointIdsByLayer[key]
              const shouldStylePointSelection =
                hasSelectionPolygon &&
                layerProps?.type === 'circle' &&
                selectedPointIds?.size > 0
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
            {activeMajorChemistryFeature ? (
              <Source
                id="active-major-chemistry-point"
                type="geojson"
                data={{
                  type: 'FeatureCollection',
                  features: [activeMajorChemistryFeature],
                }}
              >
                <Layer
                  id="active-major-chemistry-point-halo"
                  type="circle"
                  paint={{
                    'circle-radius': 10,
                    'circle-color': '#ffffff',
                    'circle-opacity': 0.22,
                    'circle-stroke-color': '#0f172a',
                    'circle-stroke-width': 2.4,
                  }}
                />
                <Layer
                  id="active-major-chemistry-point-core"
                  type="circle"
                  paint={{
                    'circle-radius': 6,
                    'circle-color': '#2563eb',
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 1.8,
                  }}
                />
              </Source>
            ) : null}
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
          bottom: layersPanelPinned ? selectedPointsDrawerReservedSpace : 'auto',
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
                buttonLabel={
                  hasSelectionPolygon
                    ? 'Export Selected'
                    : visibleLayers.length > 1
                      ? 'Export Layers'
                      : 'Export Layer'
                }
                disabled={!hasExportableLayers}
                tooltipPlacement="right"
                tooltip={
                  hasExportableLayers
                    ? `Click to download ${
                        hasSelectionPolygon
                          ? 'the selected portion of each visible layer'
                          : visibleLayers.length > 1
                            ? 'each visible layer'
                            : 'that layer'
                      } as separate ${exportFormat === 'csv' ? 'CSV' : 'GeoJSON'} file${
                        visibleLayers.length > 1 || hasSelectionPolygon ? 's' : ''
                      }.`
                    : 'Disabled until at least one layer is visible.'
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
                                {key === 'ogc-major-chemistry' ? (
                                  <Button
                                    size="small"
                                    variant={
                                      isPiperDrawerOpen ? 'contained' : 'outlined'
                                    }
                                    startIcon={
                                      <ScienceOutlined sx={{ fontSize: 14 }} />
                                    }
                                    onClick={() =>
                                      setIsPiperDrawerOpen((open) => !open)
                                    }
                                    disabled={!visibleLayers.includes(key)}
                                    sx={{
                                      minWidth: 0,
                                      px: 0.7,
                                      py: 0.2,
                                      ml: 0.3,
                                      flexShrink: 0,
                                      fontSize: '0.65rem',
                                      lineHeight: 1,
                                      '& .MuiButton-startIcon': {
                                        mr: 0.35,
                                        ml: 0,
                                      },
                                    }}
                                  >
                                    Piper
                                  </Button>
                                ) : null}
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
        <Drawer
          anchor="right"
          variant="persistent"
          open={isPiperDrawerOpen}
          hideBackdrop
          PaperProps={{
            sx: (theme) => ({
              position: 'absolute',
              top: 12,
              right: 52,
              bottom: 'auto',
              height: 'calc(100% - 48px)',
              maxHeight: 'calc(100% - 48px)',
              width: {
                xs: 'min(calc(100% - 24px), 360px)',
                sm: 340,
                md: 360,
              },
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.9),
              backgroundColor: alpha(theme.palette.background.paper, 0.96),
              backdropFilter: 'blur(8px)',
              overflow: 'hidden',
              zIndex: 3,
            }),
          }}
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            '& .MuiDrawer-paper': {
              pointerEvents: 'auto',
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: 0,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                px: 1.1,
                py: 0.85,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Piper Diagram
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Live major chemistry selection.
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => void piperDiagramRef.current?.exportPdf()}
                aria-label="Export Piper diagram PDF"
                disabled={selectedMajorChemistryPoints.length === 0}
              >
                <Download fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setIsPiperDrawerOpen(false)}
                aria-label="Close Piper diagram"
              >
                <Close fontSize="small" />
              </IconButton>
            </Stack>
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', p: 1 }}>
              <PiperDiagram
                ref={piperDiagramRef}
                features={selectedMajorChemistryPoints}
                activeFeatureId={activePiperFeatureId}
                onActiveFeatureChange={setActivePiperFeatureId}
              />
            </Box>
          </Box>
        </Drawer>
        <Drawer
          anchor="bottom"
          variant="persistent"
          open
          hideBackdrop
          PaperProps={{
            sx: (theme) => ({
              position: 'absolute',
              left: 12,
              right: 12,
              bottom: SELECTED_POINTS_BOTTOM_GUTTER,
              top: 'auto',
              width: 'auto',
              maxHeight: 'min(42%, 320px)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.9),
              backgroundColor: alpha(theme.palette.background.paper, 0.96),
              backdropFilter: 'blur(8px)',
              overflow: 'hidden',
              zIndex: 2,
            }),
          }}
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            '& .MuiDrawer-paper': {
              pointerEvents: 'auto',
            },
          }}
        >
          <Box
            ref={selectedPointsDrawerRef}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <Box
              sx={{
                px: 1,
                py: 0.7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                borderBottom: selectedPointsCollapsed || !canExpandSelectedPoints
                  ? 'none'
                  : '1px solid',
                borderColor: 'divider',
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
                {hasSelectionPolygon
                  ? `${totalSelectedPointCount} point${totalSelectedPointCount === 1 ? '' : 's'} across ${selectedPointsByLayer.length} layer${selectedPointsByLayer.length === 1 ? '' : 's'}`
                  : 'Draw a polygon/rectangle to select points from visible layers'}
              </Typography>
              {hasSelectionPolygon && selectedPointsByLayer.length > 0 ? (
                <Box sx={{ flex: '0 0 auto' }}>
                  <MapExportControls
                    value={exportFormat}
                    onChange={setExportFormat}
                    onExport={onExportSelectedPoints}
                    buttonLabel="Export Selected"
                    selectorWidth={142}
                    tooltip={`Click to download the selected points for each visible layer as separate ${
                      exportFormat === 'csv' ? 'CSV' : 'GeoJSON'
                    } files.`}
                  />
                </Box>
              ) : null}
              <IconButton
                size="small"
                onClick={onSelectedPointsCollapseToggle}
                disabled={!canExpandSelectedPoints}
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
            <Collapse
              in={canExpandSelectedPoints && !selectedPointsCollapsed}
              unmountOnExit
            >
              <Box
                sx={{
                  px: 1,
                  pb: 0.8,
                  maxHeight: 'min(30vh, 240px)',
                  overflowY: 'auto',
                }}
              >
                {selectedPointsByLayer.map(({ layerKey, label, features, columns }) => (
                  <Box key={layerKey} sx={{ mb: 0.9, '&:last-child': { mb: 0 } }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mb: 0.25,
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 0.45,
                        color: 'text.secondary',
                      }}
                    >
                      {label} ({features.length})
                    </Typography>
                    <TableContainer
                      sx={{
                        maxHeight: 132,
                        overflowX: 'auto',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        backgroundColor: 'background.default',
                      }}
                    >
                      <Table stickyHeader size="small" sx={{ width: 'max-content', minWidth: '100%' }}>
                        <TableHead>
                          <TableRow>
                            {columns.map((column) => (
                              <TableCell
                                key={column}
                                sx={{
                                  fontSize: '0.64rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  whiteSpace: 'nowrap',
                                  wordBreak: 'keep-all',
                                  fontVariantNumeric: 'tabular-nums',
                                  py: 0.5,
                                }}
                              >
                                {getSelectedPointColumnLabel(column)}
                              </TableCell>
                            ))}
                            <TableCell
                              sx={{
                                fontSize: '0.64rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap',
                                wordBreak: 'keep-all',
                                fontVariantNumeric: 'tabular-nums',
                                py: 0.5,
                              }}
                            >
                              Coordinates
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {features.map((feature: any, index: number) => {
                            const coordinates = feature?.geometry?.coordinates || []
                            return (
                              <TableRow key={`${feature?.id || index}`}>
                                {columns.map((column) => (
                                  <TableCell
                                    key={column}
                                    sx={{
                                      fontSize: '0.66rem',
                                      lineHeight: 1.15,
                                      py: 0.45,
                                      whiteSpace: 'nowrap',
                                      wordBreak: 'keep-all',
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
                                    fontSize: '0.66rem',
                                    lineHeight: 1.15,
                                    py: 0.45,
                                    whiteSpace: 'nowrap',
                                    wordBreak: 'keep-all',
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
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>
        </Drawer>
      </Box>
    </Box>
  )
}
