import { Text, View } from '@react-pdf/renderer'
import type { FieldCompilationStyles } from '../fieldCompilation/styles'
import { renderValue } from '../fieldCompilation/format'

/**
 * Generic table column definition for PdfTable.
 */
export type TableColumn<T> = {
  key: keyof T | string
  label: string
  width: string
}

/**
 * Generic PDF table component — renders a bordered grid with header and data rows.
 * Handles empty-state fallback to a single null-row placeholder.
 */
export const PdfTable = <T extends Record<string, unknown>>({
  title,
  columns,
  rows,
  compact = false,
  styles,
  accentBarHeight = 9,
}: {
  title: string
  columns: readonly TableColumn<T>[]
  rows: T[]
  compact?: boolean
  styles: FieldCompilationStyles
  accentBarHeight?: number
}) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionTitleBar}>
      <View style={[styles.accentBar, { height: accentBarHeight }]} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        {columns.map((column) => (
          <Text
            key={column.label}
            style={[
              styles.cellHeader,
              ...(compact ? [styles.compactCellHeader] : []),
              { width: column.width },
            ]}
          >
            {column.label}
          </Text>
        ))}
      </View>
      {(rows.length > 0 ? rows : [Object.create(null) as T]).map(
        (row, rowIndex, arr) => (
          <View
            key={rowIndex}
            style={[
              styles.tableRow,
              ...(rowIndex === arr.length - 1 ? [styles.tableRowLast] : []),
            ]}
          >
            {columns.map((column) => (
              <Text
                key={column.label}
                style={[
                  styles.cell,
                  ...(compact ? [styles.compactCell] : []),
                  { width: column.width },
                ]}
              >
                {rows.length > 0
                  ? renderValue(row[column.key as keyof T])
                  : '-'}
              </Text>
            ))}
          </View>
        )
      )}
    </View>
  </View>
)
