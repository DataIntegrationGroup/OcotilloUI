import type { RegulatoryLimitResponse } from '@/generated/types.gen'

/**
 * Federal drinking water standards used to flag owner-facing chemistry
 * reports.
 *
 * - MCL (Maximum Contaminant Level) is an enforceable health-based limit.
 * - SMCL (Secondary MCL) is a non-enforceable taste, odor, or staining
 *   guideline.
 *
 * The values come from the API's `regulatory_limit` table rather than living
 * here, so a limit that changes is corrected once, in the database, instead of
 * in every client that prints it. Parameters with no MCL or SMCL on file are
 * reported without a comparison rather than being reported as passing.
 */
export type StandardKind = 'MCL' | 'SMCL'

export type DrinkingWaterStandard = {
  kind: StandardKind
  /** Threshold in `unit`. A result strictly above this is an exceedance. */
  limit: number
  unit: string
  /** The agency that issued the limit, e.g. `EPA`. */
  source: string
}

/** Standards keyed by parameter name, as chemistry results carry it. */
export type DrinkingWaterStandards = ReadonlyMap<string, DrinkingWaterStandard>

export const NO_DRINKING_WATER_STANDARDS: DrinkingWaterStandards = new Map()

const isStandardKind = (value: unknown): value is StandardKind =>
  value === 'MCL' || value === 'SMCL'

/**
 * Reduces the API's regulatory limits to one drinking water standard per
 * parameter.
 *
 * Only MCLs and SMCLs are kept: the table also holds groundwater quality
 * standards and laboratory reporting limits, which are not drinking water
 * standards and must not be printed as one. Where a parameter has both an MCL
 * and an SMCL, the MCL wins -- the report has one standard per row, and the
 * enforceable health limit is the one a reader has to see.
 */
export const toDrinkingWaterStandards = (
  limits: readonly RegulatoryLimitResponse[]
): DrinkingWaterStandards => {
  const standards = new Map<string, DrinkingWaterStandard>()

  for (const limit of limits) {
    if (!isStandardKind(limit.limit_type)) continue

    const parameterName = limit.parameter.parameter_name
    const existing = standards.get(parameterName)
    if (existing?.kind === 'MCL' && limit.limit_type === 'SMCL') continue

    standards.set(parameterName, {
      kind: limit.limit_type,
      limit: limit.limit_value,
      unit: limit.limit_unit,
      source: limit.limit_source,
    })
  }

  return standards
}

export const getDrinkingWaterStandard = (
  standards: DrinkingWaterStandards,
  parameterName?: string | null
): DrinkingWaterStandard | undefined =>
  parameterName ? standards.get(parameterName) : undefined

export type StandardComparison = {
  standard?: DrinkingWaterStandard
  /** True only when a standard exists and the value is strictly above it. */
  exceeds: boolean
}

/**
 * Compares a result against its standard. Units are not converted: a result
 * reported in a unit other than the standard's is treated as not comparable,
 * so a mg/L limit is never silently applied to a µg/L number.
 */
export const compareToStandard = (
  standards: DrinkingWaterStandards,
  parameterName: string | null | undefined,
  value: number | null | undefined,
  unit: string | null | undefined
): StandardComparison => {
  const standard = getDrinkingWaterStandard(standards, parameterName)

  if (!standard || value == null || Number.isNaN(value)) {
    return { standard, exceeds: false }
  }

  if (unit && unit !== standard.unit) {
    return { standard, exceeds: false }
  }

  return { standard, exceeds: value > standard.limit }
}
