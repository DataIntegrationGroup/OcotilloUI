import { useState } from 'react'
import {
  useDataProvider,
  useNotification,
  usePermissions,
} from '@refinedev/core'
import {
  IContact,
  IObservation,
  ISample,
  ISensor,
  IWell,
} from '@/interfaces/ocotillo'
import { WellPDF } from '@/components'
import {
  buildPdfFilename,
  buildSensorDeploymentRows,
  SensorDeploymentRow,
} from '@/utils'
import { pdf } from '@react-pdf/renderer'
import { Button } from '@mui/material'
import { Download } from '@mui/icons-material'
import { IPdfOptions } from '@/interfaces'
import { PDF_SINGLE_PAGE_OPTION } from '@/config'
import { getAccessControlGroups } from '@/providers/authentik-provider'

export const WellPDFDownloadButton = ({
  well,
  isLoading,
}: {
  well: IWell
  isLoading: boolean
}) => {
  const { open: notify } = useNotification()
  const { data: permissions, isLoading: isPermissionsLoading } =
    usePermissions<string[]>({})
  const dataProvider = useDataProvider()
  const ocotilloDataProvider = dataProvider('ocotillo')
  const groups = getAccessControlGroups() ?? []

  const id = well?.id

  const isViewer = permissions?.includes('AMPViewer') ?? groups.includes('AMPViewer')

  const [isGenerating, setIsGenerating] = useState(false)

  const disabled = !id || isPermissionsLoading || !isViewer || isGenerating

  const fetchAllPages = async <TRow,>(
    resource: string,
    params: Record<string, string | number>
  ) => {
    const pageSize = 1000
    const firstPage = await ocotilloDataProvider.getList({
      resource,
      pagination: { currentPage: 1, pageSize },
      meta: { params },
    })

    const totalPages = Math.max(1, Math.ceil(firstPage.total / pageSize))

    if (totalPages === 1) {
      return firstPage.data as TRow[]
    }

    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        ocotilloDataProvider.getList({
          resource,
          pagination: { currentPage: index + 2, pageSize },
          meta: { params },
        })
      )
    )

    return [
      ...(firstPage.data as TRow[]),
      ...remainingPages.flatMap((page) => page.data as TRow[]),
    ]
  }

  const handleDownload = async (opts: IPdfOptions) => {
    if (!id) return

    try {
      setIsGenerating(true)
      const filename = buildPdfFilename(well)
      const [sensorsResult, deploymentsResult, observations, assetsResult, contactsResult] =
        await Promise.all([
          ocotilloDataProvider.getList({
            resource: 'sensor',
            pagination: { currentPage: 1, pageSize: 1000 },
            meta: { params: { thing_id: id } },
          }),
          ocotilloDataProvider.getList({
            resource: `thing/${id}/deployment`,
            pagination: { currentPage: 1, pageSize: 1000 },
          }),
          fetchAllPages<IObservation>('observation/groundwater-level', {
            thing_id: id,
          }),
          ocotilloDataProvider.getList({
            resource: 'asset',
            pagination: { currentPage: 1, pageSize: 1000 },
            meta: { params: { thing_id: id } },
          }),
          ocotilloDataProvider.getList({
            resource: 'contact',
            pagination: { currentPage: 1, pageSize: 1000 },
            meta: { params: { thing_id: id } },
          }),
        ])

      const sensors = (sensorsResult.data ?? []) as ISensor[]
      const deployments = deploymentsResult.data as SensorDeploymentRow[]
      const sensorDeployments: SensorDeploymentRow[] = buildSensorDeploymentRows(
        deployments,
        sensors
      )
      const assets = assetsResult.data ?? []
      const contacts = (contactsResult.data ?? []) as IContact[]
      const sampleId =
        observations
          .filter((o) => o.observation_datetime)
          .sort(
            (a, b) =>
              new Date(b.observation_datetime!).getTime() -
              new Date(a.observation_datetime!).getTime()
          )[0]?.sample_id ?? null
      const sample = sampleId
        ? (await ocotilloDataProvider.getOne({
            resource: 'ocotillo.sample',
            id: sampleId,
          })).data as ISample
        : undefined

      const blob = await pdf(
        <WellPDF
          well={well}
          sample={sample}
          assets={assets}
          contacts={contacts}
          observations={observations}
          sensorDeployments={sensorDeployments}
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
      sx={{ pl: 1, pr: 1 }}
    >
      {isGenerating ? 'Generating...' : 'Download PDF'}
    </Button>
  )
}
