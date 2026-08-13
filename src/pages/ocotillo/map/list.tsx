import React, { useEffect, useMemo, useRef, useState } from 'react'
import { captureEvent } from '@/analytics/posthog'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useDataProvider, useGo } from '@refinedev/core'
import type { CustomParams } from '@refinedev/core'
import { useLocation } from 'react-router'
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  ListItemText,
  Pagination,
  Paper,
  Stack,
  Tooltip,
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
import { useMeasuredHeight, useThingLayers, useViewportBbox } from '@/hooks'
import { DEFAULT_BASEMAP_ID } from '@/basemaps'
import {
  buildLayerCsv,
  filterLayerFeaturesBySelection,
  sanitizeLayerExportFilename,
} from '@/utils/layerExport'
import { enrichMapFeaturesWithWellDetails } from '@/utils/wellMapExport'
import { buildMapExportPreferredColumnOrder } from '@/well-export/wellMapCsvExport'
import {
  getSelectedPointColumnLabel,
  getFeatureId,
  getSelectedPointDisplayValue,
  getSelectedPointColumns,
} from '@/utils/mapSelection'
import {
  getDistinctMapPoints,
  getMapPointBounds,
} from '@/utils/mapPointInteraction'

function localDateStampForExport(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DEFAULT_VISIBLE_LAYERS = ['ogc-latest-depth-to-water']
const VISIBLE_FEATURES_DRAWER_WIDTH = 360
const VISIBLE_FEATURES_PAGE_SIZE = 10
type VisibleFeatureGroup = {
  layerKey: string
  label: string
  features: any[]
  columns: string[]
}

type VisibleFeaturePageItem = {
  entryKey: string
  layerKey: string
  label: string
  columns: string[]
  feature: any
}

const PRINCIPAL_VISIBLE_FEATURE_DETAIL_BY_LAYER: Record<
  string,
  { column: string; label: string; dateColumn?: string }
> = {
  'ogc-latest-depth-to-water': {
    column: 'depth_to_water_bgs',
    label: 'Depth to water',
    dateColumn: 'observation_datetime',
  },
  'ogc-average-tds': {
    column: 'avg_tds_value',
    label: 'Avg TDS',
    dateColumn: 'first_tds_observation_date',
  },
  'ogc-latest-tds': {
    column: 'latest_tds_value',
    label: 'Latest TDS',
    dateColumn: 'latest_tds_observation_date',
  },
  'ogc-depth-to-water-trend': {
    column: 'trend_category',
    label: 'Trend',
  },
  'ogc-water-elevation-points': {
    column: 'water_elevation_ft',
    label: 'Water elevation',
    dateColumn: 'observation_datetime',
  },
}

const EXCLUDED_VISIBLE_FEATURE_COLUMNS_BY_LAYER: Record<string, string[]> = {
  'ogc-actively-monitored': ['elevation', 'elevation_method'],
}

const DEFAULT_EXPANDED_GROUPS = {
  groundwater: true,
  surfaceWater: true,
  climate: true,
  geoscience: true,
  reference: true,
}

const getLayerGroupKey = (
  layerKey: string
): keyof typeof DEFAULT_EXPANDED_GROUPS => {
  if (
    layerKey.includes('water-well') ||
    layerKey.includes('actively-monitored') ||
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

const getExpandedGroupsForLayers = (layerKeys: string[]) => {
  if (layerKeys.length === 0) return DEFAULT_EXPANDED_GROUPS

  const nextState = {
    groundwater: false,
    surfaceWater: false,
    climate: false,
    geoscience: false,
    reference: false,
  }

  layerKeys.forEach((layerKey) => {
    nextState[getLayerGroupKey(layerKey)] = true
  })

  return nextState
}

const getRequestedLayersFromSearch = (search: string): string[] => {
  const params = new URLSearchParams(search)
  const requestedLayers = params
    .getAll('layer')
    .map((layer) => layer.trim())
    .filter(Boolean)

  return Array.from(new Set(requestedLayers))
}

const areVisibleFeatureGroupsEqual = (
  previous: VisibleFeatureGroup[],
  next: VisibleFeatureGroup[]
) => {
  if (previous.length !== next.length) return false

  for (let index = 0; index < previous.length; index += 1) {
    const previousGroup = previous[index]
    const nextGroup = next[index]

    if (
      previousGroup.layerKey !== nextGroup.layerKey ||
      previousGroup.label !== nextGroup.label ||
      previousGroup.columns.length !== nextGroup.columns.length ||
      previousGroup.features.length !== nextGroup.features.length
    ) {
      return false
    }

    for (
      let columnIndex = 0;
      columnIndex < previousGroup.columns.length;
      columnIndex += 1
    ) {
      if (
        previousGroup.columns[columnIndex] !== nextGroup.columns[columnIndex]
      ) {
        return false
      }
    }

    for (
      let featureIndex = 0;
      featureIndex < previousGroup.features.length;
      featureIndex += 1
    ) {
      const previousFeatureId = getFeatureId(
        previousGroup.features[featureIndex]
      )
      const nextFeatureId = getFeatureId(nextGroup.features[featureIndex])
      if (previousFeatureId !== nextFeatureId) return false
    }
  }

  return true
}

export const MapView: React.FC = () => {
  useEffect(() => {
    captureEvent('feature_used', { feature: 'map' })
  }, [])

  const dataProvider = useDataProvider()
  const [exportVisibleBusy, setExportVisibleBusy] = useState(false)

  const location = useLocation()
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const piperDiagramRef = useRef<PiperDiagramHandle | null>(null)
  const initialVisibleLayers = useMemo(() => {
    const requestedLayers = getRequestedLayersFromSearch(location.search)
    return requestedLayers.length > 0 ? requestedLayers : DEFAULT_VISIBLE_LAYERS
  }, [location.search])
  const [visibleLayers, setVisibleLayers] =
    useState<string[]>(initialVisibleLayers)
  const [colorMappingByLayer, setColorMappingByLayer] = useState<
    Record<string, boolean>
  >({})
  const THING_LAYERS = useThingLayers(visibleLayers, colorMappingByLayer)
  const viewportBbox = useViewportBbox(mapRef)
  const [basemapCollapsed, setBasemapCollapsed] = useState(true)
  const [visibleFeaturesCollapsed, setVisibleFeaturesCollapsed] =
    useState(false)
  const [layersCollapsed, setLayersCollapsed] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    getExpandedGroupsForLayers(initialVisibleLayers)
  )
  const [popupContent, setPopupContent] = useState<any>(null)
  const [exportFormat, setExportFormat] = useState<'csv' | 'geojson'>('csv')
  const [selectionPolygons, setSelectionPolygons] = useState<
    Record<string, any>
  >({})
  const [visiblePointFeaturesByLayer, setVisiblePointFeaturesByLayer] =
    useState<VisibleFeatureGroup[]>([])
  const [visibleFeaturesPage, setVisibleFeaturesPage] = useState(1)
  const [selectedBasemap, setSelectedBasemap] = useState(DEFAULT_BASEMAP_ID)
  const [isPiperDrawerOpen, setIsPiperDrawerOpen] = useState(false)
  const [activePiperFeatureId, setActivePiperFeatureId] = useState<
    string | null
  >(null)
  const areDrawToolsEnabled = visibleLayers.length > 0
  const selectionFeatures = (Object.values(selectionPolygons) as any[]).filter(
    (feature) => ['Polygon', 'MultiPolygon'].includes(feature?.geometry?.type)
  )
  const hasSelectionPolygon = selectionFeatures.length > 0

  useEffect(() => {
    const requestedLayers = getRequestedLayersFromSearch(location.search)

    setVisibleLayers(
      requestedLayers.length > 0 ? requestedLayers : DEFAULT_VISIBLE_LAYERS
    )
    setExpandedGroups(
      requestedLayers.length > 0
        ? getExpandedGroupsForLayers(requestedLayers)
        : DEFAULT_EXPANDED_GROUPS
    )
  }, [location.search])

  useEffect(() => {
    if (hasSelectionPolygon || Object.keys(selectionPolygons).length === 0) {
      return
    }

    setSelectionPolygons({})
  }, [hasSelectionPolygon, selectionPolygons])

  useEffect(() => {
    if (selectionFeatures.length > 0) {
      captureEvent('map_selection_drawn', {
        polygon_count: selectionFeatures.length,
      })
    }
  }, [selectionFeatures.length])

  const exportableLayers = useMemo(
    () =>
      visibleLayers.flatMap((layerKey) => {
        const layerDef = THING_LAYERS[layerKey]
        if (!layerDef) return []

        return [
          {
            layerKey,
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
          },
        ]
      }),
    [THING_LAYERS, visibleLayers, selectionFeatures]
  )

  const visibleLayerLabels = useMemo(
    () =>
      Object.fromEntries(
        visibleLayers.map((layerKey) => [
          layerKey,
          THING_LAYERS[layerKey]?.layerProps?.label || layerKey,
        ])
      ) as Record<string, string>,
    [visibleLayers]
  )

  useEffect(() => {
    if (!viewportBbox) {
      setVisiblePointFeaturesByLayer([])
      return
    }

    let frame = 0
    let idleFrame = 0
    const map = mapRef.current?.getMap?.()

    const updateVisibleRenderedFeatures = () => {
      if (!map) {
        setVisiblePointFeaturesByLayer([])
        return
      }

      const renderedLayerIds = visibleLayers.map(
        (layerKey) => `location-${layerKey}`
      )
      if (renderedLayerIds.length === 0) {
        setVisiblePointFeaturesByLayer([])
        return
      }

      const renderedFeatures = map.queryRenderedFeatures(undefined, {
        layers: renderedLayerIds,
      })

      // Filter by selection polygons if they exist
      const filteredFeatures = filterLayerFeaturesBySelection(
        renderedFeatures,
        selectionFeatures
      )

      const grouped = new Map<
        string,
        { label: string; features: any[]; seenIds: Set<string> }
      >()

      for (const feature of filteredFeatures) {
        const renderedLayerId = String(feature?.layer?.id || '')
        if (!renderedLayerId.startsWith('location-')) continue

        const layerKey = renderedLayerId.replace(/^location-/, '')
        const featureId =
          getFeatureId(feature as any) ||
          JSON.stringify(feature.geometry || feature.properties || {})

        if (!grouped.has(layerKey)) {
          grouped.set(layerKey, {
            label: visibleLayerLabels[layerKey] || layerKey,
            features: [],
            seenIds: new Set<string>(),
          })
        }

        const group = grouped.get(layerKey)
        if (!group || group.seenIds.has(featureId)) continue

        group.seenIds.add(featureId)
        group.features.push(feature)
      }

      const nextVisibleFeatureGroups = Array.from(grouped.entries())
        .map(([layerKey, group]) => ({
          layerKey,
          label: group.label,
          features: group.features,
          columns: getSelectedPointColumns(group.features, layerKey),
        }))
        .filter(({ features }) => features.length > 0)

      setVisiblePointFeaturesByLayer((previous) =>
        areVisibleFeatureGroupsEqual(previous, nextVisibleFeatureGroups)
          ? previous
          : nextVisibleFeatureGroups
      )
    }

    const handleMapIdle = () => {
      idleFrame = window.requestAnimationFrame(updateVisibleRenderedFeatures)
    }

    frame = window.requestAnimationFrame(updateVisibleRenderedFeatures)
    map?.once?.('idle', handleMapIdle)

    return () => {
      window.cancelAnimationFrame(frame)
      window.cancelAnimationFrame(idleFrame)
      map?.off?.('idle', handleMapIdle)
    }
  }, [
    THING_LAYERS,
    viewportBbox,
    visibleLayerLabels,
    visibleLayers,
    selectionPolygons,
  ])

  const selectedMajorChemistryPoints = useMemo(
    () =>
      visiblePointFeaturesByLayer.find(
        ({ layerKey }) => layerKey === 'ogc-major-chemistry'
      )?.features || [],
    [visiblePointFeaturesByLayer]
  )
  const activeMajorChemistryFeature = useMemo(
    () =>
      selectedMajorChemistryPoints.find(
        (feature) => getFeatureId(feature) === activePiperFeatureId
      ) || null,
    [activePiperFeatureId, selectedMajorChemistryPoints]
  )
  const isMajorChemistryVisible = visibleLayers.includes('ogc-major-chemistry')

  const totalVisiblePointCount = useMemo(
    () =>
      visiblePointFeaturesByLayer.reduce(
        (sum, { features }) => sum + features.length,
        0
      ),
    [visiblePointFeaturesByLayer]
  )
  const hasVisiblePointFeatures = visiblePointFeaturesByLayer.length > 0
  const paginatedVisibleFeatureGroups = useMemo(() => {
    const flattened = visiblePointFeaturesByLayer.flatMap(
      ({ layerKey, label, columns, features }) =>
        features.map((feature, index) => ({
          entryKey: `${layerKey}-${getFeatureId(feature) || index}`,
          layerKey,
          label,
          columns,
          feature,
        }))
    )

    const pageCount = Math.max(
      1,
      Math.ceil(flattened.length / VISIBLE_FEATURES_PAGE_SIZE)
    )
    const currentPage = Math.min(visibleFeaturesPage, pageCount)
    const start = (currentPage - 1) * VISIBLE_FEATURES_PAGE_SIZE
    const pageItems = flattened.slice(start, start + VISIBLE_FEATURES_PAGE_SIZE)

    const grouped = new Map<
      string,
      { label: string; columns: string[]; items: VisibleFeaturePageItem[] }
    >()

    for (const item of pageItems) {
      if (!grouped.has(item.layerKey)) {
        grouped.set(item.layerKey, {
          label: item.label,
          columns: item.columns,
          items: [],
        })
      }

      grouped.get(item.layerKey)?.items.push(item)
    }

    return {
      pageCount,
      currentPage,
      start,
      end: Math.min(start + pageItems.length, flattened.length),
      total: flattened.length,
      groups: Array.from(grouped.entries()).map(([layerKey, group]) => ({
        layerKey,
        label: group.label,
        columns: group.columns,
        items: group.items,
      })),
    }
  }, [visibleFeaturesPage, visiblePointFeaturesByLayer])
  const hasExportableLayers = exportableLayers.length > 0
  const { ref: basemapPanelRef, height: basemapPanelHeight } =
    useMeasuredHeight<HTMLDivElement>([basemapCollapsed, selectedBasemap], 52)
  const layersPanelTop = 12 + basemapPanelHeight
  const layersPanelMaxHeight = `calc(100% - ${layersPanelTop}px - 12px)`

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
      const base = sanitizeLayerExportFilename(label)
      link.download =
        suffix === 'csv'
          ? `${base}-${localDateStampForExport()}.csv`
          : `${base}.${suffix}`
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
      buildLayerCsv(features, {
        preferredPropertyColumnOrder: buildMapExportPreferredColumnOrder(),
      }),
      'text/csv;charset=utf-8;',
      'csv',
      label,
      index
    )
  }

  const onExportVisiblePoints = async () => {
    setExportVisibleBusy(true)
    const totalFeatureCount = visiblePointFeaturesByLayer.reduce(
      (sum, { features }) => sum + features.length,
      0
    )
    try {
      const ocotillo = dataProvider('ocotillo')
      const customRequest = (args: CustomParams) => {
        if (!ocotillo.custom) {
          throw new Error('Ocotillo data provider custom method is not available')
        }
        return ocotillo.custom(args)
      }

      for (let index = 0; index < visiblePointFeaturesByLayer.length; index++) {
        const { label, features } = visiblePointFeaturesByLayer[index]
        const enriched = await enrichMapFeaturesWithWellDetails(
          features,
          customRequest
        )
        exportLayerCollection(
          {
            type: 'FeatureCollection',
            features: enriched,
          },
          label,
          exportFormat,
          index
        )
      }
      captureEvent('map_export', {
        format: exportFormat,
        scope: 'visible',
        layer_count: visiblePointFeaturesByLayer.length,
        feature_count: totalFeatureCount,
        has_selection: hasSelectionPolygon,
      })
    } catch (error) {
      captureEvent('map_export_error', {
        format: exportFormat,
        scope: 'visible',
        layer_count: visiblePointFeaturesByLayer.length,
        feature_count: totalFeatureCount,
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setExportVisibleBusy(false)
    }
  }

  const onExportLayer = () => {
    const totalFeatureCount = exportableLayers.reduce(
      (sum, { featureCollection }) =>
        sum +
        (Array.isArray(featureCollection?.features)
          ? featureCollection.features.length
          : 0),
      0
    )
    exportableLayers.forEach(({ featureCollection, label }, index) => {
      exportLayerCollection(featureCollection, label, exportFormat, index)
    })
    captureEvent('map_export', {
      format: exportFormat,
      scope: 'layer',
      layer_count: exportableLayers.length,
      feature_count: totalFeatureCount,
      has_selection: hasSelectionPolygon,
    })
  }

  const onLayerChangeWrapper =
    (layerKey: string) =>
    (_event: React.ChangeEvent<HTMLInputElement>, _checked: boolean) => {
      setVisibleLayers((prev) => {
        const wasEnabled = prev.includes(layerKey)
        const next = wasEnabled
          ? prev.filter((layer) => layer !== layerKey)
          : [...prev, layerKey]
        captureEvent('map_layer_toggled', {
          layer_key: layerKey,
          layer_label: THING_LAYERS[layerKey]?.layerProps?.label ?? layerKey,
          enabled: !wasEnabled,
          total_active_layers: next.length,
        })
        return next
      })
    }

  const onColorMappingToggle = (layerKey: string) => {
    setColorMappingByLayer((prev) => {
      const wasEnabled = prev[layerKey] ?? true
      captureEvent('map_color_mapping_toggled', {
        layer_key: layerKey,
        layer_label: THING_LAYERS[layerKey]?.layerProps?.label ?? layerKey,
        enabled: !wasEnabled,
      })
      return { ...prev, [layerKey]: !wasEnabled }
    })
  }

  const onGroupToggle = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const wasExpanded = prev[groupKey]
      captureEvent('map_layer_group_toggled', {
        group: groupKey,
        expanded: !wasExpanded,
      })
      return { ...prev, [groupKey]: !wasExpanded }
    })
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
    const distinctPoints = getDistinctMapPoints(points)
    if (distinctPoints.length > 1) {
      const map = mapRef.current?.getMap?.()
      const bounds = getMapPointBounds(distinctPoints)
      if (!map || !bounds) return

      setPopupContent(null)
      const [[west, south], [east, north]] = bounds

      // If all wells share the exact same coordinates, fitBounds cannot zoom in.
      // Perform a simple zoom centered on the shared location instead.
      if (west === east && south === north) {
        map.easeTo({
          center: [west, south],
          zoom: Math.min(map.getZoom() + 2, 18),
          duration: 500,
        })
      } else {
        // Zoom to include all distinct wells while preventing excessive zoom.
        map.fitBounds(bounds, {
          padding: 80,
          maxZoom: 18,
          duration: 500,
        })
      }
      return
    }

    const selectedPoint = distinctPoints[0]
    if (!selectedPoint) return

    const layerId = selectedPoint.layer?.id
    if (!layerId) return
    const thingType: string = String(
      selectedPoint?.properties?.thing_type || ''
    ).toLowerCase()
    const id = getFeatureId(selectedPoint)
    if (!id) return

    const layerKey = layerId.replace(/^location-/, '')
    captureEvent('map_point_clicked', {
      layer_key: layerKey,
      thing_type: thingType || 'unknown',
      thing_id: id,
    })

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
      setLayersCollapsed(false)
      return
    }

    setLayersCollapsed(true)
  }

  const onVisibleFeaturesCollapseToggle = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    event.stopPropagation()
    if (!hasVisiblePointFeatures) return
    setVisibleFeaturesCollapsed((value) => !value)
  }

  useEffect(() => {
    if (!hasVisiblePointFeatures) {
      setVisibleFeaturesCollapsed(true)
      return
    }

    setVisibleFeaturesCollapsed(false)
  }, [hasVisiblePointFeatures])

  useEffect(() => {
    setVisibleFeaturesPage(1)
  }, [viewportBbox, visibleLayers, selectionPolygons])

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
        flex: 1,
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        pb: 0,
      }}
    >
      <Box
        sx={{
          flex: 1,
          width: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          alignItems: 'stretch',
          gap: 1,
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
            height: { xs: '70dvh', lg: '100%' },
            minHeight: { xs: 360, lg: 0 },
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
              '& .maplibregl-ctrl-bottom-left, & .maplibregl-ctrl-bottom-right': {
                bottom: '6px',
              },
              '& .maplibregl-ctrl-bottom-left .maplibregl-ctrl, & .maplibregl-ctrl-bottom-right .maplibregl-ctrl':
                {
                  marginBottom: 0,
                },
            }}
          >
            <MapComponent
              mapRef={mapRef}
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
              basemapId={selectedBasemap}
              onBasemapChange={setSelectedBasemap}
            >
              {Object.entries(THING_LAYERS).map(([key, layerDef]) => {
                if (!visibleLayers.includes(key)) return null
                const { sourceProps, layerProps, textLayerProps } = layerDef
                return (
                  <Source
                    id={key}
                    key={key}
                    {...sourceProps}
                    data={sourceProps?.data as any}
                  >
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
                aria-label={
                  basemapCollapsed ? 'Expand base maps' : 'Collapse base maps'
                }
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
                  onChange={(uri) => {
                    setSelectedBasemap(uri)
                    captureEvent('map_basemap_changed', { basemap: uri })
                  }}
                />
              </Box>
            </Collapse>
          </Paper>
          <Paper
            elevation={6}
            sx={(theme) => ({
              position: 'absolute',
              top: layersPanelTop,
              bottom: 'auto',
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
              height: layersCollapsed ? 'auto' : layersPanelMaxHeight,
              maxHeight: layersCollapsed ? 'none' : layersPanelMaxHeight,
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
                  Datasets
                </Typography>
                <Box sx={{ flex: 1, minWidth: 0 }} />
                <IconButton
                  size="small"
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={onLayersCollapseToggle}
                  aria-label={
                    layersCollapsed ? 'Expand datasets' : 'Collapse datasets'
                  }
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
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                '& .MuiCollapse-wrapper': {
                  display: 'flex',
                  flexDirection: 'column',
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
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  minHeight: 0,
                }}
              >
                <Box
                  sx={(theme) => ({
                    flex: '0 0 auto',
                    px: 0.25,
                    pb: 0.35,
                    pt: 0.1,
                    backgroundColor: alpha(
                      theme.palette.background.paper,
                      0.96
                    ),
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
                          ? 'Export Datasets'
                          : 'Export Dataset'
                    }
                    disabled={!hasExportableLayers}
                    tooltipPlacement="right"
                    tooltip={
                      hasExportableLayers
                        ? `Click to download ${
                            hasSelectionPolygon
                              ? 'the selected portion of each visible dataset'
                              : visibleLayers.length > 1
                                ? 'each visible dataset'
                                : 'that dataset'
                          } as separate ${exportFormat === 'csv' ? 'CSV' : 'GeoJSON'} file${
                            visibleLayers.length > 1 || hasSelectionPolygon
                              ? 's'
                              : ''
                          }.`
                        : 'Disabled until at least one dataset is visible.'
                    }
                  />
                </Box>
                <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                  {(
                    Object.keys(groupedLayers) as Array<
                      keyof typeof groupedLayers
                    >
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
                            const description =
                              typeof layerDef.description === 'string'
                                ? layerDef.description.trim()
                                : ''
                            const hasDescription = description.length > 0

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
                                  <Tooltip
                                    title={hasDescription ? description : ''}
                                    placement="right"
                                    disableHoverListener={!hasDescription}
                                  >
                                    <ListItemText
                                      primary={layerProps.label}
                                      slotProps={{
                                        primary: {
                                          lineHeight: 1.15,
                                          fontSize: '0.75rem',
                                        },
                                      }}
                                      sx={{ m: 0, my: -0.15 }}
                                    />
                                  </Tooltip>
                                  {layerDef.colorMappingAvailable ? (
                                    <Tooltip
                                      title={
                                        layerDef.colorMappingEnabled
                                          ? 'Disable value-based color mapping'
                                          : 'Enable value-based color mapping'
                                      }
                                      placement="top"
                                    >
                                      <Button
                                        size="small"
                                        variant={
                                          layerDef.colorMappingEnabled
                                            ? 'contained'
                                            : 'outlined'
                                        }
                                        onClick={() =>
                                          onColorMappingToggle(key)
                                        }
                                        sx={{
                                          minWidth: 0,
                                          px: 0.7,
                                          py: 0.2,
                                          ml: 0.2,
                                          flexShrink: 0,
                                          fontSize: '0.65rem',
                                          lineHeight: 1,
                                        }}
                                      >
                                        Color
                                      </Button>
                                    </Tooltip>
                                  ) : null}
                                  {key === 'ogc-major-chemistry' ? (
                                    <Button
                                      size="small"
                                      variant={
                                        isPiperDrawerOpen
                                          ? 'contained'
                                          : 'outlined'
                                      }
                                      startIcon={
                                        <ScienceOutlined
                                          sx={{ fontSize: 14 }}
                                        />
                                      }
                                      onClick={() =>
                                        setIsPiperDrawerOpen((open) => {
                                          if (!open) {
                                            captureEvent(
                                              'map_piper_diagram_opened',
                                              {
                                                feature_count:
                                                  selectedMajorChemistryPoints.length,
                                              }
                                            )
                                          }
                                          return !open
                                        })
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
                                        borderColor: alpha(
                                          theme.palette.divider,
                                          0.75
                                        ),
                                        background:
                                          layerDef.legendScale.gradient,
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
                                        sx={{
                                          fontSize: '0.6rem',
                                          lineHeight: 1,
                                        }}
                                      >
                                        {layerDef.legendScale.minLabel}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontSize: '0.6rem',
                                          lineHeight: 1,
                                        }}
                                      >
                                        {layerDef.legendScale.maxLabel}
                                      </Typography>
                                    </Box>
                                  </Box>
                                )}
                                <Box sx={{ height: 2, mt: 0 }}>
                                  {isLoading && (
                                    <LinearProgress sx={{ height: 2 }} />
                                  )}
                                </Box>
                              </Box>
                            )
                          })}
                        </Collapse>
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            </Collapse>
          </Paper>
          <Drawer
            anchor="right"
            variant="persistent"
            open={isPiperDrawerOpen}
            hideBackdrop
            slotProps={{
              paper: {
                sx: (theme) => ({
                  position: 'absolute',
                  top: 12,
                  right: 12,
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
              },
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
        </Box>
        <Paper
          elevation={6}
          sx={(theme) => ({
            width: {
              xs: '100%',
              lg: VISIBLE_FEATURES_DRAWER_WIDTH,
            },
            minWidth: {
              lg: VISIBLE_FEATURES_DRAWER_WIDTH,
            },
            maxWidth: '100%',
            borderRadius: 2,
            border: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.9),
            backgroundColor: alpha(theme.palette.background.paper, 0.96),
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: { xs: '70dvh', lg: '100%' },
            maxHeight: { xs: '70dvh', lg: '100%' },
            minHeight: {
              xs: 240,
              lg: 0,
            },
          })}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: 0,
            }}
          >
            <Box
              sx={{
                px: 1,
                py: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.9,
                borderBottom:
                  visibleFeaturesCollapsed || !hasVisiblePointFeatures
                    ? 'none'
                    : '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {hasVisiblePointFeatures
                      ? `${totalVisiblePointCount} feature${totalVisiblePointCount === 1 ? '' : 's'} in view`
                      : 'No features in view'}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', display: 'block', mt: 0.15 }}
                  >
                    {hasVisiblePointFeatures
                      ? `${visiblePointFeaturesByLayer.length} dataset${visiblePointFeaturesByLayer.length === 1 ? '' : 's'} currently visible in the map extent`
                      : 'Pan or zoom the map to inspect visible features from active datasets'}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={onVisibleFeaturesCollapseToggle}
                  disabled={!hasVisiblePointFeatures}
                  aria-label={
                    visibleFeaturesCollapsed
                      ? 'Expand visible features'
                      : 'Collapse visible features'
                  }
                  sx={{ mt: 0.15 }}
                >
                  {visibleFeaturesCollapsed ? (
                    <KeyboardArrowDown fontSize="small" />
                  ) : (
                    <KeyboardArrowUp fontSize="small" />
                  )}
                </IconButton>
              </Box>
              {hasVisiblePointFeatures ? (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  useFlexGap
                  flexWrap="wrap"
                >
                  <MapExportControls
                    value={exportFormat}
                    onChange={setExportFormat}
                    onExport={() => {
                      void onExportVisiblePoints()
                    }}
                    buttonLabel="Export Visible"
                    selectorWidth={142}
                    disabled={exportVisibleBusy}
                    tooltip="Downloads one file per visible dataset. CSV and GeoJSON merge OGC properties with Ocotillo well details (full well JSON, contacts, location, and a public well detail link). Fetches the details API for each visible well id (batched)."
                  />
                  <Typography variant="caption" color="text.secondary">
                    {`${paginatedVisibleFeatureGroups.start + 1}-${paginatedVisibleFeatureGroups.end} of ${paginatedVisibleFeatureGroups.total}`}
                  </Typography>
                </Stack>
              ) : null}
            </Box>
            <Collapse
              in={hasVisiblePointFeatures && !visibleFeaturesCollapsed}
              unmountOnExit
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                '& .MuiCollapse-wrapper': {
                  display: 'flex',
                  flexDirection: 'column',
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
              <Box
                sx={{
                  px: 1,
                  pb: 0.8,
                  pt: 0.2,
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                }}
              >
                {paginatedVisibleFeatureGroups.groups.map(
                  ({ layerKey, label, items, columns }) => (
                    <Box
                      key={layerKey}
                      sx={{ mb: 0.9, '&:last-child': { mb: 0 } }}
                    >
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
                        {label} ({items.length})
                      </Typography>
                      <Stack spacing={0.55}>
                        {items.map(({ feature, entryKey }) => (
                          <VisibleFeatureCard
                            key={entryKey}
                            layerKey={layerKey}
                            feature={feature}
                            columns={columns}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )
                )}
              </Box>
            </Collapse>
            {hasVisiblePointFeatures &&
            paginatedVisibleFeatureGroups.pageCount > 1 ? (
              <Box
                sx={{
                  px: 1,
                  py: 0.8,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Pagination
                  page={paginatedVisibleFeatureGroups.currentPage}
                  count={paginatedVisibleFeatureGroups.pageCount}
                  size="small"
                  color="primary"
                  onChange={(_event, page) => setVisibleFeaturesPage(page)}
                />
              </Box>
            ) : null}
            {!hasVisiblePointFeatures ? (
              <Box sx={{ px: 1, pb: 1 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    px: 1.25,
                    py: 1.1,
                    borderStyle: 'dashed',
                    bgcolor: 'background.default',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    No visible datasets
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Turn on a dataset and move the map to an area with features
                    to populate this panel.
                  </Typography>
                </Paper>
              </Box>
            ) : null}
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

const VisibleFeatureCard = ({
  layerKey,
  feature,
  columns,
}: {
  layerKey: string
  feature: any
  columns: string[]
}) => {
  const featureTitle =
    getSelectedPointDisplayValue({ column: 'name', feature }) ||
    getFeatureId(feature) ||
    'Unnamed feature'
  const selectedDetails = columns
    .filter((column) => {
      const excludedColumns =
        EXCLUDED_VISIBLE_FEATURE_COLUMNS_BY_LAYER[layerKey] ?? []
      return !excludedColumns.includes(column)
    })
    .map((column) => ({
      label: getSelectedPointColumnLabel(column),
      value: getSelectedPointDisplayValue({ column, feature }),
    }))
    .filter(
      ({ label, value }) =>
        value && !(label === 'name' && value === featureTitle)
    )
    .slice(0, 3)
  const principalDetailConfig =
    PRINCIPAL_VISIBLE_FEATURE_DETAIL_BY_LAYER[layerKey] ?? null
  const principalDetail = principalDetailConfig
    ? {
        label: principalDetailConfig.label,
        value: getSelectedPointDisplayValue({
          column: principalDetailConfig.column,
          feature,
        }),
      }
    : null
  const principalDateDetail = principalDetailConfig?.dateColumn
    ? {
        label: getSelectedPointColumnLabel(principalDetailConfig.dateColumn),
        value: getSelectedPointDisplayValue({
          column: principalDetailConfig.dateColumn,
          feature,
        }),
      }
    : null
  const details =
    principalDetail && principalDetail.value
      ? [
          principalDetail,
          ...(principalDateDetail?.value ? [principalDateDetail] : []),
        ]
      : selectedDetails
  const titleDateDetailIndex = details.findIndex(({ label }) =>
    /date/i.test(label)
  )
  const titleDateDetail =
    titleDateDetailIndex >= 0 ? details[titleDateDetailIndex] : null
  const cardDetails = details.filter(
    (_detail, index) => index !== titleDateDetailIndex
  )
  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        borderRadius: 1.5,
        borderColor: alpha(theme.palette.divider, 0.85),
        background: `linear-gradient(180deg, ${alpha(
          theme.palette.background.paper,
          0.98
        )} 0%, ${alpha(theme.palette.background.default, 0.82)} 100%)`,
        boxShadow: `0 6px 16px ${alpha(theme.palette.common.black, 0.06)}`,
      })}
    >
      <CardContent sx={{ px: 0.9, py: 0.75, '&:last-child': { pb: 0.75 } }}>
        <Stack spacing={0.7}>
          <Box
            sx={{
              minWidth: 0,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 0.8,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                flex: 1,
                minWidth: 0,
                fontWeight: 700,
                lineHeight: 1.2,
                fontSize: '0.84rem',
                overflowWrap: 'anywhere',
              }}
            >
              {featureTitle}
            </Typography>
            {titleDateDetail ? (
              <Typography
                variant="caption"
                sx={{
                  flexShrink: 0,
                  maxWidth: '48%',
                  pt: 0.1,
                  color: 'text.secondary',
                  fontSize: '0.69rem',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  textAlign: 'right',
                  overflowWrap: 'anywhere',
                }}
              >
                {titleDateDetail.value}
              </Typography>
            ) : null}
          </Box>
          {cardDetails.length ? (
            <Box
              sx={(theme) => ({
                display: 'grid',
                gridTemplateColumns:
                  cardDetails.length === 1
                    ? '1fr'
                    : 'repeat(2, minmax(0, 1fr))',
                gap: 0.6,
                ...(cardDetails.length > 1
                  ? {
                      '& > :only-child': {
                        gridColumn: '1 / -1',
                      },
                      '& > :nth-of-type(3):last-child': {
                        gridColumn: '1 / -1',
                      },
                      [theme.breakpoints.down('sm')]: {
                        gridTemplateColumns: '1fr',
                      },
                    }
                  : {}),
              })}
            >
              {cardDetails.map(({ label, value }) => (
                <Box key={`${label}-${value}`} sx={{ minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'inline',
                      color: 'text.secondary',
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      lineHeight: 1.2,
                      textTransform: 'uppercase',
                      letterSpacing: 0.35,
                      mr: 0.5,
                    }}
                  >
                    {label}:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'inline',
                      color: 'text.primary',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      lineHeight: 1.3,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  )
}
