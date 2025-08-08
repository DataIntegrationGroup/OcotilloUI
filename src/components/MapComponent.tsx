import React, { useCallback, useContext, useRef, useState } from 'react'
import { Map, MapRef, NavigationControl, Popup } from 'react-map-gl'
import { ColorModeContext } from '@/contexts'
import DrawControl from './DrawControl'
import 'mapbox-gl/dist/mapbox-gl.css'
import GeocoderControl from './GeocoderControl'
import { ControlPosition } from 'react-map-gl'
import { CircularProgress } from '@mui/material'
import { settings } from '@/settings'

export const getMapStyle = (mode: string, zoom: number) => {
  return zoom > 10
    ? 'mapbox://styles/mapbox/satellite-streets-v12'
    : mode === 'dark'
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11'
}

interface MapComponentProps {
  children?: any
  onClick?: any
  setSelectionPolygons?: any
  popupContent?: any
  setPopupContent?: any
  onMouseMoveCallback?: any
  showDrawControls?: { show: boolean; position?: ControlPosition }
  showNavigation?: { show: boolean; position?: ControlPosition }
  showGeocoder?: { show: boolean; position?: ControlPosition }
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
}

export const MapComponent: React.FC<MapComponentProps> = ({
  mapRef,
  children,
  onClick,
  popupContent,
  onMouseMoveCallback,
  setSelectionPolygons,
  isLoading = false,
  initialViewState,
  showDrawControls = {
    show: true,
    position: 'top-right' as ControlPosition,
  },
  showNavigation = {
    show: true,
    position: 'top-right' as ControlPosition,
  },
  showGeocoder = {
    show: true,
    position: 'top-left' as ControlPosition,
  },
  style = { width: '100%', height: '650px' },
}) => {
  const { mode } = useContext(ColorModeContext)
  const [isDrawing, setIsDrawing] = useState(false)

  if (mapRef === undefined) {
    mapRef = useRef<MapRef>(null)
  }
  if (!initialViewState) {
    initialViewState = {
      longitude: -106.4,
      latitude: 34.5,
      zoom: 6,
    }
  }
  const [viewState, setViewState] = useState(initialViewState)

  const getCurrentPoints = (e) => {
    if (!mapRef || !mapRef.current) {
      return [[]]
    }

    let features = mapRef.current.queryRenderedFeatures(e.point)
    return features.filter((f) => f.type === 'Feature')
  }

  const onUpdate = useCallback((e) => {
    if (!setSelectionPolygons) {
      return
    }

    setSelectionPolygons((currFeatures) => {
      const newFeatures = { ...currFeatures }
      for (const f of e.features) {
        newFeatures[f.id] = f
      }
      return newFeatures
    })
  }, [])

  const onDelete = useCallback((e) => {
    if (!setSelectionPolygons) {
      return
    }
    setSelectionPolygons((currFeatures) => {
      const newFeatures = { ...currFeatures }
      for (const f of e.features) {
        delete newFeatures[f.id]
      }
      return newFeatures
    })
  }, [])

  const onMouseMove = (e) => {
    if (mapRef === undefined) {
      return
    }

    if (isDrawing === true) {
      return
    }

    const features = getCurrentPoints(e)
    if (onMouseMoveCallback !== undefined) {
      onMouseMoveCallback(e, features, mapRef)
    }
  }

  const onModeChange = useCallback((e) => {
    setIsDrawing(e.mode === 'draw_polygon')
  }, [])

  const onSelectionChange = useCallback((e) => {
    setIsDrawing(e.features.length > 0)
  }, [])

  return (
    <div>
      <Map
        ref={mapRef}
        mapboxAccessToken={settings.mapboxToken}
        initialViewState={initialViewState}
        onClick={onClick}
        onMove={(evt) => setViewState(evt.viewState)}
        terrain={{ source: 'mapbox-dem', exaggeration: 3 }}
        style={style}
        mapStyle={getMapStyle(mode, viewState.zoom)}
        onMouseMove={onMouseMove}
      >
        {showGeocoder?.show && (
          <GeocoderControl
            token={settings.mapboxToken}
            position={showGeocoder?.position}
          />
        )}
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
          >
            {popupContent.children}
          </Popup>
        )}
        {isLoading && <CircularProgress />}
        {children}
      </Map>
    </div>
  )
}

export default MapComponent
