import { pdf } from '@react-pdf/renderer'
import { BaseRecord, useGo, useNotification } from '@refinedev/core'
import { DownloadIcon, EyeIcon } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { WellPDF } from '@/components'
import { downloadChemistryReport } from '@/components/pdf/chemistry'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PDF_SINGLE_PAGE_OPTION } from '@/config'
import { useAccessCapabilities, useWellChemistryReport } from '@/hooks'
import { IPdfOptions } from '@/interfaces'
import { IContact, IObservation, ISample, IWell } from '@/interfaces/ocotillo'
import { buildPdfFilename, SensorDeploymentRow } from '@/utils'

/** The kinds of PDF the well details page can produce. */
export type WellReportType = 'field-sheet' | 'chemistry-report'

const REPORT_TYPE_LABELS: Record<WellReportType, string> = {
  'field-sheet': 'Field sheet',
  'chemistry-report': 'Chemistry report',
}

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
    canViewAmpStaging,
  } = useAccessCapabilities()

  const [reportType, setReportType] = useState<WellReportType>('field-sheet')
  const [isGenerating, setIsGenerating] = useState(false)

  const isChemistry = reportType === 'chemistry-report'

  const {
    reportYear,
    hasChemistry,
    isLoading: isChemistryLoading,
    fetchYearObservations,
  } = useWellChemistryReport({
    thingId: id,
    // Only worth asking once the report is on offer at all.
    enabled: canViewAmpStaging,
  })

  // A well with no chemistry on file still gets a report, marked as having no
  // results — the same thing the exporter produces, and the honest answer to
  // "what does this well's water look like". The note only warns what is coming.
  const chemistryNote =
    isChemistry && !isChemistryLoading && !hasChemistry
      ? 'No water chemistry on file — the report will show no results'
      : undefined

  // Waiting on the year is the one thing that has to hold the actions back,
  // since acting early would report on the wrong one.
  const isChemistryYearPending = isChemistry && isChemistryLoading

  const previewDisabled =
    isPreviewLoading ||
    isPermissionsLoading ||
    !canManageAmp ||
    isChemistryYearPending

  const downloadDisabled =
    isDownloadLoading ||
    isPermissionsLoading ||
    !canManageAmp ||
    isGenerating ||
    isChemistryYearPending

  const handlePreview = () => {
    if (isChemistry) {
      // The chemistry exporter already renders a full preview; hand it the
      // well and year so it opens on this report rather than an empty picker.
      go({
        to: '/ocotillo/chemistry-report',
        query: { thing_id: id, year: reportYear },
        type: 'push',
      })
      return
    }

    go({ to: `/ocotillo/well/pdf-preview/${id}`, type: 'push' })
  }

  const handleDownloadFieldSheet = async (opts: IPdfOptions) => {
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

    return a.download
  }

  const handleDownloadChemistryReport = async (year: number) => {
    const yearObservations = await fetchYearObservations(year)

    return downloadChemistryReport({
      well,
      contacts,
      observations: yearObservations,
      year,
    })
  }

  const handleDownload = async (opts: IPdfOptions) => {
    if (!well?.id) return

    try {
      setIsGenerating(true)
      const filename = isChemistry
        ? await handleDownloadChemistryReport(reportYear)
        : await handleDownloadFieldSheet(opts)

      notify?.({
        message: isChemistry
          ? `Chemistry report generated for ${reportYear}`
          : 'PDF generated successfully',
        type: 'success',
        description: filename,
      })
    } catch (error) {
      console.error(error)
      notify?.({
        message: isChemistry
          ? 'Chemistry report generation failed'
          : 'PDF Generation Failed',
        type: 'error',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadTooltip = isGenerating
    ? 'Generating…'
    : isChemistry
      ? (chemistryNote ?? `Download chemistry report for ${reportYear}`)
      : 'Download field sheet'

  return (
    <div className="inline-flex items-stretch rounded-lg border border-border bg-background overflow-hidden shadow-xs">
      <Select
        value={reportType}
        onValueChange={(value) => setReportType(value as WellReportType)}
      >
        <SelectTrigger
          size="sm"
          className="w-[9.5rem] rounded-none border-0 text-[0.8rem] shadow-none"
          aria-label="Report type"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="field-sheet">
            {REPORT_TYPE_LABELS['field-sheet']}
          </SelectItem>
          {/* Still under review, so it is only offered to the staging group. */}
          {canViewAmpStaging ? (
            <SelectItem value="chemistry-report">
              {REPORT_TYPE_LABELS['chemistry-report']}
            </SelectItem>
          ) : null}
        </SelectContent>
      </Select>
      <div className="w-px self-stretch bg-border shrink-0" />
      <Button
        variant="ghost"
        size="sm"
        className="rounded-none border-0 shadow-none"
        disabled={previewDisabled}
        onClick={handlePreview}
        title={chemistryNote}
      >
        <EyeIcon />
        Preview PDF
      </Button>
      <div className="w-px self-stretch bg-border shrink-0" />
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Wrapped so the tooltip still explains the button while it is
              disabled — a disabled button emits no pointer events. */}
          <span className="inline-flex">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-none border-0 px-2.5 shadow-none"
              disabled={downloadDisabled}
              onClick={() => handleDownload(options ?? PDF_SINGLE_PAGE_OPTION)}
              aria-label={
                isGenerating
                  ? 'Generating PDF'
                  : `Download ${REPORT_TYPE_LABELS[reportType].toLowerCase()}`
              }
            >
              <DownloadIcon />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">{downloadTooltip}</TooltipContent>
      </Tooltip>
    </div>
  )
}
