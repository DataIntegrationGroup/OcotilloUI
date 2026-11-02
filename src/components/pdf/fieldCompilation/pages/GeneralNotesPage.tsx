import {
  Page,
  Text,
  View,
} from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import type { IWell } from '@/interfaces/ocotillo'
import type { FieldCompilationStyles } from '../styles'
import { cutMethodColumns, cutMethodRows } from '../tables'

// Page 2 of the field compilation packet. JSX moved verbatim out of
// page.tsx 187-270 (S1); the <Page> element wrapping it is the original.
export function GeneralNotesPage({
  well,
  styles,
  accentBarHeight,
  renderPageDate,
  showDate,
}: {
  well: IWell
  styles: FieldCompilationStyles
  accentBarHeight: number
  renderPageDate: () => ReactElement
  showDate: boolean
}): ReactElement {
  return (
  <Page size="LETTER" style={styles.page}>
    {showDate ? (
      renderPageDate()
    ) : null}
    <Text style={styles.pageTitle}>
      General Field Notes: {well.name}
    </Text>
    <View style={styles.cutMethodBox}>
      <Text style={styles.cutMethodEquation}>
        HOLD - CUT = Depth to Water (below MP)
      </Text>
      <Text style={styles.cutMethodHint}>
        Cut method field entry for steel-tape measurements. Record HOLD,
        record CUT, then subtract CUT from HOLD to get depth to water
        below the measuring point (MP).
      </Text>
      <View style={styles.cutMethodTable}>
        <View style={styles.cutMethodTableRow}>
          <Text style={styles.cutMethodTableLabelCell}>Field</Text>
          {cutMethodColumns.map((column, index) => (
            <Text
              key={column}
              style={[
                styles.cutMethodTableHeaderCell,
                ...(index === cutMethodColumns.length - 1
                  ? [styles.cutMethodTableValueCellLast]
                  : []),
              ]}
            >
              {column}
            </Text>
          ))}
        </View>
        {cutMethodRows.map((rowLabel, rowIndex) => (
          <View
            key={rowLabel}
            style={[
              styles.cutMethodTableRow,
              ...(rowIndex === cutMethodRows.length - 1
                ? [styles.cutMethodTableRowLast]
                : []),
            ]}
          >
            <Text style={styles.cutMethodTableLabelCell}>
              {rowLabel}
            </Text>
            {cutMethodColumns.map((column, index) => (
              <View
                key={`${rowLabel}-${column}`}
                style={[
                  styles.cutMethodTableValueCell,
                  ...(index === cutMethodColumns.length - 1
                    ? [styles.cutMethodTableValueCellLast]
                    : []),
                ]}
              >
                <View style={styles.fillLine} />
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
    {/* General Field Notes — page 2 */}
    <View style={styles.sectionCard}>
      <View style={styles.sectionTitleBar}>
        <View
          style={[
            styles.accentBar,
            { height: accentBarHeight },
          ]}
        />
        <Text style={styles.sectionTitle}>General Field Notes</Text>
      </View>
      <View style={styles.notesPad}>
      {Array.from({ length: 20 }).map((_, index) => (
        <View
          key={`general-note-line-${index}`}
          style={styles.notesPadLine}
        />
      ))}
      </View>
    </View>
  </Page>
  )
}
