import { useState } from 'react'
import { BaseRecord, useNotification } from '@refinedev/core'
import { IContact, IObservation, IWell } from '@/interfaces/ocotillo'
import { FieldCompilationNotesPdf, WellPDF } from '@/components'
import {
  buildWeaverQrDataUrl,
  buildWellMapsQrDataUrl,
} from '@/components/pdf/chemistry/wellQrCode'
import { buildPdfFilename, SensorDeploymentRow } from '@/utils'
import { pdf } from '@react-pdf/renderer'
import { DownloadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccessCapabilities } from '@/hooks'

export const WellPDFDownloadButton = ({
  well,
  isLoading,
  observations,
  assets,
  contacts,
  sensorDeployments = [],
  hydrographImage,
  includeOwnerPage,
}: {
  well: IWell
  isLoading: boolean
  observations: readonly Partial<Omit<IObservation, 'created_at'>>[]
  assets: BaseRecord[]
  contacts: IContact[]
  sensorDeployments?: SensorDeploymentRow[]
  hydrographImage?: string | null
  /** Page 2 (owner leave-behind) — single-well downloads include it. */
  includeOwnerPage?: boolean
}) => {
  const { open: notify } = useNotification()
  const {
    isLoading: isPermissionsLoading,
    canEditAmp,
    canViewConfidential,
  } = useAccessCapabilities()

  const [isGenerating, setIsGenerating] = useState(false)

  const id = well?.id

  const disabled =
    isLoading || isPermissionsLoading || !canEditAmp || isGenerating

  const handleDownload = async () => {
    if (!id) return

    try {
      setIsGenerating(true)
      const filename = buildPdfFilename(well)
      // Same value the page-2 URL line prints (buildWeaverLocationUrl(well.name)).
      // Page 1: Google Maps at the well coordinates; page 2: Weaver well page.
      const [qrDataUrl, mapsQrDataUrl] = await Promise.all([
        buildWeaverQrDataUrl(well.name).then((url) => url ?? undefined),
        buildWellMapsQrDataUrl(well),
      ])

      const blob = await pdf(
        <FieldCompilationNotesPdf
          well={well}
          assets={assets}
          contacts={contacts}
          observations={observations}
          sensorDeployments={sensorDeployments}
          includeConfidentialContacts={canViewConfidential}
          hydrographImage={hydrographImage}
          qrDataUrl={qrDataUrl}
          mapsQrDataUrl={mapsQrDataUrl}
          includeOwnerPage={includeOwnerPage}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
      a.click()
      URL.revokeObjectURL(url)

      notify?.({
        message: 'PDF generated successfully',
        type: 'success',
        description: a.download,
      })
    } catch (error) {
      console.error(error)
      notify?.({
        message: 'PDF Generation Failed',
        type: 'error',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={handleDownload}
    >
      <DownloadIcon />
      {isGenerating ? 'Generating…' : 'Download PDF'}
    </Button>
  )
}
