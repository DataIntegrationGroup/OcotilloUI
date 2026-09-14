import { pdf } from '@react-pdf/renderer'
import type { ChemistryResult } from '@/hooks/useChemistryReportData'
import type { IContact, IWell } from '@/interfaces/ocotillo'
import {
  buildChemistryReportFilename,
  type ContinuousWaterLevelSummary,
  type WaterLevelReading,
} from '@/utils/chemistryReport'
import {
  CHEMISTRY_REPORT_DEFAULT_SECTIONS,
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
  continuous,
  year,
  sections,
}: {
  well: IWell
  contacts: readonly IContact[]
  observations: readonly ChemistryResult[]
  waterLevels?: readonly WaterLevelReading[]
  continuous?: ContinuousWaterLevelSummary | null
  year: number
  sections?: ChemistryReportSections
}): Promise<string> => {
  // The year names the water levels, so it only belongs on the file when one
  // of the water level sections is actually in the report.
  const resolved = sections ?? CHEMISTRY_REPORT_DEFAULT_SECTIONS
  const carriesYear =
    resolved.waterLevels ||
    (resolved.continuousMonitoring && continuous != null)
  const filename = buildChemistryReportFilename(well, carriesYear ? year : null)
  const qrCodeDataUrl = await buildWeaverQrDataUrl(well.name)

  const blob = await pdf(
    <ChemistryReportPdf
      well={well}
      contacts={contacts}
      observations={observations}
      waterLevels={waterLevels}
      continuous={continuous}
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
