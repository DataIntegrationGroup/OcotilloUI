import { pdf } from '@react-pdf/renderer'
import { BaseRecord, useNotification } from '@refinedev/core'
import { DownloadIcon } from 'lucide-react'
import { useState } from 'react'
import { FieldCompilationNotesPdf } from '@/components'
import { Button } from '@/components/ui/button'
import { PDF_SINGLE_PAGE_OPTION } from '@/config'
import { useAccessCapabilities } from '@/hooks'
import { IPdfOptions } from '@/interfaces'
import { IContact, IObservation, ISample, IWell } from '@/interfaces/ocotillo'
import { buildPdfFilename, SensorDeploymentRow } from '@/utils'
import { sampleMethodsBySampleId } from '@/utils/sampleMethods'

export const WellPDFDownloadButton = ({
  well,
  isLoading,
  observations,
  assets,
  contacts,
  sample,
  sensorDeployments = [],
  options,
  hydrographImage,
}: {
  well: IWell
  isLoading: boolean
  observations: readonly Partial<Omit<IObservation, 'created_at'>>[]
  assets: BaseRecord[]
  contacts: IContact[]
  sample?: Partial<ISample>
  sensorDeployments?: SensorDeploymentRow[]
  options?: IPdfOptions
  hydrographImage?: string | null
}) => {
  const { open: notify } = useNotification()
  const {
    isLoading: isPermissionsLoading,
    canManageAmp,
    canViewConfidential,
  } = useAccessCapabilities()

  const [isGenerating, setIsGenerating] = useState(false)

  const id = well?.id

  const disabled =
    isLoading || isPermissionsLoading || !canManageAmp || isGenerating

  const handleDownload = async (opts: IPdfOptions) => {
    if (!id) return

    try {
      setIsGenerating(true)
      const filename = buildPdfFilename(well)

      const blob = await pdf(
        <FieldCompilationNotesPdf
          well={well}
          assets={assets}
          contacts={contacts}
          observations={observations}
          sensorDeployments={sensorDeployments}
          includeConfidentialContacts={canViewConfidential}
          hydrographImage={hydrographImage}
          density={opts?.density ?? 'standard'}
          sampleMethodsBySampleId={sampleMethodsBySampleId(sample)}
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
      onClick={() => handleDownload(options ?? PDF_SINGLE_PAGE_OPTION)}
    >
      <DownloadIcon />
      {isGenerating ? 'Generating…' : 'Download PDF'}
    </Button>
  )
}
