import { useState } from 'react'
import { IContact, IObservation, ISample, IWell } from '@/interfaces/ocotillo'
import { BaseRecord, useNotification, usePermissions } from '@refinedev/core'
import { WellPDF } from '@/components'
import { buildPdfFilename, SensorDeploymentRow } from '@/utils'
import { pdf } from '@react-pdf/renderer'
import { Button } from '@mui/material'
import { Download } from '@mui/icons-material'
import { IPdfOptions } from '@/interfaces'
import { PDF_SINGLE_PAGE_OPTION } from '@/config'
import { getAccessControlGroups } from '@/providers/authentik-provider'

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
  observations: readonly Partial<IObservation>[]
  assets: BaseRecord[]
  contacts: IContact[]
  sample?: Partial<ISample>
  sensorDeployments?: SensorDeploymentRow[]
  options?: IPdfOptions
  hydrographImage?: string | null
}) => {
  const { open: notify } = useNotification()
  const { data: permissions, isLoading: isPermissionsLoading } = usePermissions<
    string[]
  >({})
  const groups = getAccessControlGroups() ?? []

  const id = well?.id

  const isViewer =
    permissions?.includes('AMPViewer') ?? groups.includes('AMPViewer')

  const [isGenerating, setIsGenerating] = useState(false)

  const disabled =
    !isLoading || isPermissionsLoading || !isViewer || isGenerating

  const handleDownload = async (opts: IPdfOptions) => {
    if (!id) return

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
    <Button
      color="secondary"
      disabled={disabled}
      startIcon={<Download />}
      onClick={() => handleDownload(options ?? PDF_SINGLE_PAGE_OPTION)}
      sx={{ pl: 1, pr: 1 }}
    >
      {isGenerating ? 'Generating...' : 'Download PDF'}
    </Button>
  )
}
