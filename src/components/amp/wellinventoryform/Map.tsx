import {
  useState,
  useContext,
  MutableRefObject,
  useEffect,
  forwardRef,
  memo,
} from 'react'
import { Map, Marker, NavigationControl } from 'react-map-gl'
import { convertUTMToLonLat } from '@/utils/UtmToLonLat'
import { settings } from '@/settings'
import { ColorModeContext } from '@/contexts'

const InnerMapComponent = forwardRef(
  (
    {
      x,
      y,
      coordinateType,
      utmZone,
      updateMapView,
    }: {
      x: number
      y: number
      coordinateType: 'utm' | 'gcs'
      utmZone: number
      updateMapView: (longitude: number, latitude: number) => void
    },
    ref: MutableRefObject<any>
  ) => {
    const initialViewState = {
      longitude: -106.4,
      latitude: 34.5,
      zoom: 6,
    }

    const [viewState, setViewState] = useState(initialViewState)

    const style = { width: '100%', height: '650px' }

    const { mode } = useContext(ColorModeContext)
    const mapStyle =
      mode === 'dark'
        ? 'mapbox://styles/mapbox/dark-v10'
        : 'mapbox://styles/mapbox/light-v10'

    const coordinates =
      coordinateType === 'utm' && utmZone
        ? convertUTMToLonLat(x, y, utmZone)
        : [x, y]

    const [longitude, latitude] = coordinates

    useEffect(() => {
      if (longitude && latitude) {
        setViewState((prevState) => ({
          ...prevState,
          longitude,
          latitude,
        }))
        updateMapView(longitude, latitude)
      }
    }, [x, y, coordinateType, utmZone, updateMapView])

    return (
      <Map
        {...viewState}
        ref={ref}
        scrollZoom={false}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={settings.mapboxToken}
        initialViewState={initialViewState}
        terrain={{ source: 'mapbox-dem', exaggeration: 3 }}
        style={style}
        mapStyle={mapStyle}
      >
        <NavigationControl position="top-right" />
        {typeof x === 'number' &&
          typeof y === 'number' &&
          !isNaN(x) &&
          !isNaN(y) && (
            <Marker
              {...(() => {
                if (coordinateType === 'utm' && utmZone) {
                  const [lon, lat] = convertUTMToLonLat(x, y, utmZone)
                  return { longitude: lon, latitude: lat }
                } else if (coordinateType === 'gcs') {
                  const [longitude, latitude] = [x, y]
                  if (
                    longitude < -180 ||
                    longitude > 180 ||
                    latitude < -90 ||
                    latitude > 90
                  ) {
                    console.error('Invalid GCS coordinates:', {
                      longitude,
                      latitude,
                    })
                    return {
                      longitude: undefined,
                      latitude: undefined,
                    }
                  }
                }
                return { longitude: x, latitude: y }
              })()}
              anchor="bottom"
            >
              <div
                style={{
                  width: 15,
                  height: 15,
                  borderRadius: '50%',
                  backgroundColor: 'red',
                  border: '2px solid white',
                }}
              />
            </Marker>
          )}
      </Map>
    )
  }
)

export default memo(InnerMapComponent)
