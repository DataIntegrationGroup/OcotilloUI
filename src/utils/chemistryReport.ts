import {
  compareToStandard,
  type DrinkingWaterStandard,
} from '@/constants/drinkingWaterStandards'
import type { ChemistryObservation } from '@/hooks/useChemistryReportData'
import type { IWell } from '@/interfaces/ocotillo'

export type ChemistryResultRow = {
  key: string
  parameterName: string
  parameterType: string | null
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

const FIELD_PARAMETER_TYPE = 'Field Parameter'

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
  observations: readonly ChemistryObservation[]
): ChemistryReportSummary => {
  const rows: ChemistryResultRow[] = observations.map((observation) => {
    const parameterName = observation.parameter?.parameter_name ?? 'Unknown'
    const unit = observation.unit ?? observation.parameter?.default_unit ?? null
    const { standard, exceeds } = compareToStandard(
      parameterName,
      observation.value,
      unit
    )

    return {
      key: String(observation.id),
      parameterName,
      parameterType: observation.parameter?.parameter_type ?? null,
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
    fieldParameters: rows.filter(
      (row) => row.parameterType === FIELD_PARAMETER_TYPE
    ),
    labResults: rows.filter(
      (row) => row.parameterType !== FIELD_PARAMETER_TYPE
    ),
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
