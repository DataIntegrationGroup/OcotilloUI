import {
  Page,
  Text,
  View,
} from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import type { FieldCompilationStyles } from '../styles'

// Page 4 of the field compilation packet. JSX moved verbatim out of
// page.tsx 294-303 (S1); the <Page> element wrapping it is the original.
export function BlankPage({
  styles,
  renderPageDate,
  showDate,
}: {
  styles: FieldCompilationStyles
  renderPageDate: () => ReactElement
  showDate: boolean
}): ReactElement {
  return (
  <Page size="LETTER" style={styles.page}>
    {showDate ? (
      renderPageDate()
    ) : null}
    <View style={styles.blankPageBody}>
      <Text style={styles.blankPageText}>
        This page is intentionally left blank
      </Text>
    </View>
  </Page>
  )
}
