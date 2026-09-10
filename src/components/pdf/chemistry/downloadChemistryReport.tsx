import { pdf } from '@react-pdf/renderer'
import type { ChemistryResult } from '@/hooks/useChemistryReportData'
import type { IContact, IWell } from '@/interfaces/ocotillo'
import {
  buildChemistryReportFilename,
  type WaterLevelReading,
} from '@/utils/chemistryReport'
import {
  ChemistryReportPdf,
  type ChemistryReportSections,
} from './ChemistryReportPdf'
import { buildWeaverQrDataUrl } from './wellQrCode'

/**
 * Renders the report and hands it to the browser as a download. Returns the
 * filename so the caller can name it in a notification.
 */
export const downloadChemistryReport = async ({
  well,
  contacts,
  observations,
  waterLevels,
  year,
  sections,
}: {
  well: IWell
  contacts: readonly IContact[]
  observations: readonly ChemistryResult[]
  waterLevels?: readonly WaterLevelReading[]
  year: number
  sections?: ChemistryReportSections
}): Promise<string> => {
  const filename = buildChemistryReportFilename(well, year)
  const qrCodeDataUrl = await buildWeaverQrDataUrl(well.name)

  const blob = await pdf(
    <ChemistryReportPdf
      well={well}
      contacts={contacts}
      observations={observations}
      waterLevels={waterLevels}
      year={year}
      sections={sections}
      qrCodeDataUrl={qrCodeDataUrl}
    />
  ).toBlob()

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)

  return filename
}
