import type {
  AlertRule,
  AlertSeverity,
  MetricDefinition,
  SensorSourceConfig,
} from '@/config/sensor-sources'
import { SEVERITY_ORDER } from '@/config/sensor-sources'
import type { SensorAlert, SensorDevice } from '@/interfaces/sensor-dashboard'

/**
 * Alert engine for the sensor dashboard.
 *
 * Pure and source-agnostic: every threshold comes from the source config, so
 * adding a vendor never touches this file. Deliberately no per-source
 * branching -- if you find yourself wanting `if (sourceId === ...)` here, the
 * missing knob belongs in `src/config/sensor-sources/schema.ts` instead.
 */

const MINUTE_MS = 60_000

const parseTimestamp = (value?: string | null): Date | null => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/** Minutes elapsed from `earlier` to `now`. Negative if `earlier` is ahead. */
export const minutesSince = (earlier: Date, now: Date): number =>
  (now.getTime() - earlier.getTime()) / MINUTE_MS

/** Compact age for alert detail text: "45 min", "3.2 hr", "6.1 days". */
export const formatAge = (minutes: number): string => {
  if (minutes < 60) return `${Math.round(minutes)} min`
  if (minutes < 60 * 48) return `${(minutes / 60).toFixed(1)} hr`
  return `${(minutes / (60 * 24)).toFixed(1)} days`
}

const formatValue = (value: number, metric?: MetricDefinition): string => {
  const rendered = value.toFixed(metric?.precision ?? 1)
  return metric?.unit ? `${rendered}${metric.unit}` : rendered
}

type Firing = {
  severity: Exclude<AlertSeverity, 'ok'>
  detail: string
  metricKey?: string
  value?: number
}

const evaluateStale = (
  rule: Extract<AlertRule, { kind: 'stale' }>,
  device: SensorDevice,
  now: Date
): Firing | null => {
  const timestamp = parseTimestamp(device[rule.field])

  // A device in the registry that has never reported is broken, not new-
  // and-quiet. Sources without a given timestamp concept (e.g. no gateway)
  // simply do not declare a rule against that field.
  if (!timestamp) {
    return { severity: 'critical', detail: 'never reported' }
  }

  const age = minutesSince(timestamp, now)
  if (age >= rule.criticalAfterMinutes) {
    return {
      severity: 'critical',
      detail: `${formatAge(age)} ago (critical after ${formatAge(
        rule.criticalAfterMinutes
      )})`,
    }
  }
  if (age >= rule.warnAfterMinutes) {
    return {
      severity: 'warning',
      detail: `${formatAge(age)} ago (warn after ${formatAge(
        rule.warnAfterMinutes
      )})`,
    }
  }
  return null
}

const evaluateThreshold = (
  rule: Extract<AlertRule, { kind: 'threshold' }>,
  device: SensorDevice,
  metric?: MetricDefinition
): Firing | null => {
  const value = device.metrics[rule.metric]

  // Unlike `stale`, a missing metric is not an alert: vendors omit metrics
  // for hardware that does not have them.
  if (!isNumber(value)) return null

  const crossed = (bound: number) =>
    rule.direction === 'below' ? value <= bound : value >= bound
  const word = rule.direction === 'below' ? 'below' : 'above'

  if (crossed(rule.criticalAt)) {
    return {
      severity: 'critical',
      detail: `${formatValue(value, metric)} (critical ${word} ${formatValue(
        rule.criticalAt,
        metric
      )})`,
      metricKey: rule.metric,
      value,
    }
  }
  if (crossed(rule.warnAt)) {
    return {
      severity: 'warning',
      detail: `${formatValue(value, metric)} (warn ${word} ${formatValue(
        rule.warnAt,
        metric
      )})`,
      metricKey: rule.metric,
      value,
    }
  }
  return null
}

const evaluateRange = (
  rule: Extract<AlertRule, { kind: 'range' }>,
  device: SensorDevice,
  metric?: MetricDefinition
): Firing | null => {
  const value = device.metrics[rule.metric]
  if (!isNumber(value)) return null

  const belowCritical = isNumber(rule.criticalMin) && value < rule.criticalMin
  const aboveCritical = isNumber(rule.criticalMax) && value > rule.criticalMax
  if (belowCritical || aboveCritical) {
    return {
      severity: 'critical',
      detail: `${formatValue(value, metric)} far outside ${formatValue(
        rule.min,
        metric
      )}-${formatValue(rule.max, metric)}`,
      metricKey: rule.metric,
      value,
    }
  }

  if (value < rule.min || value > rule.max) {
    return {
      severity: 'warning',
      detail: `${formatValue(value, metric)} outside ${formatValue(
        rule.min,
        metric
      )}-${formatValue(rule.max, metric)}`,
      metricKey: rule.metric,
      value,
    }
  }
  return null
}

const evaluateGap = (
  rule: Extract<AlertRule, { kind: 'gap' }>,
  device: SensorDevice
): Firing | null => {
  const { expectedSampleCount: expected, observedSampleCount: observed } =
    device

  // Both halves of the accounting are required; without them we cannot tell
  // "no records missing" from "no information".
  if (!isNumber(expected) || !isNumber(observed) || expected <= 0) return null

  const missed = expected - observed
  if (missed <= 0) return null

  const detail = `${missed} of ${expected} records missing`
  if (missed >= rule.criticalMissedIntervals) {
    return { severity: 'critical', detail }
  }
  if (missed >= rule.warnMissedIntervals) {
    return { severity: 'warning', detail }
  }
  return null
}

/** All alerts firing for one device under its source's rules. */
export const evaluateDevice = (
  device: SensorDevice,
  source: SensorSourceConfig,
  now: Date = new Date()
): SensorAlert[] => {
  const metricsByKey = new Map(source.metrics.map((m) => [m.key, m]))

  return source.alertRules.reduce<SensorAlert[]>((alerts, rule) => {
    const metric =
      rule.kind === 'threshold' || rule.kind === 'range'
        ? metricsByKey.get(rule.metric)
        : undefined

    let firing: Firing | null = null
    switch (rule.kind) {
      case 'stale':
        firing = evaluateStale(rule, device, now)
        break
      case 'threshold':
        firing = evaluateThreshold(rule, device, metric)
        break
      case 'range':
        firing = evaluateRange(rule, device, metric)
        break
      case 'gap':
        firing = evaluateGap(rule, device)
        break
    }

    if (firing) {
      alerts.push({
        ruleId: rule.id,
        sourceId: source.id,
        deviceId: device.deviceId,
        deviceLabel: device.label,
        label: rule.label,
        ...firing,
      })
    }
    return alerts
  }, [])
}

/** All alerts firing across every device of a source. */
export const evaluateSource = (
  devices: SensorDevice[],
  source: SensorSourceConfig,
  now: Date = new Date()
): SensorAlert[] =>
  devices.flatMap((device) => evaluateDevice(device, source, now))

/** Worst severity present, or 'ok' when nothing is firing. */
export const worstSeverity = (alerts: SensorAlert[]): AlertSeverity =>
  alerts.reduce<AlertSeverity>(
    (worst, alert) =>
      SEVERITY_ORDER.indexOf(alert.severity) > SEVERITY_ORDER.indexOf(worst)
        ? alert.severity
        : worst,
    'ok'
  )

export type AlertSummary = Record<AlertSeverity, number>

/**
 * Device counts by worst severity. `ok` counts devices with no alerts at all,
 * so the three buckets always sum to `devices.length`.
 */
export const summarizeDevices = (
  devices: SensorDevice[],
  alerts: SensorAlert[]
): AlertSummary => {
  const byDevice = new Map<string, SensorAlert[]>()
  for (const alert of alerts) {
    const existing = byDevice.get(alert.deviceId)
    if (existing) existing.push(alert)
    else byDevice.set(alert.deviceId, [alert])
  }

  return devices.reduce<AlertSummary>(
    (summary, device) => {
      const severity = worstSeverity(byDevice.get(device.deviceId) ?? [])
      summary[severity] += 1
      return summary
    },
    { ok: 0, warning: 0, critical: 0 }
  )
}
