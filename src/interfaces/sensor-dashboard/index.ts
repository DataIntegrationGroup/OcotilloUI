import type { AlertSeverity } from '@/config/sensor-sources'

/**
 * Normalized shapes the sensor dashboard consumes.
 *
 * OcotilloAPI is responsible for talking to each vendor cloud and flattening
 * the response into these shapes -- the mapping is specified per source in
 * `src/config/sensor-sources/sources/*.ts` under `vendor.fieldMap`. Vendor
 * credentials stay server-side; the browser only ever sees these types.
 *
 * Contract (all paths relative to the OcotilloAPI base URL):
 *
 *   GET  {basePath}                     -> SensorSourceStatus
 *   GET  {basePath}/device              -> { data: SensorDevice[] }
 *   GET  {basePath}/pending             -> { data: PendingBatch[] }
 *   POST {basePath}/ingest              -> IngestRun
 *   GET  {basePath}/ingest/{runId}      -> IngestRun
 *
 * where `{basePath}` is `transport.basePath` from the source config.
 */

/** One physical logger / sensor install reporting through a vendor cloud. */
export interface SensorDevice {
  sourceId: string
  /** Vendor's stable id for the device. Unique within a source. */
  deviceId: string
  label: string
  serialNumber?: string | null
  /** Ocotillo PointID, when the device has been matched to a Thing. */
  pointId?: string | null
  /** Ocotillo Thing id, when matched. Enables deep-linking to the well. */
  thingId?: string | null
  /** ISO 8601. Last time the device (or its gateway) contacted the vendor. */
  lastCommunicationAt?: string | null
  /** ISO 8601. Timestamp of the most recent usable measurement. */
  lastObservationAt?: string | null
  location?: { latitude: number; longitude: number } | null
  /** Vendor's own status string, shown verbatim as supplementary detail. */
  vendorStatus?: string | null
  /**
   * Normalized metric values keyed by `metrics[].key` in the source config.
   * A key may be absent or null when the vendor did not report it.
   */
  metrics: Record<string, number | null>
  /**
   * Per-device sampling interval from the deployment record, overriding the
   * source's `ingestion.defaultIntervalMinutes`.
   */
  recordingIntervalMinutes?: number | null
  /**
   * Sample accounting over the source's most recent reporting window, used by
   * `gap` rules. Both must be present for a gap rule to evaluate.
   */
  observedSampleCount?: number | null
  expectedSampleCount?: number | null
}

/** A rule firing against a specific device. */
export interface SensorAlert {
  ruleId: string
  sourceId: string
  deviceId: string
  deviceLabel: string
  /** Only 'warning' or 'critical' -- an 'ok' device produces no alert. */
  severity: Exclude<AlertSeverity, 'ok'>
  label: string
  /** Human-readable specifics, e.g. "18% (critical below 15%)". */
  detail: string
  /** Present for threshold/range rules. */
  metricKey?: string
  value?: number
}

/** Reachability of the vendor integration itself, independent of devices. */
export interface SensorSourceStatus {
  sourceId: string
  reachable: boolean
  /** ISO 8601. When OcotilloAPI last successfully polled the vendor. */
  lastPolledAt?: string | null
  deviceCount: number
  /** Populated when `reachable` is false. */
  error?: string | null
}

/** A window of vendor-side data not yet ingested into Ocotillo. */
export interface PendingBatch {
  sourceId: string
  batchId: string
  deviceId: string
  deviceLabel: string
  pointId?: string | null
  /** ISO 8601 bounds of the un-ingested window. */
  startDatetime: string
  endDatetime: string
  recordCount: number
  parameter: string
  /** ISO 8601. When OcotilloAPI first saw this batch as available. */
  detectedAt: string
}

export type IngestRunStatus = 'queued' | 'running' | 'succeeded' | 'failed'

/** An ingestion job triggered from the dashboard. */
export interface IngestRun {
  runId: string
  sourceId: string
  status: IngestRunStatus
  batchIds: string[]
  startedAt: string
  finishedAt?: string | null
  recordsIngested?: number | null
  message?: string | null
}

/** Request body for POST {basePath}/ingest. */
export interface IngestRequest {
  batchIds: string[]
}

/** A source plus everything the dashboard renders for it. */
export interface SensorSourceSnapshot {
  sourceId: string
  status: SensorSourceStatus
  devices: SensorDevice[]
  alerts: SensorAlert[]
  pending: PendingBatch[]
}
