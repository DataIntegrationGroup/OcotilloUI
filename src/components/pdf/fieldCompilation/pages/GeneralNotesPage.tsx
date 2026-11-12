import { Page, Text, View } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import type { IWell } from '@/interfaces/ocotillo'
import type { FieldCompilationStyles } from '../styles'
import { PageFooter } from '../../layout/PageFooter'

// Page 2 of the field compilation packet. JSX moved verbatim out of
// page.tsx 187-270 (S1); the <Page> element wrapping it is the original.
export function GeneralNotesPage({
  well,
  styles,
  accentBarHeight,
  renderPageDate,
  showDate,
  firstPageOnly,
}: {
  well: IWell
  styles: FieldCompilationStyles
  accentBarHeight: number
  renderPageDate: () => ReactElement
  showDate: boolean
  firstPageOnly?: boolean
}): ReactElement {
  return (
    <Page size="LETTER" style={styles.page}>
      <PageFooter wellId={well.name} pageNumber={2} styles={styles} totalPages={firstPageOnly ? 1 : 4} />
      {showDate ? renderPageDate() : null}
      <View style={styles.pageFrame}>
        <Text style={styles.pageTitle}>General Field Notes: {well.name}</Text>
        {/* General Field Notes — page 2 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleBar}>
            <View style={[styles.accentBar, { height: accentBarHeight }]} />
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
      </View>
    </Page>
  )
}
