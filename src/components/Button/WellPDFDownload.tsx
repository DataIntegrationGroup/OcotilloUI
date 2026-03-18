import { useState } from 'react'
import {
  useNotification,
  useList,
  useOne,
} from '@refinedev/core'
import { useDataGrid } from '@refinedev/mui'
import { IContact, ISample, ISensor, IWell } from '@/interfaces/ocotillo'
import { WellPDF } from '@/components'
import { buildPdfFilename, SensorDeploymentRow } from '@/utils'
import { pdf } from '@react-pdf/renderer'
import { Button } from '@mui/material'
import { Download } from '@mui/icons-material'
import { IPdfOptions } from '@/interfaces'
import { PDF_SINGLE_PAGE_OPTION } from '@/config'
import { useAccessCapabilities, useSensorDeploymentRows } from '@/hooks'

export const WellPDFDownloadButton = ({
  well,
  isLoading,
}: {
  well: IWell
  isLoading: boolean
}) => {
  const { open: notify } = useNotification()
  const { isLoading: isPermissionsLoading, canViewAmp, canViewConfidential } =
    useAccessCapabilities()

  const id = well?.id

  const { dataGridProps: sensorDataGridProps } = useDataGrid<ISensor>({
    resource: 'sensor',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_id: id,
      },
    },
    queryOptions: {
      gcTime: 10 * 60 * 1000, // cached data for 10 minutes
      staleTime: 5 * 60 * 1000, // get data fresh for 5 minutes,
    },
  })

  const { dataGridProps: deploymentsDataGridProps } = useDataGrid({
    resource: id ? `thing/${id}/deployment` : undefined,
    dataProviderName: 'ocotillo',
    queryOptions: {
      enabled: Boolean(id),
      gcTime: 10 * 60 * 1000, // cached data for 10 minutes
      staleTime: 5 * 60 * 1000, // get data fresh for 5 minutes,
    },
  })

  const sensors = sensorDataGridProps?.rows ?? []
  const deployments = deploymentsDataGridProps?.rows ?? []

  const sensorDeployments: SensorDeploymentRow[] = useSensorDeploymentRows({
    deployments,
    sensors,
  })

  const {
    dataGridProps: { rows: observations, loading: isObservationsLoading },
  } = useDataGrid({
    resource: 'observation/groundwater-level',
    dataProviderName: 'ocotillo',
    meta: {
      params: { thing_id: well?.id },
    },
    queryOptions: {
      gcTime: 10 * 60 * 1000,
      staleTime: 5 * 60 * 1000,
    },
  })

  const { result: assetData } = useList({
    resource: 'asset',
    dataProviderName: 'ocotillo',
    meta: { params: { thing_id: well?.id } },
  })

  const { result: contactData } = useList<IContact>({
    resource: 'contact',
    dataProviderName: 'ocotillo',
    meta: { params: { thing_id: well?.id } },
  })

  const assets = assetData?.data ?? []
  const contacts = contactData?.data ?? []

  const sampleId =
    observations
      ?.filter((o) => o.observation_datetime) // only ones with date
      .sort((a, b) => {
        // Newest first
        return (
          new Date(b.observation_datetime!).getTime() -
          new Date(a.observation_datetime!).getTime()
        )
      })[0]?.sample_id ?? null

  const { result: sampleData, query: sampleQuery } = useOne<ISample>({
    resource: 'ocotillo.sample',
    id: sampleId,
    queryOptions: {
      enabled: !!sampleId,
    },
  })

  const sample = sampleData

  const [isGenerating, setIsGenerating] = useState(false)

  const disabled =
    isLoading ||
    isPermissionsLoading ||
    !canViewAmp ||
    isGenerating ||
    isObservationsLoading ||
    sampleQuery.isLoading

  const handleDownload = async (opts: IPdfOptions) => {
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
      onClick={() => handleDownload(PDF_SINGLE_PAGE_OPTION)}
      sx={{ pl: 3, pr: 2 }}
    >
      {isGenerating ? 'Generating...' : 'Download PDF'}
    </Button>
  )
}
