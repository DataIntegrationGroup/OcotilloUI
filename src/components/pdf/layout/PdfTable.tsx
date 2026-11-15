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

/** Returns true if every non-empty cell value parses as a finite number. */
function isNumericColumn<T>(rows: T[], key: keyof T | string): boolean {
  if (rows.length === 0) return false
  return rows.some((row) => {
    const val = (row as Record<string, unknown>)[key as string]
    return val != null && val !== ''
  }) && rows.every((row) => {
    const val = (row as Record<string, unknown>)[key as string]
    if (val == null || val === '') return true // skip blanks
    return isFinite(Number(val))
  })
}

/** Colour a status cell by value. Returns [{ backgroundColor }, { color }] or undefined. */
function statusStyle(value: unknown): { backgroundColor: string; color: string } | undefined {
  const str = typeof value === 'string' ? value.trim() : String(value ?? '')
  if (['rising', 'normal', 'stable'].includes(str.toLowerCase())) {
    return { backgroundColor: '#d1fae6', color: '#047857' } // green chip
  }
  if (str.toLowerCase() === 'declining') {
    return { backgroundColor: '#fef3c7', color: '#92400e' } // amber chip
  }
  if (str) {
    return { backgroundColor: '#e5e7eb', color: '#374151' } // grey chip
  }
  return undefined
}

/** Format a status label to title-ish uppercase. */
function statusLabel(label: string): string {
  return label.toUpperCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Render one cell value — empty/null become blank, never '—' or zero as text. */
function cellText(value: unknown): string {
  if (value == null || value === '' || Number(value) === 0) return ''
  return String(value)
}

/**
 * Generic PDF table component — renders a bordered grid with header and data rows,
 * styled per the mk-1 chrome specification.
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
}): JSX.Element => {
  // Pre-compute column classifications
  const numCols = new Set<string>()
  const statusColIdx: number[] = []
  columns.forEach((col, i) => {
    if (isNumericColumn(rows, col.key)) numCols.add(col.label)
    if (col.label === 'Level Status') statusColIdx.push(i)
  })

  const effectiveRows = rows.length > 0 ? rows : [Object.create(null) as T]

  return (
    <View style={styles.sectionCard}>
      {/* Title band: light fill + 2pt dark accent bar flush left, title text.
          Skipped entirely when the title is empty so there is no ghost band */}
      {title ? (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#f3f4f6',
          borderWidth: 1,
          borderColor: '#d1d5db',
          borderBottomWidth: 0,
          paddingHorizontal: 8,
          height: 22,
        }}
      >
        <View style={{ width: 2, backgroundColor: '#1f2937' }} />
        <Text
          style={{
            marginLeft: 6,
            fontSize: compact ? 7.5 : 9,
            fontWeight: '700',
            color: '#1f2937',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {title}
        </Text>
      </View>
      ) : null}

      {/* Table body */}
      <View style={{ borderWidth: 1, borderColor: '#d1d5db' }}>
        {/* Header row — dark fill, white bold uppercase, no wrap-breaking */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#374151',
            borderBottomWidth: 1,
            borderColor: '#4b5563',
          }}
        >
          {columns.map((column) => (
            <Text
              key={column.label}
              style={[
                compact ? styles.compactCellHeader : styles.cellHeader,
                {
                  flexGrow: weightFromWidth(column.width),
                  flexBasis: 0,
                  color: '#ffffff',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 0.3,
                  textAlign: 'left',
                },
              ]}
            >
              {statusLabel(column.label)}
            </Text>
          ))}
        </View>

        {/* Body rows — zebra stripe, 1pt column rules */}
        {effectiveRows.map((row, rowIndex) => {
          const isLast = rowIndex === effectiveRows.length - 1
          const isEven = rowIndex % 2 === 0
          return (
            <View
              key={rowIndex}
              style={[
                {
                  flexDirection: 'row',
                  borderBottomWidth: isLast ? 0 : 1,
                  borderRightWidth: 1,
                  borderColor: '#d1d5db',
                  backgroundColor: isEven ? '#fafafa' : undefined,
                },
                ...(isLast ? [{ borderRightWidth: 0 }] : []),
              ]}
            >
              {columns.map((column, colIndex) => {
                const val = row[column.key as keyof T]
                const isStatusCell = statusColIdx.includes(colIndex)
                const isNumericCell = numCols.has(column.label)

                // Status chip styles
                const statusSty = isStatusCell ? statusStyle(val) : undefined

                let textStyle: any = {
                  flexGrow: weightFromWidth(column.width),
                  flexBasis: 0,
                  paddingVertical: compact ? 2 : 3,
                  paddingHorizontal: compact ? 2 : 3,
                  fontSize: compact ? 7.5 : 9,
                  lineHeight: 1.1,
                  color: '#1f2937',
                }

                if (isStatusCell && statusSty) {
                  textStyle = {
                    ...textStyle,
                    backgroundColor: statusSty.backgroundColor,
                    color: statusSty.color,
                    fontWeight: '600',
                    textAlign: 'center',
                    borderRadius: 3,
                  }
                } else if (isNumericCell) {
                  textStyle = {
                    ...textStyle,
                    textAlign: 'right',
                  }
                }

                return (
                  <Text key={column.label} style={textStyle}>
                    {cellText(val)}
                  </Text>
                )
              })}
            </View>
          )
        })}
      </View>
    </View>
  )
}
