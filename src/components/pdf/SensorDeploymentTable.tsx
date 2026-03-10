import { View, Text } from '@react-pdf/renderer'
import type { SensorDeploymentRow } from '@/utils'
import { createPdfStyles } from '@/utils'

export function SensorDeploymentTable({
  rows,
  styles,
}: {
  rows: SensorDeploymentRow[]
  styles: ReturnType<typeof createPdfStyles>
}) {
  const header = [
    'Equipment Type',
    'Model',
    'Serial No.',
    'Hanging Cable Length',
    'Date Installed',
    'Recording Interval',
    'Equipment Notes',
  ] as const

  if (rows.length === 0) return null

  return (
    <View style={styles.table}>
      {/* Header */}
      <View style={styles.tableRowHeader}>
        {header.map((h) => (
          <Text key={h} style={styles.tableCellHeader}>
            {h}
          </Text>
        ))}
      </View>

      {/* Rows */}
      {rows.map((r) => (
        <View key={String(r.id)} style={styles.tableRow}>
          <Text style={styles.tableCell}>{r.sensor_type}</Text>
          <Text style={styles.tableCell}>{r.sensor_model}</Text>
          <Text style={styles.tableCell}>{r.serial_no}</Text>
          <Text style={styles.tableCell}>{r.hanging_cable_length}</Text>
          <Text style={styles.tableCell}>{r.datetime_installed ?? '-'}</Text>
          <Text style={styles.tableCell}>
            {r.recording_interval_display ?? '-'}
          </Text>
          <Text style={styles.tableCell}>{r.notes ?? '-'}</Text>
        </View>
      ))}
    </View>
  )
}
