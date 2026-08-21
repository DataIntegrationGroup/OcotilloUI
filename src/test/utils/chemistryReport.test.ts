import { describe, expect, it } from 'vitest'
import { compareToStandard } from '@/constants/drinkingWaterStandards'
import type { ChemistryObservation } from '@/hooks/useChemistryReportData'
import {
  buildChemistryReportFilename,
  formatResultValue,
  summarizeChemistry,
} from '@/utils/chemistryReport'

const observation = (
  overrides: Partial<ChemistryObservation> & {
    parameterName: string
    parameterType?: string | null
  }
): ChemistryObservation => {
  const { parameterName, parameterType = 'Metal', ...rest } = overrides

  return {
    id: 1,
    created_at: '2026-05-15T00:00:00Z',
    release_status: 'public',
    sample_id: 1,
    sensor_id: null,
    observation_datetime: '2026-05-15T00:00:00Z',
    value: 0,
    unit: 'mg/L',
    parameter: {
      id: 1,
      created_at: '2026-01-01T00:00:00Z',
      release_status: 'public',
      parameter_name: parameterName,
      matrix: 'water',
      parameter_type: parameterType,
      cas_number: null,
      default_unit: 'mg/L',
    },
    ...rest,
  } as ChemistryObservation
}

describe('compareToStandard', () => {
  it('flags a result above its MCL', () => {
    expect(compareToStandard('Arsenic', 0.012, 'mg/L')).toMatchObject({
      exceeds: true,
      standard: { kind: 'MCL', limit: 0.01 },
    })
  })

  it('treats a result exactly at the limit as within the limit', () => {
    expect(compareToStandard('Arsenic', 0.01, 'mg/L').exceeds).toBe(false)
  })

  it('refuses to compare across units rather than misapplying the limit', () => {
    // 12 µg/L is 0.012 mg/L — above the limit — but the numbers are not
    // comparable as given, so the row must not be flagged from the raw value.
    expect(compareToStandard('Arsenic', 12, 'ug/L').exceeds).toBe(false)
  })

  it('reports no standard for an unregulated parameter', () => {
    expect(compareToStandard('Calcium', 90, 'mg/L')).toEqual({
      standard: undefined,
      exceeds: false,
    })
  })
})

describe('summarizeChemistry', () => {
  const rows = [
    observation({ id: 1, parameterName: 'Arsenic', value: 0.012 }),
    observation({ id: 2, parameterName: 'Iron', value: 0.9 }),
    observation({ id: 3, parameterName: 'Calcium', value: 90 }),
    observation({
      id: 4,
      parameterName: 'pH',
      parameterType: 'Field Parameter',
      value: 7.8,
      unit: 'dimensionless',
      observation_datetime: '2026-02-04T00:00:00Z',
    }),
  ]

  const summary = summarizeChemistry(rows)

  it('splits field parameters from laboratory results', () => {
    expect(summary.fieldParameters.map((row) => row.parameterName)).toEqual([
      'pH',
    ])
    expect(summary.labResults).toHaveLength(3)
  })

  it('separates health limits from taste and odor guidelines', () => {
    expect(summary.mclExceedances.map((row) => row.parameterName)).toEqual([
      'Arsenic',
    ])
    expect(summary.smclExceedances.map((row) => row.parameterName)).toEqual([
      'Iron',
    ])
  })

  it('counts distinct sample dates and compared parameters', () => {
    expect(summary.sampleDates).toEqual(['2026-02-04', '2026-05-15'])
    expect(summary.parameterCount).toBe(4)
    expect(summary.comparedCount).toBe(2)
  })

  it('handles a well with no chemistry on file', () => {
    expect(summarizeChemistry([])).toMatchObject({
      sampleDates: [],
      parameterCount: 0,
      mclExceedances: [],
    })
  })
})

describe('formatResultValue', () => {
  it('preserves lab precision instead of rounding to the limit', () => {
    expect(formatResultValue(0.012)).toBe('0.012')
  })

  it('labels a null result rather than printing zero', () => {
    expect(formatResultValue(null)).toBe('Not detected')
  })
})

describe('buildChemistryReportFilename', () => {
  it('slugifies the well name', () => {
    expect(
      buildChemistryReportFilename({ id: 1187, name: 'WL-1187' }, 2026)
    ).toBe('chemistry-report-WL-1187-2026.pdf')
  })

  it('falls back to the id when the well has no name', () => {
    expect(buildChemistryReportFilename(undefined, 2026)).toBe(
      'chemistry-report-well-unknown-2026.pdf'
    )
  })
})
