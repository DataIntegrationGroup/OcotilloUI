// Diver-HUB (VanEssen GroundwaterOnline) API client, built from the
// published swagger at https://diver-hub.com/api/swagger/v1/swagger.json.
//
// The API exposes locations (grouped by project, each with monitoring
// points) and per-monitoring-point water levels in two frames:
//   - WaterLevelGs:  { ts, gs }  — level relative to ground surface
//   - WaterLevelVrd: { ts, vrd } — level relative to a vertical reference
//     datum, with groundSurfaceData giving the ground-surface elevation in
//     that same datum over time
// Every response is wrapped in { status, message, ... } where status echoes
// an HTTP-style code (200/400/403/404).
import { settings } from '@/settings'

export interface DiverHubMonitoringPointInfo {
  id: number
  name: string
  isActive: boolean
}

export interface DiverHubLocation {
  projectName: string
  id: number
  uid: string | null
  name: string
  isActive: boolean
  monitoringPoints: DiverHubMonitoringPointInfo[]
}

export interface DiverHubWaterLevels {
  approvedGs: Array<{ ts: number; gs: number }>
  unApprovedGs: Array<{ ts: number; gs: number }>
  approvedVrd: Array<{ ts: number; vrd: number }>
  unApprovedVrd: Array<{ ts: number; vrd: number }>
  groundSurface: Array<{ fromDate: string; elevation: number }>
}

interface DiverHubEnvelope {
  status: number
  message?: string
}

export const isDiverHubConfigured = () => Boolean(settings.diverhub.api_url)

const diverHubFetch = async (path: string, params?: URLSearchParams) => {
  const url = `${settings.diverhub.api_url}${path}${params?.size ? `?${params}` : ''}`
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      ...(settings.diverhub.api_key
        ? { Authorization: `Bearer ${settings.diverhub.api_key}` }
        : {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Diver-HUB request failed with status ${response.status}.`)
  }

  const body = (await response.json()) as DiverHubEnvelope
  if (body.status !== 200) {
    throw new Error(
      body.message ||
        `Diver-HUB responded with status ${body.status} for ${path}.`
    )
  }

  return body
}

export const fetchDiverHubLocations = async (
  projectName?: string
): Promise<DiverHubLocation[]> => {
  const path = projectName
    ? `/locations/${encodeURIComponent(projectName)}`
    : '/locations'
  const body = (await diverHubFetch(path)) as DiverHubEnvelope & {
    locations?: Array<Partial<DiverHubLocation>>
  }

  return (body.locations ?? [])
    .filter((location) => location?.name)
    .map((location) => ({
      projectName: location.projectName ?? '',
      id: Number(location.id),
      uid: location.uid ?? null,
      name: String(location.name),
      isActive: Boolean(location.isActive),
      monitoringPoints: (location.monitoringPoints ?? []).map((point) => ({
        id: Number(point.id),
        name: point.name ?? `Monitoring point ${point.id}`,
        isActive: Boolean(point.isActive),
      })),
    }))
}

export const fetchDiverHubWaterLevels = async ({
  projectName,
  monitoringPointId,
  fromDate,
  toDate,
}: {
  projectName: string
  monitoringPointId: number
  fromDate?: Date | null
  toDate?: Date | null
}): Promise<DiverHubWaterLevels> => {
  const params = new URLSearchParams()
  if (fromDate) params.set('fromDate', fromDate.toISOString())
  if (toDate) params.set('toDate', toDate.toISOString())

  const body = (await diverHubFetch(
    `/monitoringPoint/${encodeURIComponent(projectName)}/${monitoringPointId}`,
    params
  )) as DiverHubEnvelope & {
    approvedWaterLevelsGs?: Array<{ ts: number; gs: number }>
    unApprovedWaterLevelsGs?: Array<{ ts: number; gs: number }>
    approvedWaterLevelsVrd?: Array<{ ts: number; vrd: number }>
    unApprovedWaterLevelsVrd?: Array<{ ts: number; vrd: number }>
    groundSurfaceData?: Array<{ fromDate: string; elevation: number }>
  }

  return {
    approvedGs: body.approvedWaterLevelsGs ?? [],
    unApprovedGs: body.unApprovedWaterLevelsGs ?? [],
    approvedVrd: body.approvedWaterLevelsVrd ?? [],
    unApprovedVrd: body.unApprovedWaterLevelsVrd ?? [],
    groundSurface: body.groundSurfaceData ?? [],
  }
}

// ts is an int64 epoch with unspecified units; values past ~2001 in
// milliseconds exceed 1e12, so anything smaller is treated as seconds.
const epochToDate = (ts: number) => new Date(ts > 1e12 ? ts : ts * 1000)

// Convert Diver-HUB water levels to depth to water below ground surface.
// The gs frame is preferred: gs is the level relative to ground surface
// (negative below ground), so DTW = -gs. When only the vrd frame is
// present, DTW = ground-surface elevation (the entry in effect at the
// reading's time) - vrd.
export const toDepthToWaterPoints = (
  levels: DiverHubWaterLevels,
  { includeUnapproved = false }: { includeUnapproved?: boolean } = {}
) => {
  const gsReadings = [
    ...levels.approvedGs,
    ...(includeUnapproved ? levels.unApprovedGs : []),
  ]

  if (gsReadings.length > 0) {
    return gsReadings
      .map((reading) => ({
        time: epochToDate(reading.ts),
        value: Number((-reading.gs).toFixed(4)),
      }))
      .sort((a, b) => a.time.getTime() - b.time.getTime())
  }

  const vrdReadings = [
    ...levels.approvedVrd,
    ...(includeUnapproved ? levels.unApprovedVrd : []),
  ]
  const surfaces = [...levels.groundSurface]
    .map((surface) => ({
      from: new Date(surface.fromDate).getTime(),
      elevation: surface.elevation,
    }))
    .filter((surface) => !Number.isNaN(surface.from))
    .sort((a, b) => a.from - b.from)

  if (vrdReadings.length === 0 || surfaces.length === 0) {
    return []
  }

  const surfaceElevationAt = (time: number) => {
    let elevation = surfaces[0].elevation
    for (const surface of surfaces) {
      if (surface.from <= time) elevation = surface.elevation
      else break
    }
    return elevation
  }

  return vrdReadings
    .map((reading) => {
      const time = epochToDate(reading.ts)
      return {
        time,
        value: Number(
          (surfaceElevationAt(time.getTime()) - reading.vrd).toFixed(4)
        ),
      }
    })
    .sort((a, b) => a.time.getTime() - b.time.getTime())
}
