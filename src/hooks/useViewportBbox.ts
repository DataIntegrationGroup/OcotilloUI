import { useEffect, useMemo, useState } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'

export type ViewportBboxOptions = {
  /** debounce updates while the user is moving the map */
  debounceMs?: number
  /** round coords to reduce query churn */
  precision?: number
}

const round = (value: number, precision: number) => {
  const p = 10 ** precision
  return Math.round(value * p) / p
}

/**
 * Returns a `bbox` string suitable for OGC API: `minLon,minLat,maxLon,maxLat`.
 * Uses the passed `mapRef` (react-map-gl).
 */
export const useViewportBbox = (
  mapRef: React.RefObject<MapRef | null>,
  { debounceMs = 350, precision = 4 }: ViewportBboxOptions = {}
) => {
  const [bbox, setBbox] = useState<string | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let animationFrame: number | undefined
    let detachListeners: (() => void) | undefined
    let cancelled = false

    const attach = () => {
      const map = mapRef.current?.getMap()
      if (!map) {
        if (!cancelled) {
          animationFrame = window.requestAnimationFrame(attach)
        }
        return
      }

      const update = () => {
        const bounds = map.getBounds()
        if (!bounds) return

        const west = round(bounds.getWest(), precision)
        const south = round(bounds.getSouth(), precision)
        const east = round(bounds.getEast(), precision)
        const north = round(bounds.getNorth(), precision)

        setBbox(`${west},${south},${east},${north}`)
      }

      const schedule = () => {
        if (timer) clearTimeout(timer)
        timer = setTimeout(update, debounceMs)
      }

      update()

      map.on('moveend', schedule)
      map.on('zoomend', schedule)
      map.on('dragend', schedule)
      map.on('load', update)

      detachListeners = () => {
        map.off('moveend', schedule)
        map.off('zoomend', schedule)
        map.off('dragend', schedule)
        map.off('load', update)
      }
    }

    attach()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
      detachListeners?.()
    }
  }, [mapRef, debounceMs, precision])

  return useMemo(() => bbox, [bbox])
}
