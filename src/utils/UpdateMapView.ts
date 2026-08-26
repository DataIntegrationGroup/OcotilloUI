import { MapRef } from 'react-map-gl/maplibre'

export const updateMapView = (
  map: MapRef | null,
  longitude: number,
  latitude: number
) => {
  if (map) {
    const currentZoom = map.getZoom()

    map.easeTo({
      center: [longitude, latitude],
      zoom: currentZoom,
      duration: 1500,
      easing: (t: number) => t * (2 - t), // Smooth easing function
    })
  }
}
