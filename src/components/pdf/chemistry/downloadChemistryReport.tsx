import { pdf } from '@react-pdf/renderer'
import type { ChemistryObservation } from '@/hooks/useChemistryReportData'
import type { IContact, IWell } from '@/interfaces/ocotillo'
import { buildChemistryReportFilename } from '@/utils/chemistryReport'
import {
  ChemistryReportPdf,
  type ChemistryReportSections,
} from './ChemistryReportPdf'

/**
 * Renders the report and hands it to the browser as a download. Returns the
 * filename so the caller can name it in a notification.
 */
export const downloadChemistryReport = async ({
  well,
  contacts,
  observations,
  year,
  sections,
}: {
  well: IWell
  contacts: readonly IContact[]
  observations: readonly ChemistryObservation[]
  year: number
  sections?: ChemistryReportSections
}): Promise<string> => {
  const filename = buildChemistryReportFilename(well, year)

  const blob = await pdf(
    <ChemistryReportPdf
      well={well}
      contacts={contacts}
      observations={observations}
      year={year}
      sections={sections}
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
