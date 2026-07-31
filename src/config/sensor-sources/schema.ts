import { z } from 'zod'

/**
 * Sensor source configuration schema.
 *
 * Adding a new telemetered sensor source (a vendor cloud such as Van Essen
 * Diver or Wellntel) must be a *configuration* change only: drop a new file in
 * `./sources/`, register it in `./index.ts`, and the dashboard picks it up.
 * Nothing in `src/components/SensorDashboard/` may branch on a source id.
 *
 * The config is split into three concerns:
 *
 *  - `transport`  how the UI reaches the source (always via the OcotilloAPI
 *                 proxy -- vendor credentials never reach the browser).
 *  - `vendor`     how the vendor's raw payload maps onto our normalized
 *                 device shape. OcotilloAPI performs the mapping; this block
 *                 is the authoritative spec it implements, and the mock
 *                 provider uses it to generate realistic fixtures.
 *  - `metrics` /  what the dashboard displays and what counts as unhealthy.
 *    `alertRules`
 */

/** Severity ordering matters: index is used to pick the worst alert. */
export const SEVERITY_ORDER = ['ok', 'warning', 'critical'] as const

export const alertSeveritySchema = z.enum(SEVERITY_ORDER)
export type AlertSeverity = z.infer<typeof alertSeveritySchema>

/**
 * Timestamp fields on a normalized device that a `stale` rule can watch.
 * `lastCommunicationAt` is the device checking in (is it alive?);
 * `lastObservationAt` is usable data arriving (is it producing?).
 * A device can be online and still stop recording, so these are separate.
 */
export const timestampFieldSchema = z.enum([
  'lastCommunicationAt',
  'lastObservationAt',
])
export type TimestampField = z.infer<typeof timestampFieldSchema>

const ruleBase = {
  /** Stable id, unique within a source. Used as the React key and in tests. */
  id: z.string().min(1),
  /** Shown in the alert list. Falls back to a generated description. */
  label: z.string().min(1),
}

/** Time since a timestamp exceeds a threshold. Covers "offline" and "stale". */
export const staleRuleSchema = z.object({
  ...ruleBase,
  kind: z.literal('stale'),
  field: timestampFieldSchema,
  warnAfterMinutes: z.number().positive(),
  criticalAfterMinutes: z.number().positive(),
})

/**
 * A numeric metric crosses a one-sided bound. Covers battery and signal
 * (`direction: 'below'`) as well as things like pressure (`'above'`).
 */
export const thresholdRuleSchema = z.object({
  ...ruleBase,
  kind: z.literal('threshold'),
  metric: z.string().min(1),
  direction: z.enum(['below', 'above']),
  warnAt: z.number(),
  criticalAt: z.number(),
})

/** A numeric metric leaves a plausible range. Sanity check on readings. */
export const rangeRuleSchema = z.object({
  ...ruleBase,
  kind: z.literal('range'),
  metric: z.string().min(1),
  min: z.number(),
  max: z.number(),
  /** Outside the range is a warning; outside these is critical. */
  criticalMin: z.number().optional(),
  criticalMax: z.number().optional(),
})

/**
 * Fewer samples arrived than the recording interval implies. Catches a logger
 * that is reporting but dropping records, which `stale` alone would miss.
 */
export const gapRuleSchema = z.object({
  ...ruleBase,
  kind: z.literal('gap'),
  warnMissedIntervals: z.number().positive(),
  criticalMissedIntervals: z.number().positive(),
})

export const alertRuleSchema = z.discriminatedUnion('kind', [
  staleRuleSchema,
  thresholdRuleSchema,
  rangeRuleSchema,
  gapRuleSchema,
])
export type AlertRule = z.infer<typeof alertRuleSchema>

/** A numeric column the dashboard renders for every device of this source. */
export const metricDefinitionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  unit: z.string().optional(),
  /** Decimal places in the grid. Defaults to 1. */
  precision: z.number().int().min(0).max(6).default(1),
  /** Hide from the device grid but keep available to alert rules. */
  hidden: z.boolean().default(false),
})
export type MetricDefinition = z.infer<typeof metricDefinitionSchema>

/**
 * Where a normalized field comes from in the vendor payload. `path` is a
 * dot-notation path into the vendor's device object.
 */
export const vendorFieldMappingSchema = z.object({
  path: z.string().min(1),
  /**
   * Multiply the raw value. Use for unit conversion (e.g. Van Essen reports
   * battery volts; a percentage needs scaling upstream instead -- prefer
   * asking the backend for the already-correct unit over fudging here).
   */
  scale: z.number().optional(),
  offset: z.number().optional(),
})

export const vendorSpecSchema = z.object({
  /** Human name of the vendor cloud, shown in the source card. */
  name: z.string().min(1),
  /** Link to vendor console, opened from the source card. */
  consoleUrl: z.string().url().optional(),
  /**
   * Normalized field/metric key -> vendor payload location. OcotilloAPI
   * implements this mapping; keeping it here keeps the contract in one file
   * per source and lets the mock provider generate matching fixtures.
   */
  fieldMap: z.record(z.string(), vendorFieldMappingSchema),
})

export const transportSchema = z.object({
  /**
   * Only one kind today. Vendor credentials live in OcotilloAPI and never
   * reach the browser, so there is deliberately no `direct` option.
   */
  kind: z.literal('ocotillo-proxy'),
  /** Path segment under the OcotilloAPI base URL, no leading slash. */
  basePath: z.string().min(1),
})

export const ingestionSchema = z.object({
  /** Ocotillo resource the pulled data lands in. */
  targetResource: z.string().min(1),
  /** Lexicon parameter the source produces. */
  parameter: z.string().min(1),
  /**
   * Nominal recording interval. `gap` rules use this to work out how many
   * samples were expected; overridden per-device when the deployment record
   * carries its own `recording_interval`.
   */
  defaultIntervalMinutes: z.number().positive(),
  /** Operators may trigger a pull from the dashboard. */
  allowManualTrigger: z.boolean().default(true),
})

export const sensorSourceSchema = z.object({
  /** Kebab-case, stable, used in URLs and as the React key. */
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'source id must be kebab-case'),
  label: z.string().min(1),
  /** Disabled sources stay in the registry but are not fetched or rendered. */
  enabled: z.boolean().default(true),
  transport: transportSchema,
  vendor: vendorSpecSchema,
  metrics: z.array(metricDefinitionSchema).default([]),
  alertRules: z.array(alertRuleSchema).default([]),
  ingestion: ingestionSchema,
})

export type SensorSourceConfig = z.infer<typeof sensorSourceSchema>
/** Pre-parse shape: fields with defaults are optional when authoring. */
export type SensorSourceConfigInput = z.input<typeof sensorSourceSchema>

/**
 * Validates a source config at import time so a malformed file fails the build
 * (via `tsc`) or throws on first load rather than rendering an empty dashboard.
 */
export const defineSensorSource = (
  config: SensorSourceConfigInput
): SensorSourceConfig => {
  const result = sensorSourceSchema.safeParse(config)
  if (!result.success) {
    throw new Error(
      `Invalid sensor source config "${config.id}": ${result.error.message}`
    )
  }
  const source = result.data

  // A rule pointing at a metric that was never declared would silently never
  // fire, which is worse than a hard failure at import time.
  const known = new Set(source.metrics.map((m) => m.key))
  const dangling = source.alertRules
    .filter((rule) => rule.kind === 'threshold' || rule.kind === 'range')
    .filter((rule) => !known.has(rule.metric))
    .map((rule) => `${rule.id} -> ${rule.metric}`)
  if (dangling.length > 0) {
    throw new Error(
      `Sensor source "${source.id}" has alert rules referencing undeclared ` +
        `metrics: ${dangling.join(', ')}`
    )
  }

  const ids = source.alertRules.map((rule) => rule.id)
  const duplicate = ids.find((id, i) => ids.indexOf(id) !== i)
  if (duplicate) {
    throw new Error(
      `Sensor source "${source.id}" has duplicate alert rule id "${duplicate}"`
    )
  }

  // Thresholds that are ordered the wrong way round still parse but can never
  // reach their critical branch, producing a rule that quietly under-reports.
  const inverted = source.alertRules.filter((rule) => {
    switch (rule.kind) {
      case 'stale':
        return rule.criticalAfterMinutes < rule.warnAfterMinutes
      case 'gap':
        return rule.criticalMissedIntervals < rule.warnMissedIntervals
      case 'threshold':
        return rule.direction === 'below'
          ? rule.criticalAt > rule.warnAt
          : rule.criticalAt < rule.warnAt
      case 'range':
        return (
          rule.min > rule.max ||
          (rule.criticalMin !== undefined && rule.criticalMin > rule.min) ||
          (rule.criticalMax !== undefined && rule.criticalMax < rule.max)
        )
    }
  })
  if (inverted.length > 0) {
    throw new Error(
      `Sensor source "${source.id}" has alert rules whose critical bound is ` +
        `not more severe than its warning bound: ` +
        `${inverted.map((rule) => rule.id).join(', ')}`
    )
  }

  return source
}
