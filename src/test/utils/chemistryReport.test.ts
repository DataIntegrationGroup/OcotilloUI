import { describe, expect, it } from 'vitest'
import { compareToStandard } from '@/constants/drinkingWaterStandards'
import type { ChemistryResult } from '@/hooks/useChemistryReportData'
import {
  buildChemistryReportFilename,
  chemistryReportYearOf,
  chemistryReportYearParams,
  formatLevelChange,
  formatResultValue,
  inclusiveEndYearParams,
  latestResultPerParameter,
  pivotFieldParameters,
  resultStatus,
  sortChemistryResults,
  summarizeChemistry,
  summarizeContinuousWaterLevels,
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

  it('counts samples by sample, not by the dates their results carry', () => {
    // AR-0102, 2019: one sample collected Apr 09, whose results the old view
    // dated by analysis -- eight different days between Apr 09 and May 24.
    const analysed = [
      '2019-04-09',
      '2019-04-12',
      '2019-04-16',
      '2019-04-18',
      '2019-04-22',
      '2019-04-23',
      '2019-05-22',
      '2019-05-24',
    ]
    const ar0102 = summarizeChemistry(
      analysed.map((day, index) =>
        observation({
          id: `maj-${index}`,
          parameterName: `Analyte ${index}`,
          sample_id: 4321,
          observation_datetime: `${day}T00:00:00Z`,
        })
      )
    )

    expect(ar0102.sampleCount).toBe(1)
  })

  it('counts two samples collected on the same day as two', () => {
    const sameDay = summarizeChemistry([
      observation({ id: 'maj-1', parameterName: 'Arsenic', sample_id: 1 }),
      observation({ id: 'maj-2', parameterName: 'Arsenic', sample_id: 2 }),
    ])

    expect(sameDay.sampleCount).toBe(2)
    expect(sameDay.sampleDates).toHaveLength(1)
  })

  it('falls back to the collection date for a result with no sample id', () => {
    const unkeyed = summarizeChemistry([
      observation({ id: 'maj-1', parameterName: 'Arsenic', sample_id: null }),
      observation({ id: 'maj-2', parameterName: 'Iron', sample_id: null }),
    ])

    expect(unkeyed.sampleCount).toBe(1)
  })

  it('handles a well with no chemistry on file', () => {
    expect(summarizeChemistry([])).toMatchObject({
      sampleCount: 0,
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
    sampleKey: 'sample-1',
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
        sampleKey: 'sample-1',
        exceeds: false,
      },
      {
        key: 'fld-2',
        parameterName: 'pH',
        resultKind: 'field',
        value: 7.55,
        unit: 'S.U.',
        sampledOn: '2026-05-15T00:00:00Z',
        sampleKey: 'sample-2',
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

  it('works no elevation out from a depth below the measuring point', () => {
    // Without the measuring point height, all there is is the depth below
    // the casing top; subtracting it from the land surface would put the
    // water table too low by the stickup.
    const [reading] = toWaterLevelReadings(
      [
        {
          id: 3,
          observation_datetime: '2019-04-09T20:02:00Z',
          value: 10.27,
          depth_to_water_bgs: null,
        },
      ],
      { elevationFt: 5856.8 }
    )

    expect(reading.depthToWaterFt).toBe(10.27)
    expect(reading.depthReference).toBe('measuring point')
    expect(reading.waterElevationFt).toBeNull()
  })

  it('marks a depth below ground as such', () => {
    const readings = toWaterLevelReadings(observations)
    expect(readings[0].depthReference).toBe('ground surface')
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

  it('only compares depths measured from the same reference', () => {
    // The 2018 reading is below the measuring point; comparing it with a
    // depth below ground would report the casing stickup as a change.
    const readings = toWaterLevelReadings([
      {
        id: 1,
        observation_datetime: '2019-04-09T00:00:00Z',
        depth_to_water_bgs: 9.3,
      },
      { id: 2, observation_datetime: '2018-10-04T00:00:00Z', value: 11.4 },
      {
        id: 3,
        observation_datetime: '2018-03-29T00:00:00Z',
        depth_to_water_bgs: 8.9,
      },
    ])

    expect(waterLevelChangeFt(readings)).toEqual({
      changeFt: -0.4,
      comparedTo: '2018-03-29T00:00:00Z',
    })
  })
})

describe('inclusiveEndYearParams', () => {
  it('ends the year on its last instant, for endpoints whose end is inclusive', () => {
    // An hourly logger always has a midnight reading on Jan 1; ending the
    // window on Jan 1 would pull it into the year before.
    expect(inclusiveEndYearParams(2019)).toEqual({
      start_time: '2019-01-01T00:00:00',
      end_time: '2019-12-31T23:59:59.999',
    })
  })
})

describe('formatLevelChange', () => {
  it('signs a rise and leaves a fall to its minus', () => {
    expect(formatLevelChange(0.44)).toBe('+0.4 ft')
    expect(formatLevelChange(-1.25)).toBe('-1.3 ft')
    expect(formatLevelChange(0)).toBe('0.0 ft')
  })
})

describe('summarizeContinuousWaterLevels', () => {
  const reading = (
    observation_datetime: string,
    value: number,
    review_status = 'approved'
  ) => ({
    observation: { observation_datetime, value },
    block: { review_status },
  })

  // AR-0102, 2019: hourly logger, Jan 01 - Apr 03, record back to 2016.
  const summary = summarizeContinuousWaterLevels({
    recordsInYear: 1107,
    recordsOnFile: 15901,
    firstEver: reading('2016-03-09T18:00:00Z', 9.8),
    lastEver: reading('2019-04-03T05:00:00Z', 9.51),
    firstInYear: reading('2019-01-01T01:00:00Z', 10.21),
    lastInYear: reading('2019-04-03T05:00:00Z', 9.51),
    shallowestInYear: reading('2019-03-30T14:00:00Z', 9.41),
    deepestInYear: reading('2019-01-12T03:00:00Z', 10.86),
  })

  it('carries the counts and the spans', () => {
    expect(summary.recordsInYear).toBe(1107)
    expect(summary.recordsOnFile).toBe(15901)
    expect(summary.periodOfRecord).toEqual([
      '2016-03-09T18:00:00Z',
      '2019-04-03T05:00:00Z',
    ])
    expect(summary.firstInYear?.measuredOn).toBe('2019-01-01T01:00:00Z')
    expect(summary.lastInYear?.measuredOn).toBe('2019-04-03T05:00:00Z')
  })

  it('reads a shallower last reading as a rise over the year', () => {
    // 10.21 ft down on Jan 01, 9.51 ft down on Apr 03: the water came up.
    expect(summary.changeInYearFt).toBe(0.7)
  })

  it('keeps the shallowest and deepest readings with their dates', () => {
    expect(summary.shallowestInYear).toEqual({
      measuredOn: '2019-03-30T14:00:00Z',
      depthToWaterFt: 9.41,
    })
    expect(summary.deepestInYear?.depthToWaterFt).toBe(10.86)
  })

  it('flags the year as provisional when its latest reading is unreviewed', () => {
    expect(summary.provisional).toBe(false)
    expect(
      summarizeContinuousWaterLevels({
        recordsInYear: 2,
        recordsOnFile: 2,
        firstInYear: reading('2026-01-01T00:00:00Z', 5),
        lastInYear: reading('2026-02-01T00:00:00Z', 6, 'not reviewed'),
      }).provisional
    ).toBe(true)
  })

  it('reports no change for a year with a single reading', () => {
    const single = reading('2019-01-01T00:00:00Z', 10)
    expect(
      summarizeContinuousWaterLevels({
        recordsInYear: 1,
        recordsOnFile: 1,
        firstInYear: single,
        lastInYear: single,
      }).changeInYearFt
    ).toBeNull()
  })

  it('copes with a record that has nothing in the reporting year', () => {
    const empty = summarizeContinuousWaterLevels({
      recordsInYear: 0,
      recordsOnFile: 15901,
      firstEver: reading('2016-03-09T18:00:00Z', 9.8),
      lastEver: reading('2019-04-03T05:00:00Z', 9.51),
    })

    expect(empty.firstInYear).toBeNull()
    expect(empty.changeInYearFt).toBeNull()
    expect(empty.periodOfRecord).not.toBeNull()
  })
})
