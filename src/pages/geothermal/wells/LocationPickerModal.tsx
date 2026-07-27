import { useState } from 'react'
import { Map, Marker, type MapLayerMouseEvent } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin } from 'lucide-react'
import { settings } from '@/settings'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatCoord } from './inventoryFields'

interface LocationPickerModalProps {
  /** Current latitude, if any (recenters + preloads the pin). */
  lat: number | null
  /** Current longitude, if any. */
  lon: number | null
  onConfirm: (lat: number, lon: number) => void
  onClose: () => void
}

// Default view: roughly centered on New Mexico.
const NM_VIEW = { longitude: -106, latitude: 34.4, zoom: 5.5 }

/**
 * Modal map for picking a well's location. Click the map to drop/move a pin;
 * confirming returns its latitude/longitude. Rendered per row (mount it keyed
 * by row so it opens fresh with that row's current coordinates).
 */
export function LocationPickerModal({
  lat,
  lon,
  onConfirm,
  onClose,
}: LocationPickerModalProps) {
  const [pin, setPin] = useState<{ lat: number; lon: number } | null>(
    lat != null && lon != null ? { lat, lon } : null
  )

  const initialViewState = pin
    ? { longitude: pin.lon, latitude: pin.lat, zoom: 10 }
    : NM_VIEW

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Pick location</DialogTitle>
        </DialogHeader>

        <div className="h-[440px] w-full overflow-hidden rounded-md border">
          <Map
            mapboxAccessToken={settings.mapboxToken}
            initialViewState={initialViewState}
            mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
            style={{ width: '100%', height: '100%' }}
            onClick={(e: MapLayerMouseEvent) =>
              setPin({ lat: e.lngLat.lat, lon: e.lngLat.lng })
            }
          >
            {pin && (
              <Marker longitude={pin.lon} latitude={pin.lat} anchor="bottom">
                <MapPin className="size-6 fill-red-500 text-red-700" />
              </Marker>
            )}
          </Map>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {pin
              ? `${formatCoord(pin.lat)}, ${formatCoord(pin.lon)}`
              : 'Click the map to drop a pin.'}
          </span>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!pin}
              onClick={() => pin && onConfirm(pin.lat, pin.lon)}
            >
              Use this location
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
