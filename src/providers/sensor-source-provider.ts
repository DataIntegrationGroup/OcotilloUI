import type { SensorSourceConfig } from '@/config/sensor-sources'
import type {
  IngestRequest,
  IngestRun,
  PendingBatch,
  SensorDevice,
  SensorSourceStatus,
} from '@/interfaces/sensor-dashboard'
import { axiosCall, fetcher } from '@/providers/ocotillo-data-provider'
import { settings } from '@/settings'
import { mockSensorSourceClient } from './sensor-source-mock'

/**
 * Client for the OcotilloAPI sensor-source proxy.
 *
 * Vendor clouds (Van Essen, Wellntel) are reached through OcotilloAPI so their
 * credentials stay server-side. Every method takes the source config rather
 * than a bare id, so routing is driven entirely by `transport.basePath`.
 */
export interface SensorSourceClient {
  getStatus(source: SensorSourceConfig): Promise<SensorSourceStatus>
  getDevices(source: SensorSourceConfig): Promise<SensorDevice[]>
  getPending(source: SensorSourceConfig): Promise<PendingBatch[]>
  triggerIngest(
    source: SensorSourceConfig,
    batchIds: string[]
  ): Promise<IngestRun>
  getIngestRun(source: SensorSourceConfig, runId: string): Promise<IngestRun>
}

/**
 * OcotilloAPI wraps collections as `{ data: [...] }`; single objects are
 * returned bare. Tolerate a bare array so a simpler backend shape does not
 * break the dashboard.
 */
const unwrapList = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const inner = (payload as { data: unknown }).data
    if (Array.isArray(inner)) return inner as T[]
  }
  return []
}

const httpSensorSourceClient: SensorSourceClient = {
  getStatus: async (source) => {
    const { data } = await fetcher(source.transport.basePath)
    return data as SensorSourceStatus
  },

  getDevices: async (source) => {
    const { data } = await fetcher(`${source.transport.basePath}/device`)
    return unwrapList<SensorDevice>(data)
  },

  getPending: async (source) => {
    const { data } = await fetcher(`${source.transport.basePath}/pending`)
    return unwrapList<PendingBatch>(data)
  },

  triggerIngest: async (source, batchIds) => {
    const body: IngestRequest = { batchIds }
    const { data } = await axiosCall(`${source.transport.basePath}/ingest`, {
      method: 'POST',
      data: body,
    })
    return data as IngestRun
  },

  getIngestRun: async (source, runId) => {
    const { data } = await fetcher(
      `${source.transport.basePath}/ingest/${runId}`
    )
    return data as IngestRun
  },
}

/**
 * The OcotilloAPI sensor-source endpoints do not exist yet. Until they do,
 * `VITE_SENSOR_MOCK=true` serves fixtures generated from the same source
 * configs, so the dashboard is fully exercisable. Flipping the flag is the
 * only change needed once the backend ships.
 */
export const sensorSourceClient: SensorSourceClient = settings.sensor_mock
  ? mockSensorSourceClient
  : httpSensorSourceClient

export { httpSensorSourceClient, mockSensorSourceClient }
