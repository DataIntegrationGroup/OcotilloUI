import {
  Page,
  Text,
  View,
} from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import type { IWell } from '@/interfaces/ocotillo'
import type { FieldCompilationStyles } from '../styles'
import { PageFooter } from '../../layout/PageFooter'

// Page 4 of the field compilation packet. JSX moved verbatim out of
// page.tsx 294-303 (S1); the <Page> element wrapping it is the original.
export function BlankPage({
  well,
  styles,
  renderPageDate,
  showDate,
  firstPageOnly,
}: {
  well: IWell
  styles: FieldCompilationStyles
  renderPageDate: () => ReactElement
  showDate: boolean
  firstPageOnly?: boolean
}): ReactElement {
  return (
  <Page size="LETTER" style={styles.page}>
    <PageFooter wellId={well.name} pageNumber={4} styles={styles} totalPages={firstPageOnly ? 1 : 4} />
    {showDate ? (
      renderPageDate()
    ) : null}
    <View style={styles.pageFrame}>
      <View style={styles.blankPageBody}>
        <Text style={styles.blankPageText}>
          This page is intentionally left blank
        </Text>
      </View>
    </View>
  </Page>
  )
}
