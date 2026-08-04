import type { AlertRule, SensorSourceConfig } from '@/config/sensor-sources'
import type {
  IngestRun,
  PendingBatch,
  SensorDevice,
  SensorSourceStatus,
} from '@/interfaces/sensor-dashboard'
import type { SensorSourceClient } from './sensor-source-provider'

/**
 * Fixture client used when `VITE_SENSOR_MOCK=true`.
 *
 * Everything is derived from the source config -- metrics, thresholds, and
 * intervals -- so a newly added source gets believable fixtures with no change
 * here. Values are seeded off the source id and device index, so a reload
 * shows the same fleet rather than reshuffling under you.
 */

const DEVICES_PER_SOURCE = 14
const MINUTE_MS = 60_000

/** Deterministic PRNG. Same seed in, same sequence out. */
const mulberry32 = (seed: number) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hashString = (value: string): number => {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const seededRandom = (...parts: (string | number)[]) =>
  mulberry32(hashString(parts.join('|')))

const pick = <T>(random: () => number, items: T[]): T =>
  items[Math.floor(random() * items.length)]

const between = (random: () => number, min: number, max: number) =>
  min + random() * (max - min)

/**
 * Every 5th device is unhealthy and every 7th is badly so, giving each source
 * a predictable mix of ok / warning / critical without hand-written fixtures.
 */
type Health = 'healthy' | 'degraded' | 'failing'

const healthFor = (index: number): Health => {
  if (index % 7 === 6) return 'failing'
  if (index % 5 === 4) return 'degraded'
  return 'healthy'
}

const ruleFor = <K extends AlertRule['kind']>(
  source: SensorSourceConfig,
  kind: K,
  predicate: (rule: Extract<AlertRule, { kind: K }>) => boolean = () => true
): Extract<AlertRule, { kind: K }> | undefined =>
  source.alertRules.find(
    (rule): rule is Extract<AlertRule, { kind: K }> =>
      rule.kind === kind && predicate(rule as Extract<AlertRule, { kind: K }>)
  )

/**
 * Generate a metric value positioned relative to whatever rules watch it, so
 * a "failing" device actually trips the source's own configured thresholds.
 */
const metricValue = (
  source: SensorSourceConfig,
  metricKey: string,
  health: Health,
  random: () => number
): number => {
  const threshold = ruleFor(
    source,
    'threshold',
    (rule) => rule.metric === metricKey
  )
  const range = ruleFor(source, 'range', (rule) => rule.metric === metricKey)

  if (threshold) {
    const { direction, warnAt, criticalAt } = threshold
    if (direction === 'below') {
      if (health === 'failing') return between(random, 0, criticalAt)
      if (health === 'degraded') return between(random, criticalAt, warnAt)
      return between(random, warnAt + 1, Math.max(warnAt + 1, 100))
    }
    if (health === 'failing') return between(random, criticalAt, criticalAt + 5)
    if (health === 'degraded') return between(random, warnAt, criticalAt)
    return between(random, 0, warnAt - 1)
  }

  if (range) {
    if (health === 'failing') {
      return between(
        random,
        range.criticalMax ?? range.max,
        (range.max || 1) * 2
      )
    }
    // Keep the bulk of readings in the middle of the plausible band.
    const span = range.max - range.min
    return between(random, range.min + span * 0.1, range.min + span * 0.6)
  }

  return between(random, 0, 100)
}

const buildDevice = (
  source: SensorSourceConfig,
  index: number,
  now: number
): SensorDevice => {
  const random = seededRandom(source.id, index)
  const health = healthFor(index)
  const interval = source.ingestion.defaultIntervalMinutes

  const staleRule = ruleFor(
    source,
    'stale',
    (rule) => rule.field === 'lastCommunicationAt'
  )
  const dataRule = ruleFor(
    source,
    'stale',
    (rule) => rule.field === 'lastObservationAt'
  )

  const ageFor = (
    rule: Extract<AlertRule, { kind: 'stale' }> | undefined
  ): number => {
    if (!rule) return between(random, 0, interval)
    if (health === 'failing')
      return between(
        random,
        rule.criticalAfterMinutes,
        rule.criticalAfterMinutes * 2
      )
    if (health === 'degraded')
      return between(random, rule.warnAfterMinutes, rule.criticalAfterMinutes)
    return between(random, 0, rule.warnAfterMinutes * 0.5)
  }

  const metrics: Record<string, number | null> = {}
  for (const metric of source.metrics) {
    metrics[metric.key] = Number(
      metricValue(source, metric.key, health, random).toFixed(metric.precision)
    )
  }

  // Sample accounting over a 24h window. Shortfalls are expressed as a
  // fraction of `expected` so sources with long intervals (few samples per
  // day) still produce sensible counts.
  const expected = Math.max(1, Math.round((60 * 24) / interval))
  const shortfall =
    health === 'failing'
      ? Math.ceil(expected * between(random, 0.5, 0.9))
      : health === 'degraded'
        ? Math.max(1, Math.round(expected * between(random, 0.15, 0.3)))
        : 0
  const observed = Math.max(0, expected - shortfall)

  // Prefix per source so two vendors' fixtures never share a PointID -- a
  // real network would not have the same well monitored by both.
  const prefix = source.id
    .split('-')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  const pointId = `${prefix}-${(index + 1).toString().padStart(3, '0')}`

  return {
    sourceId: source.id,
    deviceId: `${source.id}-${(index + 1).toString().padStart(3, '0')}`,
    label: `${pointId} ${pick(random, [
      'Windmill',
      'Cottonwood',
      'Mesa',
      'Arroyo',
      'Bosque',
      'Rio Abajo',
      'Sandia',
      'Ocotillo',
    ])}`,
    serialNumber: `${Math.floor(between(random, 100000, 999999))}`,
    pointId,
    thingId: null,
    lastCommunicationAt: new Date(
      now - ageFor(staleRule) * MINUTE_MS
    ).toISOString(),
    lastObservationAt: new Date(
      now - ageFor(dataRule) * MINUTE_MS
    ).toISOString(),
    location: {
      // Scattered across New Mexico.
      latitude: Number(between(random, 32.0, 36.9).toFixed(5)),
      longitude: Number(between(random, -108.9, -103.2).toFixed(5)),
    },
    vendorStatus: health === 'healthy' ? 'Active' : 'Needs attention',
    metrics,
    recordingIntervalMinutes: interval,
    expectedSampleCount: expected,
    observedSampleCount: observed,
  }
}

const devicesFor = (source: SensorSourceConfig, now: number) =>
  Array.from({ length: DEVICES_PER_SOURCE }, (_, index) =>
    buildDevice(source, index, now)
  )

const buildPending = (
  source: SensorSourceConfig,
  devices: SensorDevice[],
  now: number
): PendingBatch[] =>
  devices
    // Not every device has un-ingested data waiting.
    .filter((_, index) => index % 3 !== 2)
    .map((device, index) => {
      const random = seededRandom(source.id, 'pending', index)
      const windowHours = Math.round(between(random, 6, 72))
      const end = now - Math.round(between(random, 0, 4)) * 60 * MINUTE_MS
      const start = end - windowHours * 60 * MINUTE_MS
      return {
        sourceId: source.id,
        batchId: `${device.deviceId}-batch-${index + 1}`,
        deviceId: device.deviceId,
        deviceLabel: device.label,
        pointId: device.pointId,
        startDatetime: new Date(start).toISOString(),
        endDatetime: new Date(end).toISOString(),
        recordCount: Math.round(
          (windowHours * 60) / source.ingestion.defaultIntervalMinutes
        ),
        parameter: source.ingestion.parameter,
        detectedAt: new Date(end + 30 * MINUTE_MS).toISOString(),
      }
    })

/** Runs triggered during this session, so status polling returns something. */
const runs = new Map<string, IngestRun>()

const delay = <T>(value: T, ms = 220): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms))

export const mockSensorSourceClient: SensorSourceClient = {
  getStatus: async (source) =>
    delay<SensorSourceStatus>({
      sourceId: source.id,
      reachable: true,
      lastPolledAt: new Date(Date.now() - 4 * MINUTE_MS).toISOString(),
      deviceCount: DEVICES_PER_SOURCE,
      error: null,
    }),

  getDevices: async (source) => delay(devicesFor(source, Date.now())),

  getPending: async (source) => {
    const now = Date.now()
    return delay(buildPending(source, devicesFor(source, now), now))
  },

  triggerIngest: async (source, batchIds) => {
    const runId = `${source.id}-run-${runs.size + 1}`
    const run: IngestRun = {
      runId,
      sourceId: source.id,
      status: 'running',
      batchIds,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      recordsIngested: null,
      message: null,
    }
    runs.set(runId, run)

    // Settle shortly after, so the UI shows running -> succeeded.
    setTimeout(() => {
      runs.set(runId, {
        ...run,
        status: 'succeeded',
        finishedAt: new Date().toISOString(),
        recordsIngested: batchIds.length * 24,
        message: `Ingested ${batchIds.length} batch(es)`,
      })
    }, 2500)

    return delay(run)
  },

  getIngestRun: async (_source, runId) => {
    const run = runs.get(runId)
    if (!run) throw new Error(`Unknown mock ingest run "${runId}"`)
    return delay(run, 60)
  },
}
