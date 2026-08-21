import {
  compareToStandard,
  type DrinkingWaterStandard,
} from '@/constants/drinkingWaterStandards'
import type {
  ChemistryResult,
  ChemistryResultKind,
} from '@/hooks/useChemistryReportData'
import type { IWell } from '@/interfaces/ocotillo'

export type ChemistryResultRow = {
  key: string
  parameterName: string
  /** Which legacy table the result came from; 'field' was read at the well. */
  resultKind: ChemistryResultKind
  value: number | null
  unit: string | null
  sampledOn: string
  standard?: DrinkingWaterStandard
  exceeds: boolean
}

export type ChemistryReportSummary = {
  rows: ChemistryResultRow[]
  fieldParameters: ChemistryResultRow[]
  labResults: ChemistryResultRow[]
  sampleDates: string[]
  parameterCount: number
  comparedCount: number
  mclExceedances: ChemistryResultRow[]
  smclExceedances: ChemistryResultRow[]
}

/**
 * Page size used when pulling one well's chemistry for one reporting year. A
 * year of results for a single well is small; the ceiling only exists so a
 * well with an unusually long parameter list is not silently truncated.
 */
export const CHEMISTRY_REPORT_PAGE_SIZE = 500

/**
 * The API's start_time/end_time window is inclusive of the start and exclusive
 * of the end, so a calendar year runs from Jan 1 to Jan 1 of the next year.
 */
export const chemistryReportYearParams = (year: number) => ({
  start_time: `${year}-01-01T00:00:00`,
  end_time: `${year + 1}-01-01T00:00:00`,
})

/**
 * The calendar year a sample belongs to, read in UTC to match the window
 * `chemistryReportYearParams` builds. Reading it locally would file a sample
 * collected Jan 01 under the previous year anywhere west of Greenwich, and the
 * report for that year would then come back empty.
 */
export const chemistryReportYearOf = (value?: string | null): number | null => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.getUTCFullYear()
}

/** Oldest sample first, parameters alphabetical within a sample date. */
export const sortChemistryResults = (
  observations: readonly ChemistryResult[]
): ChemistryResult[] =>
  [...observations].sort((a, b) => {
    const byDate =
      new Date(a.observation_datetime).getTime() -
      new Date(b.observation_datetime).getTime()
    if (byDate !== 0) return byDate
    return (a.parameter_name ?? '').localeCompare(b.parameter_name ?? '')
  })

/**
 * Sample and completion dates are calendar dates, not instants. The API sends
 * them as UTC (or as a bare `YYYY-MM-DD`, which parses as UTC midnight), so
 * they are formatted in UTC — formatting in the viewer's local zone would
 * print a sample collected Feb 04 as Feb 03 anywhere west of Greenwich.
 */
export const formatReportDate = (value?: string | null): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  })
}

/**
 * Results are reported at the precision the lab gave us rather than a fixed
 * number of decimals — an arsenic result of 0.012 mg/L must not be rounded to
 * 0.01 mg/L, which is the limit it is being compared against.
 */
export const formatResultValue = (value: number | null): string =>
  value == null ? 'Not detected' : String(value)

export const summarizeChemistry = (
  observations: readonly ChemistryResult[]
): ChemistryReportSummary => {
  const rows: ChemistryResultRow[] = observations.map((observation) => {
    const parameterName = observation.parameter_name || 'Unknown'
    const unit = observation.unit ?? null
    const { standard, exceeds } = compareToStandard(
      parameterName,
      observation.value,
      unit
    )

    return {
      key: observation.id,
      parameterName,
      resultKind: observation.result_kind,
      value: observation.value,
      unit,
      sampledOn: observation.observation_datetime,
      standard,
      exceeds,
    }
  })

  const sampleDates = Array.from(
    new Set(rows.map((row) => row.sampledOn.slice(0, 10)))
  ).sort()

  return {
    rows,
    fieldParameters: rows.filter((row) => row.resultKind === 'field'),
    labResults: rows.filter((row) => row.resultKind !== 'field'),
    sampleDates,
    parameterCount: new Set(rows.map((row) => row.parameterName)).size,
    comparedCount: new Set(
      rows.filter((row) => row.standard).map((row) => row.parameterName)
    ).size,
    mclExceedances: rows.filter(
      (row) => row.exceeds && row.standard?.kind === 'MCL'
    ),
    smclExceedances: rows.filter(
      (row) => row.exceeds && row.standard?.kind === 'SMCL'
    ),
  }
}

/**
 * `WL-1187 Vigil Ranch Well` → `chemistry-report-WL-1187-2026.pdf`
 */
export const buildChemistryReportFilename = (
  well: Pick<IWell, 'id' | 'name'> | undefined,
  year: number
): string => {
  const slug = (well?.name ?? `well-${well?.id ?? 'unknown'}`)
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9._-]/g, '')
  return `chemistry-report-${slug}-${year}.pdf`
}
