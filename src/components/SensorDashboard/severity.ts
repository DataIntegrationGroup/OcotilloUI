import type { AlertSeverity } from '@/config/sensor-sources'

/**
 * Single place mapping alert severity onto MUI palette slots and copy, so the
 * tiles, chips, grid cells, and alert list cannot drift apart.
 */

export const SEVERITY_COLOR: Record<
  AlertSeverity,
  'success' | 'warning' | 'error'
> = {
  ok: 'success',
  warning: 'warning',
  critical: 'error',
}

export const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  ok: 'Healthy',
  warning: 'Warning',
  critical: 'Critical',
}

/** Order used for tiles and legends: worst first. */
export const SEVERITY_DISPLAY_ORDER: AlertSeverity[] = [
  'critical',
  'warning',
  'ok',
]
