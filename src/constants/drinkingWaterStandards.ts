import type { ParameterName } from '@/generated/types.gen'

/**
 * Federal drinking water standards used to flag owner-facing chemistry
 * reports.
 *
 * - MCL (Maximum Contaminant Level) is an enforceable health-based limit.
 * - SMCL (Secondary MCL) is a non-enforceable taste, odor, or staining
 *   guideline.
 *
 * Values are EPA National Primary/Secondary Drinking Water Regulations, in
 * mg/L unless noted. Parameters absent from this table are reported without a
 * comparison rather than being reported as passing.
 */
export type StandardKind = 'MCL' | 'SMCL'

export type DrinkingWaterStandard = {
  kind: StandardKind
  /** Threshold in `unit`. A result strictly above this is an exceedance. */
  limit: number
  unit: string
  /** Plain-language note printed under the exceedance callout. */
  note?: string
}

export const DRINKING_WATER_STANDARDS: Partial<
  Record<ParameterName, DrinkingWaterStandard>
> = {
  Arsenic: {
    kind: 'MCL',
    limit: 0.01,
    unit: 'mg/L',
    note: 'Arsenic occurs naturally in New Mexico groundwater. Long-term consumption above the limit is associated with health risk.',
  },
  Barium: { kind: 'MCL', limit: 2, unit: 'mg/L' },
  Antimony: { kind: 'MCL', limit: 0.006, unit: 'mg/L' },
  Beryllium: { kind: 'MCL', limit: 0.004, unit: 'mg/L' },
  Cadmium: { kind: 'MCL', limit: 0.005, unit: 'mg/L' },
  Chromium: { kind: 'MCL', limit: 0.1, unit: 'mg/L' },
  Cyanide: { kind: 'MCL', limit: 0.2, unit: 'mg/L' },
  Fluoride: {
    kind: 'MCL',
    limit: 4,
    unit: 'mg/L',
    note: 'Fluoride above 2 mg/L can stain children’s teeth; above 4 mg/L is a health limit.',
  },
  Mercury: { kind: 'MCL', limit: 0.002, unit: 'mg/L' },
  'Nitrate (as N)': {
    kind: 'MCL',
    limit: 10,
    unit: 'mg/L',
    note: 'Nitrate above the limit is an immediate risk to infants under six months and to pregnant people.',
  },
  'Nitrite (as N)': { kind: 'MCL', limit: 1, unit: 'mg/L' },
  Selenium: { kind: 'MCL', limit: 0.05, unit: 'mg/L' },
  Thallium: { kind: 'MCL', limit: 0.002, unit: 'mg/L' },
  Lead: {
    kind: 'MCL',
    limit: 0.015,
    unit: 'mg/L',
    note: 'Lead in a private well is usually contributed by household plumbing rather than by the aquifer.',
  },
  'Uranium (total, by ICP-MS)': { kind: 'MCL', limit: 0.03, unit: 'mg/L' },

  Aluminum: { kind: 'SMCL', limit: 0.2, unit: 'mg/L' },
  Chloride: { kind: 'SMCL', limit: 250, unit: 'mg/L' },
  Copper: { kind: 'SMCL', limit: 1, unit: 'mg/L' },
  Iron: { kind: 'SMCL', limit: 0.3, unit: 'mg/L' },
  Manganese: { kind: 'SMCL', limit: 0.05, unit: 'mg/L' },
  Silver: { kind: 'SMCL', limit: 0.1, unit: 'mg/L' },
  Sulfate: { kind: 'SMCL', limit: 250, unit: 'mg/L' },
  'Total Dissolved Solids': { kind: 'SMCL', limit: 500, unit: 'mg/L' },
  Zinc: { kind: 'SMCL', limit: 5, unit: 'mg/L' },
}

export const getDrinkingWaterStandard = (
  parameterName?: string | null
): DrinkingWaterStandard | undefined =>
  parameterName
    ? DRINKING_WATER_STANDARDS[parameterName as ParameterName]
    : undefined

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
  parameterName: string | null | undefined,
  value: number | null | undefined,
  unit: string | null | undefined
): StandardComparison => {
  const standard = getDrinkingWaterStandard(parameterName)

  if (!standard || value == null || Number.isNaN(value)) {
    return { standard, exceeds: false }
  }

  if (unit && unit !== standard.unit) {
    return { standard, exceeds: false }
  }

  return { standard, exceeds: value > standard.limit }
}
