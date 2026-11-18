import { Document } from '@react-pdf/renderer'
import type { BaseRecord } from '@refinedev/core'
import type { IContact, IObservation, IWell } from '@/interfaces/ocotillo'
import type { SensorDeploymentRow } from '@/utils'
import { buildPdfFilename } from '@/utils'
import FieldCompilationNotesPage from './fieldCompilation/FieldCompilationNotesPage'

export const FieldCompilationNotesPdf = ({
  well,
  contacts,
  assets,
  observations,
  sensorDeployments = [],
  hydrographImage,
  sampleMethodsBySampleId = {},
  staffBySampleId = {},
  includeConfidentialContacts = true,
  standalone = true,
  qrDataUrl,
}: {
  well: IWell
  contacts: IContact[]
  assets: BaseRecord[]
  observations: readonly Partial<IObservation>[]
  sensorDeployments?: SensorDeploymentRow[]
  hydrographImage?: string | null
  sampleMethodsBySampleId?: Record<number, string>
  /** Staff on the visit behind each sample — Last Measurements · Staff. */
  staffBySampleId?: Record<number, string>
  includeConfidentialContacts?: boolean
  /**
   * true (default): a complete <Document> — field sheet + owner leave-behind.
   * false: bare field-sheet <Page> for embedding in a parent document (batch
   * export); the owner page stays behind this flag.
   */
  standalone?: boolean
  qrDataUrl?: string
}) => {
  const pages = (
    <FieldCompilationNotesPage
      well={well}
      contacts={contacts}
      assets={assets}
      observations={observations}
      sensorDeployments={sensorDeployments}
      hydrographImage={hydrographImage}
      sampleMethodsBySampleId={sampleMethodsBySampleId}
      staffBySampleId={staffBySampleId}
      includeConfidentialContacts={includeConfidentialContacts}
      qrDataUrl={qrDataUrl}
      includeOwnerPage={standalone}
    />
  )

  if (!standalone) return pages

  return (
    <Document
      title={buildPdfFilename(well)}
      subject="Field Compilation Notes"
      author="Ocotillo UI"
    >
      {pages}
    </Document>
  )
}
