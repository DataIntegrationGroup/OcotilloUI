import {
  Image,
  Page,
  Text,
  View,
} from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import type { IWell } from '@/interfaces/ocotillo'
import { PdfTable } from '../../layout/PdfTable'
import type { FieldCompilationStyles } from '../styles'
import { PageFooter } from '../../layout/PageFooter'
import { manualMeasurementColumns } from '../tables'

// Page 3 of the field compilation packet. JSX moved verbatim out of
// page.tsx 272-292 (S1); the <Page> element wrapping it is the original.
export function HydrographMeasurementsPage({
  well,
  styles,
  renderPageDate,
  showDate,
  hydrographImage,
  manualMeasurements,
  firstPageOnly,
}: {
  well: IWell
  styles: FieldCompilationStyles
  renderPageDate: () => ReactElement
  showDate: boolean
  hydrographImage?: string | null
  manualMeasurements: ReturnType<
    typeof import('../format').manualMeasurementRows
  >
  firstPageOnly?: boolean
}): ReactElement {
  return (
  <Page size="LETTER" style={styles.page}>
    <PageFooter wellId={well.name} pageNumber={3} styles={styles} totalPages={firstPageOnly ? 1 : 4} />
    {showDate ? (
      renderPageDate()
    ) : null}
    <View style={styles.pageFrame}>
      <Text style={styles.pageTitle}>
        Hydrograph and Manual Measurements: {well.name}
      </Text>
      {hydrographImage ? (
        <Image src={hydrographImage} style={styles.hydrographImage} />
      ) : (
        <Text style={styles.hydrographEmptyState}>
          Hydrograph unavailable for this well.
        </Text>
      )}
      <PdfTable
        styles={styles}
        title="Manual Measurements"
        columns={manualMeasurementColumns}
        rows={manualMeasurements}
      />
    </View>
  </Page>
  )
}
