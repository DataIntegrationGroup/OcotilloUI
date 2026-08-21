import { useDataProvider, useList, useNotification } from '@refinedev/core'
import { DownloadIcon, FlaskConicalIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  type ChemistryReportSections,
  downloadChemistryReport,
} from '@/components/pdf/chemistry'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ChemistryObservation } from '@/hooks/useChemistryReportData'
import type { IContact, IWell } from '@/interfaces/ocotillo'
import {
  CHEMISTRY_REPORT_PAGE_SIZE,
  chemistryReportYearOf,
  chemistryReportYearParams,
  sortChemistryObservations,
} from '@/utils/chemistryReport'

const CHEMISTRY_RESOURCE = 'observation/water-chemistry'

export const ChemistryReportDownloadButton = ({
  well,
  contacts,
  observations,
  year,
  sections,
  disabled = false,
}: {
  well?: IWell
  contacts: readonly IContact[]
  observations: readonly ChemistryObservation[]
  year: number
  sections: ChemistryReportSections
  disabled?: boolean
}) => {
  const { open: notify } = useNotification()
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    if (!well) return

    try {
      setIsGenerating(true)
      const filename = await downloadChemistryReport({
        well,
        contacts,
        observations,
        year,
        sections,
      })

      notify?.({
        message: 'Chemistry report generated',
        type: 'success',
        description: filename,
      })
    } catch (error) {
      console.error(error)
      notify?.({
        message: 'Chemistry report generation failed',
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
      disabled={disabled || !well || isGenerating}
      onClick={handleDownload}
    >
      <DownloadIcon />
      {isGenerating ? 'Generating…' : 'Download PDF'}
    </Button>
  )
}

/**
 * Well-details entry point to the annual water quality report. The well and
 * its contacts are already on the page, so the only thing this looks up is
 * which year to report on — and it does not pull that year's results until the
 * button is actually pressed, since most visits to a well page are not after a
 * report.
 */
export const WellChemistryReportButton = ({
  well,
  contacts,
  isLoading = false,
}: {
  well?: IWell
  contacts: readonly IContact[]
  isLoading?: boolean
}) => {
  const { open: notify } = useNotification()
  const dataProvider = useDataProvider()
  const ocotilloDataProvider = useMemo(
    () => dataProvider('ocotillo'),
    [dataProvider]
  )
  const [isGenerating, setIsGenerating] = useState(false)

  const wellId = well?.id

  // The report covers one calendar year, and the year worth reporting on is
  // the most recent one sampled: a well last sampled in 2024 would otherwise
  // produce an empty report for the current year. One row is enough to find
  // it, and it doubles as the "has any chemistry at all" check.
  const { result: latestResult, query: latestQuery } =
    useList<ChemistryObservation>({
      resource: CHEMISTRY_RESOURCE,
      dataProviderName: 'ocotillo',
      pagination: { currentPage: 1, pageSize: 1, mode: 'server' },
      sorters: [{ field: 'observation_datetime', order: 'desc' }],
      meta: { params: { thing_id: wellId } },
      queryOptions: {
        enabled: Boolean(wellId),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      },
    })

  const reportYear = chemistryReportYearOf(
    latestResult?.data?.[0]?.observation_datetime
  )

  const fetchYearObservations = async (
    year: number,
    thingId: string | number
  ) => {
    const params = { thing_id: thingId, ...chemistryReportYearParams(year) }
    const collected: ChemistryObservation[] = []
    let currentPage = 1

    while (true) {
      const page = await ocotilloDataProvider.getList({
        resource: CHEMISTRY_RESOURCE,
        pagination: { currentPage, pageSize: CHEMISTRY_REPORT_PAGE_SIZE },
        meta: { params },
      })

      collected.push(...(page.data as ChemistryObservation[]))

      if (page.data.length === 0 || collected.length >= page.total) break
      currentPage += 1
    }

    return collected
  }

  const handleGenerate = async () => {
    if (!well || wellId == null || reportYear == null) return

    try {
      setIsGenerating(true)
      const observations = await fetchYearObservations(reportYear, wellId)

      const filename = await downloadChemistryReport({
        well,
        contacts,
        observations: sortChemistryObservations(observations),
        year: reportYear,
      })

      notify?.({
        message: `Chemistry report generated for ${reportYear}`,
        type: 'success',
        description: filename,
      })
    } catch (error) {
      console.error(error)
      notify?.({
        message: 'Chemistry report generation failed',
        type: 'error',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const hasChemistry = reportYear != null
  const isBusy = isLoading || latestQuery.isLoading
  const isDisabled = isBusy || !well || !hasChemistry || isGenerating

  const tooltip = isGenerating
    ? 'Generating…'
    : isBusy
      ? 'Checking for water chemistry…'
      : hasChemistry
        ? `Annual water quality report for ${reportYear}`
        : 'No water chemistry on file for this well'

  return (
    <Tooltip>
      {/* Wrapped so the tooltip still explains the button while it is
          disabled — a disabled button emits no pointer events of its own. */}
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button
            variant="outline"
            size="sm"
            disabled={isDisabled}
            onClick={handleGenerate}
            aria-label={
              isGenerating ? 'Generating chemistry report' : 'Chemistry report'
            }
          >
            <FlaskConicalIcon />
            <span className="hidden mobile-lg:inline">Chemistry Report</span>
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  )
}
