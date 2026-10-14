import { toDrinkingWaterStandards } from '@/constants/drinkingWaterStandards'
import type {
  LimitType,
  ParameterName,
  RegulatoryLimitResponse,
} from '@/generated/types.gen'

let nextId = 1

/** One `regulatory_limit` row, as the API returns it. */
export const regulatoryLimit = (
  parameterName: ParameterName,
  limitType: LimitType | null,
  limitValue: number,
  overrides: Partial<RegulatoryLimitResponse> = {}
): RegulatoryLimitResponse => {
  const id = nextId++
  return {
    id,
    created_at: '2026-01-01T00:00:00Z',
    release_status: 'public',
    parameter_id: id,
    parameter: {
      id,
      created_at: '2026-01-01T00:00:00Z',
      release_status: 'public',
      parameter_name: parameterName,
      matrix: 'water',
      parameter_type: null,
      cas_number: null,
      default_unit: 'mg/L',
    },
    limit_source: 'EPA',
    limit_value: limitValue,
    limit_unit: 'mg/L',
    limit_type: limitType,
    ...overrides,
  }
}

/**
 * The EPA limits the report was first built against, served the way the API
 * serves them. Tests compare against these rather than a table in the source.
 */
export const EPA_LIMITS: RegulatoryLimitResponse[] = [
  regulatoryLimit('Arsenic', 'MCL', 0.01),
  regulatoryLimit('Fluoride', 'MCL', 4),
  regulatoryLimit('Nitrate (as N)', 'MCL', 10),
  regulatoryLimit('Uranium (total, by ICP-MS)', 'MCL', 0.03),
  regulatoryLimit('Chloride', 'SMCL', 250),
  regulatoryLimit('Iron', 'SMCL', 0.3),
  regulatoryLimit('Manganese', 'SMCL', 0.05),
  regulatoryLimit('Sulfate', 'SMCL', 250),
  regulatoryLimit('Total Dissolved Solids', 'SMCL', 500),
  regulatoryLimit('Zinc', 'SMCL', 5),
]

export const TEST_STANDARDS = toDrinkingWaterStandards(EPA_LIMITS)
