import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Map, MapRef, NavigationControl, Popup } from 'react-map-gl/maplibre'
import { ControlPosition } from 'react-map-gl/maplibre'
import { CircularProgress } from '@mui/material'

import type {
  MapLayerMouseEvent,
  MapGeoJSONFeature,
} from 'react-map-gl/maplibre'

import DrawControl from './DrawControl'

import { ColorModeContext } from '@/contexts'
import {
  DEFAULT_BASEMAP_ID,
  THEMED_BASEMAP_IDS,
  getBasemapStyle,
} from '@/basemaps'

import 'maplibre-gl/dist/maplibre-gl.css'

type SelectionPolygons = Record<string, any>

interface MapComponentProps {
  children?: any
  onClick?: any
  onPointClick?: (e: any, features: any[]) => void
  onBoundsChange?: (bbox: string | null) => void
  setSelectionPolygons?: any
  popupContent?: any
  setPopupContent?: any
  onMouseMoveCallback?: any
  showDrawControls?: {
    show: boolean
    position?: ControlPosition
    disabled?: boolean
  }
  showNavigation?: { show: boolean; position?: ControlPosition }
  isLoading?: boolean
  mapRef?: any
  basemapId?: string
  onBasemapChange?: (nextBasemapId: string) => void

  initialViewState?:
    | {
        longitude: number
        latitude: number
        zoom: number
        bearing?: number
        pitch?: number
      }
    // react-map-gl also frames the initial camera from a bounding box, letting
    // a caller open the map already fitted to its data without a follow-up
    // animation. Forwarded straight to <Map initialViewState>.
    | {
        bounds: [[number, number], [number, number]]
        fitBoundsOptions?: { padding?: number; maxZoom?: number }
      }
  style?: React.CSSProperties
  containerRef?: any
}

export const MapComponent = ({
  mapRef: externalMapRef,
  children,
  onClick,
  onPointClick,
  onBoundsChange,
  popupContent,
  setPopupContent,
  onMouseMoveCallback,
  setSelectionPolygons,
  isLoading = false,
  initialViewState,
  showDrawControls = {
    show: false,
    position: 'top-right' as ControlPosition,
  },
  showNavigation = {
    show: true,
    position: 'top-right' as ControlPosition,
  },
  basemapId = DEFAULT_BASEMAP_ID,
  onBasemapChange,
  style = { width: '100%', height: '100%' },
  containerRef,
}: MapComponentProps) => {
  const { mode } = useContext(ColorModeContext)
  const [activeDrawMode, setActiveDrawMode] = useState<string | null>(null)
  const [_viewState, setViewState] = useState(initialViewState)
  const internalMapRef = useRef<MapRef>(null)
  const mapRef = externalMapRef ?? internalMapRef
  const previousModeRef = useRef<'light' | 'dark'>(
    mode === 'dark' ? 'dark' : 'light'
  )
  const isDrawInteractionActive =
    activeDrawMode === 'draw_polygon' ||
    activeDrawMode === 'draw_rectangle' ||
    activeDrawMode === 'draw_rectangle_edit'
  const isRectangleDrawInteractionActive =
    activeDrawMode === 'draw_rectangle' ||
    activeDrawMode === 'draw_rectangle_edit'

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver(() => {
      // Force Mapbox to recalc size when container changes
      if (mapRef?.current) {
        mapRef.current.resize()
      }
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [mapRef])

  useEffect(() => {
    const previousMode = previousModeRef.current
    const nextMode = mode === 'dark' ? 'dark' : 'light'

    if (!mapRef.current || previousMode === nextMode) {
      previousModeRef.current = nextMode
      return
    }

    const currentThemedBasemap = THEMED_BASEMAP_IDS[previousMode]
    const nextThemedBasemap = THEMED_BASEMAP_IDS[nextMode]

    if (basemapId === currentThemedBasemap) {
      onBasemapChange?.(nextThemedBasemap)
    }

    previousModeRef.current = nextMode
  }, [mode, basemapId, mapRef, onBasemapChange])

  useEffect(() => {
    if (!isRectangleDrawInteractionActive || !setPopupContent) return

    setPopupContent(null)
  }, [isRectangleDrawInteractionActive, setPopupContent])

  if (!initialViewState) {
    initialViewState = {
      longitude: -106.4,
      latitude: 34.5,
      zoom: 5.85,
    }
  }

  const getCurrentPoints = (e: MapLayerMouseEvent): MapGeoJSONFeature[] => {
    if (!mapRef?.current) return []

    const features = mapRef.current.queryRenderedFeatures(e.point)
    return features.filter(
      (f: MapGeoJSONFeature): f is MapGeoJSONFeature => f.type === 'Feature'
    )
  }

  const onUpdate = useCallback(
    (e: any) => {
      if (!setSelectionPolygons) return

      setSelectionPolygons((currFeatures: Record<string, any>) => {
        const newFeatures = { ...currFeatures }
        for (const f of e.features) {
          newFeatures[f.id as string] = f
        }
        return newFeatures
      })
    },
    [setSelectionPolygons]
  )

  const onDelete = useCallback(
    (e: any) => {
      if (!setSelectionPolygons) return

      setSelectionPolygons((currFeatures: SelectionPolygons) => {
        const newFeatures = { ...currFeatures }
        for (const f of e.features) {
          delete newFeatures[f.id as string]
        }
        return newFeatures
      })
    },
    [setSelectionPolygons]
  )

  const onMouseMove = (e: MapLayerMouseEvent) => {
    if (!mapRef?.current || isDrawInteractionActive) return

    const features: MapGeoJSONFeature[] = getCurrentPoints(e)
    if (onMouseMoveCallback) {
      onMouseMoveCallback(e, features, mapRef)
    }
  }

  useEffect(() => {
    const mapInstance = mapRef.current?.getMap()
    if (!mapInstance) return

    if (
      activeDrawMode === 'draw_polygon' ||
      activeDrawMode === 'draw_rectangle' ||
      activeDrawMode === 'draw_rectangle_edit'
    ) {
      return
    }

    const canvas = mapInstance.getCanvas()
    const canvasContainer = mapInstance.getCanvasContainer()
    const setGrabCursor = () => {
      canvas.style.cursor = 'grab'
      canvasContainer.style.cursor = 'grab'
    }
    const setGrabbingCursor = (event?: PointerEvent) => {
      if (event && event.button !== 0) return
      canvas.style.cursor = 'grabbing'
      canvasContainer.style.cursor = 'grabbing'
    }

    const resetCursor = () => {
      canvas.style.cursor = 'grab'
      canvasContainer.style.cursor = 'grab'
    }

    setGrabCursor()
    canvasContainer.addEventListener('pointerdown', setGrabbingCursor)
    window.addEventListener('pointerup', resetCursor)
    window.addEventListener('pointercancel', resetCursor)
    canvasContainer.addEventListener('pointerleave', resetCursor)

    return () => {
      canvasContainer.removeEventListener('pointerdown', setGrabbingCursor)
      window.removeEventListener('pointerup', resetCursor)
      window.removeEventListener('pointercancel', resetCursor)
      canvasContainer.removeEventListener('pointerleave', resetCursor)
      if (!isDrawInteractionActive) {
        canvas.style.cursor = 'grab'
        canvasContainer.style.cursor = 'grab'
      }
    }
  }, [activeDrawMode, isDrawInteractionActive, mapRef])

  const onModeChange = useCallback((e: any) => {
    setActiveDrawMode(e.mode ?? null)
  }, [])

  const onSelectionChange = useCallback(() => {}, [])

  const emitBoundsChange = useCallback(() => {
    const bounds = mapRef.current?.getMap?.()?.getBounds?.()
    if (!bounds) {
      onBoundsChange?.(null)
      return
    }

    onBoundsChange?.(
      [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ].join(',')
    )
  }, [mapRef, onBoundsChange])

  const handleMouseClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (onPointClick) {
        const currentPoints: MapGeoJSONFeature[] = getCurrentPoints(e)
        if (currentPoints.length > 0) {
          onPointClick(e, currentPoints)
        }
      }

      if (onClick) {
        onClick(e)
      }
    },
    [onClick, onPointClick]
  )

  return (
    <Map
      ref={mapRef}
      initialViewState={initialViewState}
      onClick={handleMouseClick}
      onLoad={emitBoundsChange}
      onMove={(evt) => {
        setViewState(evt.viewState)
        emitBoundsChange()
      }}
      onMouseMove={onMouseMove}
      // Style, tile, and glyph failures are otherwise silent — the map just
      // renders empty. Surface them so a broken basemap source is diagnosable.
      onError={(event) => console.error('Map error:', event.error)}
      style={style}
      mapStyle={getBasemapStyle(basemapId)}
    >
      {showNavigation?.show && (
        <NavigationControl position={showNavigation?.position} />
      )}
      {showDrawControls?.show && (
        <DrawControl
          displayControlsDefault={false}
          controls={{
            polygon: true,
            trash: true,
          }}
          onCreate={onUpdate}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onModeChange={onModeChange}
          onSelectionChange={onSelectionChange}
          disabled={showDrawControls?.disabled}
          position={showDrawControls?.position}
        />
      )}
      {popupContent !== undefined && popupContent !== null && (
        <Popup
          latitude={popupContent.coordinates[1]}
          longitude={popupContent.coordinates[0]}
          closeButton={false}
          closeOnClick
          maxWidth={popupContent.maxWidth}
        >
          {popupContent.children}
        </Popup>
      )}
      {isLoading && <CircularProgress />}
      {children}
    </Map>
  )
}

export default MapComponent
