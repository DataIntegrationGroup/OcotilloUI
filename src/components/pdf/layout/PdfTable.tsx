import { Text, View } from '@react-pdf/renderer'
import type { FieldCompilationStyles } from '../fieldCompilation/styles'
import { renderValue } from '../fieldCompilation/format'

/**
 * Generic PDF table column definition for PdfTable. `width` stays documented
 * even though the render path no longer pins each cell to it — weightFromWidth
 * turns it into a proportional flexGrow so cells share the bounded row width.
 */
export type TableColumn<T> = {
  key: keyof T | string
  label: string
  width: string
}

/**
 * Parse a percentage-based column weight (e.g. "16.67%") into a proportional
 * grow weight used to fill the row. Keeping the trailing percentage as the
 * weight preserves the intended per-column proportions while Yoga grows each
 * child to fit the (now bounded) parent — so cells never overrun the right
 * page edge even when the percentages sum past 100%, which a pinned
 * { width } could not guarantee. flexBasis: 0 makes columns fill strictly by
 * these weights instead of being skewed by per-cell text width.
 */
function weightFromWidth(width: string): number {
  const parsed = Number.parseFloat(width)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
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
              { flexGrow: weightFromWidth(column.width), flexBasis: 0 },
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
                  { flexGrow: weightFromWidth(column.width), flexBasis: 0 },
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
