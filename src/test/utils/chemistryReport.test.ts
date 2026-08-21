import { describe, expect, it } from 'vitest'
import { compareToStandard } from '@/constants/drinkingWaterStandards'
import type { ChemistryResult } from '@/hooks/useChemistryReportData'
import {
  buildChemistryReportFilename,
  chemistryReportYearOf,
  chemistryReportYearParams,
  formatResultValue,
  latestResultPerParameter,
  pivotFieldParameters,
  resultStatus,
  sortChemistryResults,
  summarizeChemistry,
  toWaterLevelReadings,
  waterLevelChangeFt,
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

describe('resultStatus', () => {
  const row = (
    overrides: Partial<ReturnType<typeof summarizeChemistry>['rows'][number]>
  ): ReturnType<typeof summarizeChemistry>['rows'][number] => ({
    key: 'maj-1',
    parameterName: 'Arsenic',
    resultKind: 'minor' as const,
    value: 0.005,
    unit: 'mg/L',
    sampledOn: '2026-05-15T00:00:00Z',
    exceeds: false,
    ...overrides,
  })

  it('separates a health limit from a taste guideline', () => {
    expect(
      resultStatus(
        row({
          exceeds: true,
          standard: { kind: 'MCL', limit: 0.01, unit: 'mg/L' },
        })
      )
    ).toEqual({ kind: 'above-mcl', label: 'Above limit' })

    expect(
      resultStatus(
        row({
          parameterName: 'Iron',
          exceeds: true,
          standard: { kind: 'SMCL', limit: 0.3, unit: 'mg/L' },
        })
      )
    ).toEqual({ kind: 'above-smcl', label: 'Above SMCL' })
  })

  it('reports a missing value as not detected rather than as passing', () => {
    expect(resultStatus(row({ value: null })).kind).toBe('not-detected')
  })

  it('describes hardness instead of passing or failing it', () => {
    // Hardness has no standard, so a pass/fail verdict would be invented.
    expect(
      resultStatus(row({ parameterName: 'Hardness (CaCO3)', value: 284 }))
    ).toEqual({ kind: 'classification', label: 'Very hard' })
    expect(
      resultStatus(row({ parameterName: 'Hardness (CaCO3)', value: 45 })).label
    ).toBe('Soft')
  })

  it('says nothing about a parameter with no standard', () => {
    expect(resultStatus(row({ parameterName: 'Strontium' })).kind).toBe('none')
  })
})

describe('pivotFieldParameters', () => {
  it('gives each parameter one row and each sample date a column', () => {
    const { dates, rows } = pivotFieldParameters([
      {
        key: 'fld-1',
        parameterName: 'pH',
        resultKind: 'field',
        value: 7.61,
        unit: 'S.U.',
        sampledOn: '2026-02-04T00:00:00Z',
        exceeds: false,
      },
      {
        key: 'fld-2',
        parameterName: 'pH',
        resultKind: 'field',
        value: 7.55,
        unit: 'S.U.',
        sampledOn: '2026-05-15T00:00:00Z',
        exceeds: false,
      },
    ])

    expect(dates).toEqual(['2026-02-04', '2026-05-15'])
    expect(rows).toHaveLength(1)
    expect(rows[0].valuesByDate).toEqual({
      '2026-02-04': '7.61',
      '2026-05-15': '7.55',
    })
  })
})

describe('latestResultPerParameter', () => {
  const result = (
    key: string,
    parameterName: string,
    sampledOn: string,
    extra: Record<string, unknown> = {}
  ) =>
    ({
      key,
      parameterName,
      resultKind: 'minor',
      value: 1,
      unit: 'mg/L',
      sampledOn,
      exceeds: false,
      ...extra,
    }) as ReturnType<typeof summarizeChemistry>['rows'][number]

  it('keeps each parameter once, at its newest value', () => {
    const { rows, dateRange } = latestResultPerParameter([
      result('a', 'Arsenic', '2026-02-04T00:00:00Z'),
      result('b', 'Arsenic', '2026-05-15T00:00:00Z'),
      result('c', 'Iron', '2026-05-15T00:00:00Z'),
    ])

    expect(rows.map((row) => row.key)).toEqual(['b', 'c'])
    expect(dateRange).toEqual(['2026-05-15', '2026-05-15'])
  })

  it('keeps a parameter sampled on its own visit rather than dropping it', () => {
    // Majors and trace metals routinely come from different trips. Keying the
    // table to one date would leave a flagged parameter with no row.
    const { rows, dateRange } = latestResultPerParameter([
      result('tds', 'Total Dissolved Solids', '2019-04-09T00:00:00Z', {
        exceeds: true,
        standard: { kind: 'SMCL', limit: 500, unit: 'mg/L' },
      }),
      result('arsenic', 'Arsenic', '2019-05-24T00:00:00Z'),
    ])

    expect(rows.map((row) => row.key)).toEqual(['tds', 'arsenic'])
    expect(dateRange).toEqual(['2019-04-09', '2019-05-24'])
  })

  it('puts exceedances first, health limits before taste limits', () => {
    const { rows } = latestResultPerParameter([
      result('iron', 'Iron', '2026-05-15T00:00:00Z', {
        exceeds: true,
        standard: { kind: 'SMCL', limit: 0.3, unit: 'mg/L' },
      }),
      result('calcium', 'Calcium', '2026-05-15T00:00:00Z'),
      result('arsenic', 'Arsenic', '2026-05-15T00:00:00Z', {
        exceeds: true,
        standard: { kind: 'MCL', limit: 0.01, unit: 'mg/L' },
      }),
    ])

    expect(rows.map((row) => row.key)).toEqual(['arsenic', 'iron', 'calcium'])
  })
})

describe('toWaterLevelReadings', () => {
  const observations = [
    {
      id: 1,
      observation_datetime: '2019-04-09T20:02:00Z',
      depth_to_water_bgs: 9.35,
      sensor_id: null,
    },
    {
      id: 2,
      observation_datetime: '2018-10-04T20:39:00Z',
      depth_to_water_bgs: 10.5,
      sensor_id: 7,
    },
  ]

  it('works the water table elevation out from the land surface', () => {
    const readings = toWaterLevelReadings(observations, { elevationFt: 5856.8 })

    expect(readings[0].measuredOn).toBe('2019-04-09T20:02:00Z')
    // 5856.8 - 9.35, rounded to the tenth of a foot the report prints.
    expect(readings[0].waterElevationFt).toBe(5847.4)
    expect(readings[0].method).toBe('Manual')
    expect(readings[1].method).toBe('Transducer')
  })

  it('leaves elevation empty rather than printing the depth twice', () => {
    const readings = toWaterLevelReadings(observations)
    expect(readings[0].waterElevationFt).toBeNull()
    expect(readings[0].depthToWaterFt).toBe(9.35)
  })
})

describe('waterLevelChangeFt', () => {
  it('reads a deeper newest reading as a fall in water level', () => {
    // Depth is measured downward, so deeper is lower.
    const readings = toWaterLevelReadings([
      {
        id: 1,
        observation_datetime: '2019-04-09T00:00:00Z',
        depth_to_water_bgs: 12.3,
      },
      {
        id: 2,
        observation_datetime: '2018-04-09T00:00:00Z',
        depth_to_water_bgs: 10.5,
      },
    ])

    expect(waterLevelChangeFt(readings)).toEqual({
      changeFt: -1.8,
      comparedTo: '2018-04-09T00:00:00Z',
    })
  })

  it('reports nothing when there is only one reading to go on', () => {
    const readings = toWaterLevelReadings([
      {
        id: 1,
        observation_datetime: '2019-04-09T00:00:00Z',
        depth_to_water_bgs: 12.3,
      },
    ])
    expect(waterLevelChangeFt(readings)).toBeNull()
  })
})
