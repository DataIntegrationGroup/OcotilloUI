import { describe, expect, it } from 'vitest'
import type { SensorSourceConfigInput } from '@/config/sensor-sources'
import { defineSensorSource } from '@/config/sensor-sources'
import type { SensorDevice } from '@/interfaces/sensor-dashboard'
import {
  evaluateDevice,
  formatAge,
  summarizeDevices,
  worstSeverity,
} from './sensorAlerts'

const NOW = new Date('2026-07-30T12:00:00.000Z')

const minutesAgo = (minutes: number) =>
  new Date(NOW.getTime() - minutes * 60_000).toISOString()

const source = (overrides: Partial<SensorSourceConfigInput> = {}) =>
  defineSensorSource({
    id: 'test-source',
    label: 'Test Source',
    transport: { kind: 'ocotillo-proxy', basePath: 'sensor-source/test' },
    vendor: { name: 'Test Vendor', fieldMap: {} },
    metrics: [
      { key: 'batteryPercent', label: 'Battery', unit: '%', precision: 0 },
      { key: 'depthFeet', label: 'Depth', unit: 'ft', precision: 2 },
    ],
    alertRules: [],
    ingestion: {
      targetResource: 'observation/transducer-groundwater-level',
      parameter: 'groundwater-level',
      defaultIntervalMinutes: 60,
    },
    ...overrides,
  })

const device = (overrides: Partial<SensorDevice> = {}): SensorDevice => ({
  sourceId: 'test-source',
  deviceId: 'dev-1',
  label: 'Device 1',
  lastCommunicationAt: minutesAgo(5),
  lastObservationAt: minutesAgo(5),
  metrics: {},
  ...overrides,
})

describe('formatAge', () => {
  it('scales units by magnitude', () => {
    expect(formatAge(45)).toBe('45 min')
    expect(formatAge(60 * 3.2)).toBe('3.2 hr')
    expect(formatAge(60 * 24 * 6.1)).toBe('6.1 days')
  })
})

describe('stale rules', () => {
  const staleSource = source({
    alertRules: [
      {
        id: 'offline',
        kind: 'stale',
        label: 'Offline',
        field: 'lastCommunicationAt',
        warnAfterMinutes: 60,
        criticalAfterMinutes: 240,
      },
    ],
  })

  it('stays silent inside the warning window', () => {
    const alerts = evaluateDevice(
      device({ lastCommunicationAt: minutesAgo(59) }),
      staleSource,
      NOW
    )
    expect(alerts).toEqual([])
  })

  it('warns at exactly the warning threshold', () => {
    const alerts = evaluateDevice(
      device({ lastCommunicationAt: minutesAgo(60) }),
      staleSource,
      NOW
    )
    expect(alerts).toHaveLength(1)
    expect(alerts[0].severity).toBe('warning')
    expect(alerts[0].ruleId).toBe('offline')
  })

  it('escalates at exactly the critical threshold', () => {
    const alerts = evaluateDevice(
      device({ lastCommunicationAt: minutesAgo(240) }),
      staleSource,
      NOW
    )
    expect(alerts[0].severity).toBe('critical')
  })

  it('treats a never-reporting device as critical', () => {
    const alerts = evaluateDevice(
      device({ lastCommunicationAt: null }),
      staleSource,
      NOW
    )
    expect(alerts[0].severity).toBe('critical')
    expect(alerts[0].detail).toBe('never reported')
  })

  it('treats an unparseable timestamp as never reported', () => {
    const alerts = evaluateDevice(
      device({ lastCommunicationAt: 'not-a-date' }),
      staleSource,
      NOW
    )
    expect(alerts[0].severity).toBe('critical')
  })

  it('does not fire on a future timestamp', () => {
    const alerts = evaluateDevice(
      device({ lastCommunicationAt: minutesAgo(-90) }),
      staleSource,
      NOW
    )
    expect(alerts).toEqual([])
  })

  it('evaluates each timestamp field independently', () => {
    const twoField = source({
      alertRules: [
        {
          id: 'offline',
          kind: 'stale',
          label: 'Offline',
          field: 'lastCommunicationAt',
          warnAfterMinutes: 60,
          criticalAfterMinutes: 240,
        },
        {
          id: 'no-data',
          kind: 'stale',
          label: 'No data',
          field: 'lastObservationAt',
          warnAfterMinutes: 60,
          criticalAfterMinutes: 240,
        },
      ],
    })
    // Checking in but not recording: the case a single rule would miss.
    const alerts = evaluateDevice(
      device({
        lastCommunicationAt: minutesAgo(5),
        lastObservationAt: minutesAgo(300),
      }),
      twoField,
      NOW
    )
    expect(alerts).toHaveLength(1)
    expect(alerts[0].ruleId).toBe('no-data')
    expect(alerts[0].severity).toBe('critical')
  })
})

describe('threshold rules', () => {
  const below = source({
    alertRules: [
      {
        id: 'battery',
        kind: 'threshold',
        label: 'Battery low',
        metric: 'batteryPercent',
        direction: 'below',
        warnAt: 25,
        criticalAt: 10,
      },
    ],
  })

  it('is silent above the warning bound', () => {
    const alerts = evaluateDevice(
      device({ metrics: { batteryPercent: 26 } }),
      below,
      NOW
    )
    expect(alerts).toEqual([])
  })

  it('warns at the bound and reports the value with its unit', () => {
    const alerts = evaluateDevice(
      device({ metrics: { batteryPercent: 25 } }),
      below,
      NOW
    )
    expect(alerts[0].severity).toBe('warning')
    expect(alerts[0].detail).toBe('25% (warn below 25%)')
    expect(alerts[0].metricKey).toBe('batteryPercent')
    expect(alerts[0].value).toBe(25)
  })

  it('escalates at the critical bound', () => {
    const alerts = evaluateDevice(
      device({ metrics: { batteryPercent: 10 } }),
      below,
      NOW
    )
    expect(alerts[0].severity).toBe('critical')
  })

  it('supports the above direction', () => {
    const above = source({
      metrics: [{ key: 'memoryPercent', label: 'Memory', unit: '%' }],
      alertRules: [
        {
          id: 'memory',
          kind: 'threshold',
          label: 'Memory filling',
          metric: 'memoryPercent',
          direction: 'above',
          warnAt: 80,
          criticalAt: 95,
        },
      ],
    })
    expect(
      evaluateDevice(device({ metrics: { memoryPercent: 79 } }), above, NOW)
    ).toEqual([])
    expect(
      evaluateDevice(device({ metrics: { memoryPercent: 96 } }), above, NOW)[0]
        .severity
    ).toBe('critical')
  })

  it('skips a metric the vendor did not report', () => {
    expect(evaluateDevice(device({ metrics: {} }), below, NOW)).toEqual([])
    expect(
      evaluateDevice(device({ metrics: { batteryPercent: null } }), below, NOW)
    ).toEqual([])
  })

  it('skips non-finite values rather than treating NaN as low', () => {
    expect(
      evaluateDevice(
        device({ metrics: { batteryPercent: Number.NaN } }),
        below,
        NOW
      )
    ).toEqual([])
  })
})

describe('range rules', () => {
  const ranged = source({
    alertRules: [
      {
        id: 'depth',
        kind: 'range',
        label: 'Depth implausible',
        metric: 'depthFeet',
        min: 0,
        max: 1000,
        criticalMin: -5,
        criticalMax: 2000,
      },
    ],
  })

  it('is silent inside the range', () => {
    expect(
      evaluateDevice(device({ metrics: { depthFeet: 500 } }), ranged, NOW)
    ).toEqual([])
  })

  it('warns just outside the range', () => {
    expect(
      evaluateDevice(device({ metrics: { depthFeet: 1001 } }), ranged, NOW)[0]
        .severity
    ).toBe('warning')
    expect(
      evaluateDevice(device({ metrics: { depthFeet: -1 } }), ranged, NOW)[0]
        .severity
    ).toBe('warning')
  })

  it('escalates past the critical bounds', () => {
    expect(
      evaluateDevice(device({ metrics: { depthFeet: 2001 } }), ranged, NOW)[0]
        .severity
    ).toBe('critical')
    expect(
      evaluateDevice(device({ metrics: { depthFeet: -6 } }), ranged, NOW)[0]
        .severity
    ).toBe('critical')
  })

  it('warns without critical bounds configured', () => {
    const noCritical = source({
      alertRules: [
        {
          id: 'depth',
          kind: 'range',
          label: 'Depth implausible',
          metric: 'depthFeet',
          min: 0,
          max: 1000,
        },
      ],
    })
    const alerts = evaluateDevice(
      device({ metrics: { depthFeet: 99999 } }),
      noCritical,
      NOW
    )
    expect(alerts[0].severity).toBe('warning')
  })
})

describe('gap rules', () => {
  const gapped = source({
    alertRules: [
      {
        id: 'gap',
        kind: 'gap',
        label: 'Missing records',
        warnMissedIntervals: 4,
        criticalMissedIntervals: 12,
      },
    ],
  })

  it('is silent when every expected record arrived', () => {
    expect(
      evaluateDevice(
        device({ expectedSampleCount: 24, observedSampleCount: 24 }),
        gapped,
        NOW
      )
    ).toEqual([])
  })

  it('warns and escalates on missed counts', () => {
    expect(
      evaluateDevice(
        device({ expectedSampleCount: 24, observedSampleCount: 20 }),
        gapped,
        NOW
      )[0].severity
    ).toBe('warning')
    expect(
      evaluateDevice(
        device({ expectedSampleCount: 24, observedSampleCount: 12 }),
        gapped,
        NOW
      )[0].severity
    ).toBe('critical')
  })

  it('reports the shortfall in the detail', () => {
    const alerts = evaluateDevice(
      device({ expectedSampleCount: 24, observedSampleCount: 18 }),
      gapped,
      NOW
    )
    expect(alerts[0].detail).toBe('6 of 24 records missing')
  })

  it('skips when accounting is incomplete', () => {
    expect(
      evaluateDevice(device({ expectedSampleCount: 24 }), gapped, NOW)
    ).toEqual([])
    expect(
      evaluateDevice(device({ observedSampleCount: 24 }), gapped, NOW)
    ).toEqual([])
    expect(
      evaluateDevice(
        device({ expectedSampleCount: 0, observedSampleCount: 0 }),
        gapped,
        NOW
      )
    ).toEqual([])
  })

  it('does not fire when more records arrived than expected', () => {
    expect(
      evaluateDevice(
        device({ expectedSampleCount: 24, observedSampleCount: 30 }),
        gapped,
        NOW
      )
    ).toEqual([])
  })
})

describe('worstSeverity', () => {
  const alert = (severity: 'warning' | 'critical') => ({
    ruleId: 'r',
    sourceId: 's',
    deviceId: 'd',
    deviceLabel: 'D',
    severity,
    label: 'L',
    detail: '',
  })

  it('is ok with no alerts', () => {
    expect(worstSeverity([])).toBe('ok')
  })

  it('picks critical over warning regardless of order', () => {
    expect(worstSeverity([alert('warning'), alert('critical')])).toBe(
      'critical'
    )
    expect(worstSeverity([alert('critical'), alert('warning')])).toBe(
      'critical'
    )
  })
})

describe('summarizeDevices', () => {
  it('buckets each device by its worst alert and sums to the total', () => {
    const devices = [
      device({ deviceId: 'a' }),
      device({ deviceId: 'b' }),
      device({ deviceId: 'c' }),
    ]
    const alerts = [
      {
        ruleId: 'r1',
        sourceId: 's',
        deviceId: 'b',
        deviceLabel: 'B',
        severity: 'warning' as const,
        label: 'L',
        detail: '',
      },
      {
        ruleId: 'r2',
        sourceId: 's',
        deviceId: 'c',
        deviceLabel: 'C',
        severity: 'warning' as const,
        label: 'L',
        detail: '',
      },
      {
        ruleId: 'r3',
        sourceId: 's',
        deviceId: 'c',
        deviceLabel: 'C',
        severity: 'critical' as const,
        label: 'L',
        detail: '',
      },
    ]

    const summary = summarizeDevices(devices, alerts)
    // 'c' has both a warning and a critical -- it must count once, as critical.
    expect(summary).toEqual({ ok: 1, warning: 1, critical: 1 })
    expect(summary.ok + summary.warning + summary.critical).toBe(devices.length)
  })
})

describe('config validation', () => {
  it('rejects an alert rule pointing at an undeclared metric', () => {
    expect(() =>
      source({
        alertRules: [
          {
            id: 'ghost',
            kind: 'threshold',
            label: 'Ghost metric',
            metric: 'doesNotExist',
            direction: 'below',
            warnAt: 10,
            criticalAt: 5,
          },
        ],
      })
    ).toThrow(/undeclared metrics/)
  })

  it('rejects duplicate rule ids', () => {
    expect(() =>
      source({
        alertRules: [
          {
            id: 'dupe',
            kind: 'stale',
            label: 'A',
            field: 'lastObservationAt',
            warnAfterMinutes: 10,
            criticalAfterMinutes: 20,
          },
          {
            id: 'dupe',
            kind: 'stale',
            label: 'B',
            field: 'lastCommunicationAt',
            warnAfterMinutes: 10,
            criticalAfterMinutes: 20,
          },
        ],
      })
    ).toThrow(/duplicate alert rule id/)
  })

  it('rejects a critical bound less severe than its warning bound', () => {
    expect(() =>
      source({
        alertRules: [
          {
            id: 'backwards',
            kind: 'threshold',
            label: 'Backwards battery',
            metric: 'batteryPercent',
            direction: 'below',
            warnAt: 10,
            criticalAt: 25,
          },
        ],
      })
    ).toThrow(/not more severe/)
  })

  it('rejects a non-kebab-case source id', () => {
    expect(() => source({ id: 'Not Kebab' })).toThrow(/kebab-case/)
  })
})

describe('shipped source configs', () => {
  it('load and validate at import time', async () => {
    const { SENSOR_SOURCES } = await import('@/config/sensor-sources')
    expect(SENSOR_SOURCES.map((s) => s.id)).toEqual([
      'van-essen-diver',
      'wellntel',
    ])
    for (const shipped of SENSOR_SOURCES) {
      expect(shipped.alertRules.length).toBeGreaterThan(0)
      expect(shipped.metrics.length).toBeGreaterThan(0)
    }
  })
})
