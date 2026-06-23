import { useState } from 'react'
import { BaseRecord, useGo, useNotification } from '@refinedev/core'
import { useParams } from 'react-router'
import { DownloadIcon, EyeIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { WellPDF } from '@/components'
import { buildPdfFilename, SensorDeploymentRow } from '@/utils'
import { pdf } from '@react-pdf/renderer'
import { IContact, IObservation, ISample, IWell } from '@/interfaces/ocotillo'
import { IPdfOptions } from '@/interfaces'
import { PDF_SINGLE_PAGE_OPTION } from '@/config'
import { useAccessCapabilities } from '@/hooks'

type WellPDFActionsButtonProps = {
  isPreviewLoading: boolean
  isDownloadLoading: boolean
  well: IWell
  observations: readonly Partial<Omit<IObservation, 'created_at'>>[]
  assets: BaseRecord[]
  contacts: IContact[]
  sample?: Partial<ISample>
  sensorDeployments?: SensorDeploymentRow[]
  options?: IPdfOptions
  hydrographImage?: string | null
}

export const WellPDFActionsButton = ({
  isPreviewLoading,
  isDownloadLoading,
  well,
  observations,
  assets,
  contacts,
  sample,
  sensorDeployments = [],
  options,
  hydrographImage,
}: WellPDFActionsButtonProps) => {
  const go = useGo()
  const { id } = useParams()
  const { open: notify } = useNotification()
  const {
    isLoading: isPermissionsLoading,
    canManageAmp,
    canViewConfidential,
  } = useAccessCapabilities()

  const [isGenerating, setIsGenerating] = useState(false)

  const previewDisabled =
    isPreviewLoading || isPermissionsLoading || !canManageAmp

  const downloadDisabled =
    isDownloadLoading ||
    isPermissionsLoading ||
    !canManageAmp ||
    isGenerating

  const handlePreview = () => {
    go({ to: `/ocotillo/well/pdf-preview/${id}`, type: 'push' })
  }

  const handleDownload = async (opts: IPdfOptions) => {
    if (!well?.id) return

    try {
      setIsGenerating(true)
      const filename = buildPdfFilename(well)

      const blob = await pdf(
        <WellPDF
          well={well}
          sample={sample}
          assets={assets}
          contacts={contacts}
          observations={observations}
          sensorDeployments={sensorDeployments}
          includeConfidentialContacts={canViewConfidential}
          options={opts}
          hydrographImage={hydrographImage}
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
    <div className="inline-flex items-stretch rounded-lg border border-border bg-background overflow-hidden shadow-xs">
      <Button
        variant="ghost"
        size="sm"
        className="rounded-none border-0 shadow-none"
        disabled={previewDisabled}
        onClick={handlePreview}
      >
        <EyeIcon />
        Preview PDF
      </Button>
      <div className="w-px self-stretch bg-border shrink-0" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none border-0 px-2.5 shadow-none"
            disabled={downloadDisabled}
            onClick={() => handleDownload(options ?? PDF_SINGLE_PAGE_OPTION)}
            aria-label={isGenerating ? 'Generating PDF' : 'Download PDF'}
          >
            <DownloadIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isGenerating ? 'Generating…' : 'Download PDF'}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
