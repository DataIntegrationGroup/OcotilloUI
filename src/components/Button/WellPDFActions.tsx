import { pdf } from '@react-pdf/renderer'
import {
  BaseRecord,
  useDataProvider,
  useGo,
  useNotification,
} from '@refinedev/core'
import { DownloadIcon, EyeIcon } from 'lucide-react'
import { Component, ReactNode, useCallback, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { FieldCompilationNotesPdf, HydrographPngExporter } from '@/components'
import {
  buildWeaverQrDataUrl,
  buildWellMapsQrDataUrl,
} from '@/components/pdf/chemistry/wellQrCode'
import {
  CHEMISTRY_REPORT_DEFAULT_SECTIONS,
  downloadChemistryReport,
} from '@/components/pdf/chemistry'
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
import { useAccessCapabilities, useWellChemistryReport } from '@/hooks'
import { IContact, IObservation, IWell } from '@/interfaces/ocotillo'
import type { IPdfOptions } from '@/interfaces'
import type { IHydrographDatasource, IHydrographOptions } from '@/interfaces/st2'
import { buildPdfFilename, SensorDeploymentRow } from '@/utils'
import { PDF_DEFAULT_VALUES } from '@/config'
import { fetchSampleMaps } from '@/pages/ocotillo/thing/useSampleMaps'
import {
  buildFieldSheetHydrographOptions,
  buildHydrographDatasource,
} from '@/pages/ocotillo/thing/hydrographDatasource'

/** Hard cap on the offscreen hydrograph export; past it page 2 prints without one. */
export const HYDROGRAPH_EXPORT_TIMEOUT_MS = 4000

// Same chart options the preview exports with (stable, so the exporter's
// effect is not re-armed on every render while a download waits).
const FIELD_SHEET_HYDROGRAPH_OPTIONS = buildFieldSheetHydrographOptions(
  PDF_DEFAULT_VALUES as IPdfOptions & Partial<IHydrographOptions>
)

const EMPTY_SAMPLE_MAPS = {
  sampleMethodsBySampleId: {} as Record<number, string>,
  staffBySampleId: {} as Record<number, string>,
}

/** A chart that throws while exporting must not take the button down. */
class HydrographExportBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

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
  sensorDeployments?: SensorDeploymentRow[]
  hydrographImage?: string | null
}

export const WellPDFActionsButton = ({
  isPreviewLoading,
  isDownloadLoading,
  well,
  observations,
  assets,
  contacts,
  sensorDeployments = [],
  hydrographImage,
}: WellPDFActionsButtonProps) => {
  const go = useGo()
  const { id } = useParams()
  const { open: notify } = useNotification()
  const {
    isLoading: isPermissionsLoading,
    canViewConfidential,
    canEditAmp,
  } = useAccessCapabilities()

  const [selectedReportType, setSelectedReportType] =
    useState<WellReportType>('field-sheet')
  const [isGenerating, setIsGenerating] = useState(false)
  const dataProvider = useDataProvider()

  // Offscreen hydrograph for the field-sheet download: mounted only while a
  // download waits on it (the well page has no chart surface of its own).
  const [hydrographJob, setHydrographJob] = useState<{
    key: number
    datasource: IHydrographDatasource[]
  } | null>(null)
  const finishHydrograph = useRef<((png: string | null) => void) | null>(null)
  const handleHydrographPng = useCallback(
    (png: string) => finishHydrograph.current?.(png),
    []
  )
  const handleHydrographError = useCallback(
    () => finishHydrograph.current?.(null),
    []
  )

  const exportHydrographPng = (datasource: IHydrographDatasource[]) =>
    datasource.length === 0
      ? Promise.resolve<string | null>(null)
      : new Promise<string | null>((resolve) => {
          let timer: ReturnType<typeof setTimeout> | undefined
          const finish = (png: string | null) => {
            if (timer) clearTimeout(timer)
            finishHydrograph.current = null
            setHydrographJob(null)
            resolve(png)
          }
          timer = setTimeout(() => finish(null), HYDROGRAPH_EXPORT_TIMEOUT_MS)
          finishHydrograph.current = finish
          setHydrographJob({ key: Date.now(), datasource })
        })

  // Each report carries its own gate, matching its route's access policy
  // (`ocotillo.thing-well-pdf-preview`, `ocotillo.chemistry-report`). Both are
  // an editor's today. The actions below check the selected report's flag, so
  // changing one gate here moves the menu and the buttons together.
  const canProduceFieldSheet = canEditAmp
  const canProduceChemistryReport = canEditAmp

  const {
    reportYear,
    hasChemistry,
    isLoading: isChemistryLoading,
    fetchObservations,
    fetchStandards,
    fetchWaterLevels,
    fetchContinuous,
  } = useWellChemistryReport({
    thingId: id,
    // Only worth asking once the report is on offer at all.
    enabled: canProduceChemistryReport,
  })

  // A well with nothing on file has no report to give, so the option is shown
  // greyed out rather than handing back an empty PDF. It stays selectable while
  // the lookup is in flight, since the actions already wait on the year.
  const isChemistryUnavailable = !isChemistryLoading && !hasChemistry

  // Covers the gap where the option was picked before the lookup came back
  // empty: the selection falls back instead of acting on a report that is no
  // longer on offer.
  const reportType: WellReportType =
    selectedReportType === 'chemistry-report' &&
    (!canProduceChemistryReport || isChemistryUnavailable)
      ? 'field-sheet'
      : selectedReportType

  const isChemistry = reportType === 'chemistry-report'

  const canProduceSelectedReport = isChemistry
    ? canProduceChemistryReport
    : canProduceFieldSheet

  // Waiting on the year is the one thing that has to hold the actions back,
  // since acting early would report on the wrong one.
  const isChemistryYearPending = isChemistry && isChemistryLoading

  const previewDisabled =
    isPreviewLoading ||
    isPermissionsLoading ||
    !canProduceSelectedReport ||
    isChemistryYearPending

  const downloadDisabled =
    isDownloadLoading ||
    isPermissionsLoading ||
    !canProduceSelectedReport ||
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

  const handleDownloadFieldSheet = async () => {
    const filename = buildPdfFilename(well)
    // Same value the page-2 URL line prints (buildWeaverLocationUrl(well.name)).
    // Page 1: Google Maps at the well coordinates; page 2: Weaver well page.
    // Method / Staff: the same sample lookup the preview makes; a failed
    // lookup prints those cells blank rather than blocking the download.
    // Hydrograph: an explicit image wins, else export one offscreen (capped).
    const [qrDataUrl, mapsQrDataUrl, sampleMaps, pageTwoHydrograph] =
      await Promise.all([
        buildWeaverQrDataUrl(well.name).then((url) => url ?? undefined),
        buildWellMapsQrDataUrl(well),
        (async () =>
          fetchSampleMaps(dataProvider('ocotillo'), observations))().catch(
          () => EMPTY_SAMPLE_MAPS
        ),
        hydrographImage
          ? Promise.resolve(hydrographImage)
          : exportHydrographPng(buildHydrographDatasource(well, observations)),
      ])

    const blob = await pdf(
      <FieldCompilationNotesPdf
        well={well}
        assets={assets}
        contacts={contacts}
        observations={observations}
        sensorDeployments={sensorDeployments}
        includeConfidentialContacts={canViewConfidential}
        hydrographImage={pageTwoHydrograph}
        sampleMethodsBySampleId={sampleMaps.sampleMethodsBySampleId}
        staffBySampleId={sampleMaps.staffBySampleId}
        qrDataUrl={qrDataUrl}
        mapsQrDataUrl={mapsQrDataUrl}
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
    const elevationFt = (
      well?.current_location?.properties as
        | { elevation?: number | null }
        | undefined
    )?.elevation

    // Not named `observations`: the component already takes a prop by that
    // name, holding the field sheet's observations rather than chemistry.
    // The well page generates with the report's default sections, so a
    // section switched off there is not worth its requests. The exporter,
    // where any of them can be switched back on, fetches its own.
    const [chemistry, standards, waterLevels, continuous] = await Promise.all([
      // The whole chemistry record; the year scopes the water levels only.
      fetchObservations(),
      fetchStandards(),
      CHEMISTRY_REPORT_DEFAULT_SECTIONS.waterLevels
        ? fetchWaterLevels(year, { elevationFt })
        : [],
      CHEMISTRY_REPORT_DEFAULT_SECTIONS.continuousMonitoring
        ? fetchContinuous(year)
        : null,
    ])

    return downloadChemistryReport({
      well,
      contacts,
      observations: chemistry,
      standards,
      waterLevels,
      continuous,
      year,
    })
  }

  const handleDownload = async () => {
    if (!well?.id) return

    try {
      setIsGenerating(true)
      const filename = isChemistry
        ? await handleDownloadChemistryReport(reportYear)
        : await handleDownloadFieldSheet()

      notify?.({
        message: isChemistry
          ? 'Chemistry report generated'
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
      ? // The chemistry is the whole record; the year is the water levels'.
        `Download chemistry report, with ${reportYear} water levels`
      : 'Download field sheet'

  return (
    <>
    <div className="inline-flex items-stretch rounded-lg border border-border bg-background overflow-hidden shadow-xs">
      <Select
        value={reportType}
        onValueChange={(value) =>
          setSelectedReportType(value as WellReportType)
        }
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
          {canProduceChemistryReport ? (
            <SelectItem
              value="chemistry-report"
              disabled={isChemistryUnavailable}
            >
              {isChemistryUnavailable
                ? `${REPORT_TYPE_LABELS['chemistry-report']} — no chemistry data`
                : REPORT_TYPE_LABELS['chemistry-report']}
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
              onClick={() => handleDownload()}
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
    {hydrographJob ? (
      <HydrographExportBoundary
        key={hydrographJob.key}
        onError={handleHydrographError}
      >
        <HydrographPngExporter
          datasource={hydrographJob.datasource}
          options={FIELD_SHEET_HYDROGRAPH_OPTIONS}
          refreshKey={hydrographJob.key}
          onPngReady={handleHydrographPng}
        />
      </HydrographExportBoundary>
    ) : null}
    </>
  )
}
