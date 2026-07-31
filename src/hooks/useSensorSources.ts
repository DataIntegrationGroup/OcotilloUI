import { useQueries, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import type { AlertSummary } from '@/components/SensorDashboard/sensorAlerts'
import {
  evaluateSource,
  summarizeDevices,
} from '@/components/SensorDashboard/sensorAlerts'
import type { SensorSourceConfig } from '@/config/sensor-sources'
import { enabledSensorSources } from '@/config/sensor-sources'
import type {
  PendingBatch,
  SensorAlert,
  SensorDevice,
  SensorSourceSnapshot,
  SensorSourceStatus,
} from '@/interfaces/sensor-dashboard'
import { sensorSourceClient } from '@/providers/sensor-source-provider'

/**
 * Loads every enabled sensor source and evaluates its alert rules.
 *
 * One query per source per endpoint, so a vendor cloud being down degrades
 * only its own card instead of blanking the dashboard.
 */

const STATUS_KEY = 'sensor-source-status'
const DEVICE_KEY = 'sensor-source-devices'
const PENDING_KEY = 'sensor-source-pending'

/** Telemetry arrives hourly at best; polling harder just burns vendor quota. */
const REFETCH_INTERVAL_MS = 5 * 60_000

export interface SensorSourceView extends SensorSourceSnapshot {
  config: SensorSourceConfig
  isLoading: boolean
  error: Error | null
  summary: AlertSummary
}

export interface UseSensorSourcesResult {
  sources: SensorSourceView[]
  /** Alerts across every source, worst-first. */
  alerts: SensorAlert[]
  /** Device counts by worst severity, across every source. */
  summary: AlertSummary
  pending: PendingBatch[]
  isLoading: boolean
  refetch: () => Promise<void>
}

const EMPTY_STATUS = (source: SensorSourceConfig): SensorSourceStatus => ({
  sourceId: source.id,
  reachable: false,
  deviceCount: 0,
  lastPolledAt: null,
  error: null,
})

export const useSensorSources = (): UseSensorSourcesResult => {
  const queryClient = useQueryClient()
  const configs = useMemo(() => enabledSensorSources(), [])

  const statusQueries = useQueries({
    queries: configs.map((source) => ({
      queryKey: [STATUS_KEY, source.id],
      queryFn: () => sensorSourceClient.getStatus(source),
      refetchInterval: REFETCH_INTERVAL_MS,
    })),
  })

  const deviceQueries = useQueries({
    queries: configs.map((source) => ({
      queryKey: [DEVICE_KEY, source.id],
      queryFn: () => sensorSourceClient.getDevices(source),
      refetchInterval: REFETCH_INTERVAL_MS,
    })),
  })

  const pendingQueries = useQueries({
    queries: configs.map((source) => ({
      queryKey: [PENDING_KEY, source.id],
      queryFn: () => sensorSourceClient.getPending(source),
      refetchInterval: REFETCH_INTERVAL_MS,
    })),
  })

  const sources = useMemo<SensorSourceView[]>(() => {
    // `now` is captured once per recomputation so every source is evaluated
    // against the same instant -- otherwise two cards can disagree about
    // whether a device is stale.
    const now = new Date()

    return configs.map((config, index) => {
      const statusQuery = statusQueries[index]
      const deviceQuery = deviceQueries[index]
      const pendingQuery = pendingQueries[index]

      const devices: SensorDevice[] = deviceQuery?.data ?? []
      const alerts = evaluateSource(devices, config, now)
      const error =
        (statusQuery?.error as Error | null) ??
        (deviceQuery?.error as Error | null) ??
        (pendingQuery?.error as Error | null) ??
        null

      const status = statusQuery?.data ?? EMPTY_STATUS(config)

      return {
        config,
        sourceId: config.id,
        status: error
          ? { ...status, reachable: false, error: error.message }
          : status,
        devices,
        alerts,
        pending: pendingQuery?.data ?? [],
        summary: summarizeDevices(devices, alerts),
        isLoading:
          Boolean(statusQuery?.isLoading) ||
          Boolean(deviceQuery?.isLoading) ||
          Boolean(pendingQuery?.isLoading),
        error,
      }
    })
  }, [configs, statusQueries, deviceQueries, pendingQueries])

  const refetch = useCallback(async () => {
    await Promise.all(
      [STATUS_KEY, DEVICE_KEY, PENDING_KEY].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
      )
    )
  }, [queryClient])

  return useMemo(() => {
    const alerts = sources
      .flatMap((source) => source.alerts)
      // Critical first so the alert panel needs no scrolling to be useful.
      .sort((a, b) => {
        if (a.severity === b.severity)
          return a.deviceLabel.localeCompare(b.deviceLabel)
        return a.severity === 'critical' ? -1 : 1
      })

    const summary = sources.reduce<AlertSummary>(
      (total, source) => ({
        ok: total.ok + source.summary.ok,
        warning: total.warning + source.summary.warning,
        critical: total.critical + source.summary.critical,
      }),
      { ok: 0, warning: 0, critical: 0 }
    )

    return {
      sources,
      alerts,
      summary,
      pending: sources.flatMap((source) => source.pending),
      isLoading: sources.some((source) => source.isLoading),
      refetch,
    }
  }, [sources, refetch])
}
