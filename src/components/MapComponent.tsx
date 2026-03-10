import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Map, MapRef, NavigationControl, Popup } from 'react-map-gl'
import { MapboxStyleSwitcherControl } from 'mapbox-gl-style-switcher'
import { ControlPosition } from 'react-map-gl'
import { CircularProgress } from '@mui/material'

import type { MapLayerMouseEvent, MapGeoJSONFeature } from 'react-map-gl'

import DrawControl from './DrawControl'

import { settings } from '@/settings'

import { ColorModeContext } from '@/contexts'
import {
  DEFAULT_MAPBOX_BASEMAP,
  MAPBOX_BASEMAPS,
  THEMED_MAPBOX_BASEMAPS,
} from '@/constants'

import 'mapbox-gl/dist/mapbox-gl.css'
import 'mapbox-gl-style-switcher/styles.css'

type SelectionPolygons = Record<string, any>

interface MapComponentProps {
  children?: any
  onClick?: any
  onPointClick?: (e: any, features: any[]) => void
  setSelectionPolygons?: any
  popupContent?: any
  setPopupContent?: any
  onMouseMoveCallback?: any
  showDrawControls?: { show: boolean; position?: ControlPosition }
  showNavigation?: { show: boolean; position?: ControlPosition }
  isLoading?: boolean
  mapRef?: any

  initialViewState?: {
    longitude: number
    latitude: number
    zoom: number
    bearing?: number
    pitch?: number
  }
  style?: React.CSSProperties
  containerRef?: any
}

export const MapComponent = ({
  mapRef: externalMapRef,
  children,
  onClick,
  onPointClick,
  popupContent,
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
  style = { width: '100%', height: '100%' },
  containerRef,
}: MapComponentProps) => {
  const { mode } = useContext(ColorModeContext)
  const [isDrawing, setIsDrawing] = useState(false)
  const [_viewState, setViewState] = useState(initialViewState)
  const [selectedBasemap, setSelectedBasemap] = useState(DEFAULT_MAPBOX_BASEMAP)
  const mapRef = externalMapRef ?? useRef<MapRef>(null)
  const previousModeRef = useRef<'light' | 'dark'>(
    mode === 'dark' ? 'dark' : 'light'
  )

  const syncStyleSwitcherSelection = useCallback((styleUri: string) => {
    if (!mapRef.current) return

    const mapContainer = mapRef.current.getMap().getContainer()
    const activeButtons = mapContainer.querySelectorAll(
      '.mapboxgl-style-list button.active'
    )
    activeButtons.forEach((button) => button.classList.remove('active'))

    const nextButton = mapContainer.querySelector(
      `.mapboxgl-style-list button[data-uri='${JSON.stringify(styleUri)}']`
    ) as HTMLButtonElement | null
    nextButton?.classList.add('active')
  }, [mapRef])

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

  const handleMapLoad = useCallback(() => {
    if (!mapRef.current) return
    const map = mapRef.current.getMap()

    // Prevent duplicates if map reloads or component re-renders
    if ((map as any)._styleSwitcherAdded) return
    ;(map as any)._styleSwitcherAdded = true

    const styleSwitcher = new MapboxStyleSwitcherControl(MAPBOX_BASEMAPS, {
      defaultStyle: THEMED_MAPBOX_BASEMAPS.light.title,
      eventListeners: {
        onChange: (_event: Event, nextStyle: string) => {
          setSelectedBasemap(nextStyle)
          return false
        },
      },
    })

    map.addControl(styleSwitcher, 'top-right')
    syncStyleSwitcherSelection(selectedBasemap)

    map.on('remove', () => {
      try {
        map.removeControl(styleSwitcher)
        ;(map as any)._styleSwitcherAdded = false
      } catch (err) {
        console.warn('Map style switcher already removed.')
      }
    })
  }, [mapRef, selectedBasemap, syncStyleSwitcherSelection])

  useEffect(() => {
    const previousMode = previousModeRef.current
    const nextMode = mode === 'dark' ? 'dark' : 'light'

    if (!mapRef.current || previousMode === nextMode) {
      previousModeRef.current = nextMode
      return
    }

    const currentThemedBasemap = THEMED_MAPBOX_BASEMAPS[previousMode].uri
    const nextThemedBasemap = THEMED_MAPBOX_BASEMAPS[nextMode].uri

    if (selectedBasemap === currentThemedBasemap) {
      mapRef.current.getMap().setStyle(nextThemedBasemap)
      setSelectedBasemap(nextThemedBasemap)
      syncStyleSwitcherSelection(nextThemedBasemap)
    }

    previousModeRef.current = nextMode
  }, [mode, selectedBasemap, mapRef, syncStyleSwitcherSelection])

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
    if (!mapRef?.current || isDrawing) return

    const features: MapGeoJSONFeature[] = getCurrentPoints(e)
    if (onMouseMoveCallback) {
      onMouseMoveCallback(e, features, mapRef)
    }
  }

  const onModeChange = useCallback((e: any) => {
    setIsDrawing(e.mode === 'draw_polygon')
  }, [])

  const onSelectionChange = useCallback((e: any) => {
    setIsDrawing(e.features.length > 0)
  }, [])

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
      mapboxAccessToken={settings.mapboxToken}
      initialViewState={initialViewState}
      terrain={{ source: 'mapbox-dem', exaggeration: 3 }}
      onClick={handleMouseClick}
      onMove={(evt) => setViewState(evt.viewState)}
      onMouseMove={onMouseMove}
      onLoad={handleMapLoad}
      style={style}
      mapStyle={selectedBasemap}
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
            combine_features: true,
            uncombine_features: true,
          }}
          onCreate={onUpdate}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onModeChange={onModeChange}
          onSelectionChange={onSelectionChange}
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
