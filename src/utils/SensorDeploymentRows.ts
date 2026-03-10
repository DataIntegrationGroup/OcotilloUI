export interface SensorLike {
  id: number
  name?: string | null
  model?: string | null
  notes?: string | null
  sensor_type?: string | null
  serial_no?: string | null
  thing_id?: string | number | null
  release_status?: string | null
}

export interface DeploymentLike {
  id: number | string
  sensor?: SensorLike | null
  thing_id?: string | number | null
  installation_date?: string | null
  removal_date?: string | null
  hanging_cable_length?: number | null
  recording_interval?: number | string | null
  recording_interval_units?: string | null
  release_status?: string | null
  notes?: string | null
}

interface DeploymentRow extends DeploymentLike {
  isUnattached?: boolean
}

export type SensorDeploymentRow = DeploymentLike & {
  // row identity / classification
  isUnattached?: boolean

  // convenient flattened fields for tables/PDF
  sensor_id: number | null
  sensor_name: string
  sensor_type: string
  sensor_model: string
  serial_no: string

  datetime_installed: string | null
  datetime_removed: string | null

  recording_interval_display: string | null
}

export function buildSensorDeploymentRows(
  deployments: readonly DeploymentLike[],
  sensors: readonly SensorLike[]
): SensorDeploymentRow[] {
  const deployedSensorIds = new Set<number>(
    deployments
      .map((d) => d.sensor?.id)
      .filter((id): id is number => typeof id === 'number')
  )

  const unattachedRows: DeploymentRow[] = sensors
    .filter((s) => !deployedSensorIds.has(s.id))
    .map((s) => ({
      id: `sensor-${s.id}`,
      sensor: s,
      thing_id: s.thing_id ?? null,
      installation_date: null,
      removal_date: null,
      release_status: s.release_status ?? null,
      notes: null,
      hanging_cable_length: null,
      recording_interval: null,
      recording_interval_units: null,
      isUnattached: true,
    }))

  const allRows: DeploymentRow[] = [...deployments, ...unattachedRows]

  return allRows.map((r) => ({
    ...r,
    sensor_id: r.sensor?.id ?? null,
    sensor_name:
      r.sensor?.name?.trim() || (r.isUnattached ? '(unattached)' : '-'),
    sensor_model: r.sensor?.model?.trim() || '-',
    sensor_type: r.sensor?.sensor_type?.trim() || '-',
    serial_no: r.sensor?.serial_no?.trim() || '-',
    datetime_installed: r.installation_date ?? null,
    datetime_removed: r.removal_date ?? null,
    recording_interval_display:
      r.recording_interval != null
        ? `${r.recording_interval} ${r.recording_interval_units ?? ''}`.trim()
        : null,
    notes: r?.sensor?.notes?.trim() || '-',
  }))
}
