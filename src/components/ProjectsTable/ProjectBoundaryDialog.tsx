import { useEffect, useMemo, useRef, useState } from 'react'
import { Layer, type MapRef, Source } from 'react-map-gl/maplibre'
import wellknown from 'wellknown'
import MapComponent from '@/components/MapComponent'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { IGroup } from '@/interfaces/ocotillo/IGroup'

/**
 * Read-only look at one project's boundary. The project show page pairs the
 * boundary with the project's wells; this is the quick check from the list, so
 * it draws the geometry alone and fits the view to it.
 */

type Position = number[]

function parseBoundary(
  projectArea: IGroup['project_area']
): GeoJSON.Geometry | null {
  if (!projectArea) return null

  if (typeof projectArea !== 'string') {
    return projectArea as GeoJSON.Geometry
  }

  try {
    return wellknown.parse(projectArea) as GeoJSON.Geometry | null
  } catch {
    return null
  }
}

/** Walks arbitrarily nested coordinate arrays so any geometry type works. */
function collectPositions(coordinates: unknown, into: Position[]): void {
  if (!Array.isArray(coordinates)) return

  if (typeof coordinates[0] === 'number') {
    into.push(coordinates as Position)
    return
  }

  for (const entry of coordinates) {
    collectPositions(entry, into)
  }
}

function boundsOf(
  geometry: GeoJSON.Geometry
): [[number, number], [number, number]] | null {
  const positions: Position[] = []
  collectPositions(
    (geometry as { coordinates?: unknown }).coordinates,
    positions
  )

  if (positions.length === 0) return null

  const lons = positions.map(([lon]) => lon)
  const lats = positions.map(([, lat]) => lat)

  return [
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  ]
}

export function ProjectBoundaryDialog({
  project,
  onClose,
}: {
  project: IGroup | null
  onClose: () => void
}) {
  const mapRef = useRef<MapRef>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  const boundary = useMemo(
    () => parseBoundary(project?.project_area),
    [project?.project_area]
  )
  const bounds = useMemo(
    () => (boundary ? boundsOf(boundary) : null),
    [boundary]
  )

  const isOpen = Boolean(project)

  useEffect(() => {
    if (!isOpen) setIsMapLoaded(false)
  }, [isOpen])

  // The map mounts while the dialog is still animating open, so it can report
  // ready at the wrong size. Resize and fit again once the dialog has settled.
  useEffect(() => {
    if (!isMapLoaded || !bounds || !mapRef.current) return

    const fit = () => {
      const map = mapRef.current?.getMap()
      if (!map) return
      map.resize()
      map.fitBounds(bounds, { padding: 48, maxZoom: 12, duration: 0 })
    }

    fit()
    const timer = setTimeout(fit, 150)
    return () => clearTimeout(timer)
  }, [bounds, isMapLoaded])

  const [[west, south], [east, north]] = bounds ?? [
    [-109, 31],
    [-103, 37],
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{project?.name ?? 'Project'}</DialogTitle>
          <DialogDescription>
            {project?.group_type
              ? `${project.group_type} boundary`
              : 'Project boundary'}
          </DialogDescription>
        </DialogHeader>

        {boundary ? (
          <div
            ref={containerRef}
            data-testid="project-boundary-map"
            className="relative flex h-[60vh] max-h-[520px] w-full overflow-hidden rounded-md border"
          >
            <MapComponent
              mapRef={mapRef}
              containerRef={containerRef}
              style={{ flex: 1, width: '100%', height: '100%' }}
              initialViewState={{
                longitude: (west + east) / 2,
                latitude: (south + north) / 2,
                zoom: 7,
              }}
              onLoad={() => setIsMapLoaded(true)}
            >
              <Source id="project-area" type="geojson" data={boundary}>
                <Layer
                  type="fill"
                  id="project-area-fill"
                  paint={{ 'fill-color': '#007bff', 'fill-opacity': 0.2 }}
                />
                <Layer
                  type="line"
                  id="project-area-outline"
                  paint={{ 'line-color': '#007bff', 'line-width': 2 }}
                />
              </Source>
            </MapComponent>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            This project has no boundary geometry.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
