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
  includeOwnerPage = standalone,
  qrDataUrl,
  mapsQrDataUrl,
  fieldStaffContact,
  hotlinePhone,
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
  /**
   * Page 2 (owner leave-behind). Defaults to `standalone`: the single-well
   * preview and download include it, batch embeds start without it. Both
   * surfaces expose an Owner Sheet toggle (mockup: wells PDF preview rail,
   * batch export dialog) that sets this explicitly.
   */
  includeOwnerPage?: boolean
  qrDataUrl?: string
  /**
   * Page-1 QR beside the ident grid: Google Maps at the well coordinates
   * (buildGoogleMapsQrDataUrl). Omitted/empty -> no image, layout unchanged.
   */
  mapsQrDataUrl?: string | null
  /**
   * Page-2 footer field staff (full name · phone · email). Optional: when omitted
   * the page falls back to the staff named on the latest measurement, matched
   * against the well's loaded contacts.
   */
  fieldStaffContact?: IContact
  /** 24-hour line on page 2; falls back to the page's placeholder number. */
  hotlinePhone?: string
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
      mapsQrDataUrl={mapsQrDataUrl}
      fieldStaffContact={fieldStaffContact}
      includeOwnerPage={includeOwnerPage}
      hotlinePhone={hotlinePhone}
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
