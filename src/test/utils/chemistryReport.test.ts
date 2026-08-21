import { describe, expect, it } from 'vitest'
import { compareToStandard } from '@/constants/drinkingWaterStandards'
import type { ChemistryResult } from '@/hooks/useChemistryReportData'
import {
  buildChemistryReportFilename,
  chemistryReportYearOf,
  chemistryReportYearParams,
  formatResultValue,
  sortChemistryResults,
  summarizeChemistry,
} from '@/utils/chemistryReport'

const observation = (
  overrides: Partial<ChemistryResult> & {
    parameterName: string
    parameterType?: string | null
  }
): ChemistryResult => {
  const { parameterName, parameterType = 'Metal', ...rest } = overrides

  return {
    id: 'maj-1',
    thing_id: 2161,
    station_name: 'EB-339',
    sample_id: 1,
    parameter_name: parameterName,
    value: 0,
    unit: 'mg/L',
    observation_datetime: '2026-05-15T00:00:00Z',
    // The legacy source table stands in for the old parameter_type: a field
    // reading came off the wellhead, anything else came from a lab.
    result_kind: parameterType === 'Field Parameter' ? 'field' : 'minor',
    ...rest,
  } as ChemistryResult
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
    observation({ id: 'maj-1', parameterName: 'Arsenic', value: 0.012 }),
    observation({ id: 'maj-2', parameterName: 'Iron', value: 0.9 }),
    observation({ id: 'maj-3', parameterName: 'Calcium', value: 90 }),
    observation({
      id: 'fld-4',
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

describe('chemistryReportYearParams', () => {
  it('covers the calendar year without spilling into the next one', () => {
    expect(chemistryReportYearParams(2026)).toEqual({
      start_time: '2026-01-01T00:00:00',
      end_time: '2027-01-01T00:00:00',
    })
  })
})

describe('chemistryReportYearOf', () => {
  it('reads the year in UTC so a Jan 01 sample is not filed a year early', () => {
    // Local time west of Greenwich makes this Dec 31, 2025; the API window it
    // has to match is a UTC one, so 2026 is the year that returns the sample.
    expect(chemistryReportYearOf('2026-01-01T00:00:00Z')).toBe(2026)
  })

  it('returns null for a missing or unparseable date', () => {
    expect(chemistryReportYearOf(null)).toBeNull()
    expect(chemistryReportYearOf('not a date')).toBeNull()
  })
})

describe('sortChemistryResults', () => {
  it('orders oldest sample first, then parameters alphabetically', () => {
    const sorted = sortChemistryResults([
      observation({
        id: 'maj-1',
        parameterName: 'Iron',
        observation_datetime: '2026-05-15T00:00:00Z',
      }),
      observation({
        id: 'maj-2',
        parameterName: 'Zinc',
        observation_datetime: '2026-02-04T00:00:00Z',
      }),
      observation({
        id: 'maj-3',
        parameterName: 'Arsenic',
        observation_datetime: '2026-02-04T00:00:00Z',
      }),
    ])

    expect(sorted.map((row) => row.parameter_name)).toEqual([
      'Arsenic',
      'Zinc',
      'Iron',
    ])
  })

  it('does not mutate the array it is given', () => {
    const rows = [
      observation({ id: 'maj-1', parameterName: 'Zinc' }),
      observation({
        id: 'maj-2',
        parameterName: 'Arsenic',
        observation_datetime: '2026-02-04T00:00:00Z',
      }),
    ]

    sortChemistryResults(rows)

    expect(rows.map((row) => row.id)).toEqual(['maj-1', 'maj-2'])
  })
})
