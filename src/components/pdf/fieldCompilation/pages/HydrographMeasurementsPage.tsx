import {
  Image,
  Page,
  Text,
} from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import type { IWell } from '@/interfaces/ocotillo'
import { PdfTable } from '../../layout/PdfTable'
import type { FieldCompilationStyles } from '../styles'
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
}: {
  well: IWell
  styles: FieldCompilationStyles
  renderPageDate: () => ReactElement
  showDate: boolean
  hydrographImage?: string | null
  manualMeasurements: ReturnType<
    typeof import('../format').manualMeasurementRows
  >
}): ReactElement {
  return (
  <Page size="LETTER" style={styles.page}>
    {showDate ? (
      renderPageDate()
    ) : null}
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
  </Page>
  )
}
