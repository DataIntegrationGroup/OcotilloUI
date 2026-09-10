import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchContinuousWaterLevels,
  fetchReportWaterLevels,
  TRANSDUCER_RESOURCE,
  WATER_LEVEL_RESOURCE,
} from '@/hooks/chemistryReportFetchers'

const getList = vi.fn()
const provider = { getList } as unknown as Parameters<
  typeof fetchReportWaterLevels
>[0]

const logged = (observation_datetime: string, value: number) => ({
  observation: { observation_datetime, value },
  block: { review_status: 'approved' },
})

describe('fetchReportWaterLevels', () => {
  beforeEach(() => {
    getList.mockReset()
  })

  it('ends both windows on the last instant of a year', async () => {
    // The groundwater level endpoint's end_time is inclusive, so ending on
    // Jan 1 would count a New Year's midnight reading in two years at once.
    getList.mockResolvedValue({ data: [], total: 0 })

    await fetchReportWaterLevels(provider, 1443, 2019)

    const [inYear, prior] = getList.mock.calls.map(([call]) => call)
    expect(inYear).toMatchObject({
      resource: WATER_LEVEL_RESOURCE,
      meta: {
        params: {
          thing_id: 1443,
          start_time: '2019-01-01T00:00:00',
          end_time: '2019-12-31T23:59:59.999',
        },
      },
    })
    expect(prior).toMatchObject({
      pagination: { currentPage: 1, pageSize: 1 },
      sorters: [{ field: 'observation_datetime', order: 'desc' }],
      meta: {
        params: { thing_id: 1443, end_time: '2018-12-31T23:59:59.999' },
      },
    })
  })

  it('marks the reading from before the year as prior', async () => {
    getList
      .mockResolvedValueOnce({
        data: [
          {
            id: 5,
            observation_datetime: '2019-04-09T20:02:00Z',
            depth_to_water_bgs: 10.27,
          },
        ],
        total: 1,
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 4,
            observation_datetime: '2018-10-04T20:39:00Z',
            depth_to_water_bgs: 9.36,
          },
        ],
        total: 4,
      })

    const readings = await fetchReportWaterLevels(provider, 1443, 2019)

    expect(readings.map((reading) => [reading.key, reading.isPrior])).toEqual([
      ['5', false],
      ['4', true],
    ])
  })
})

describe('fetchContinuousWaterLevels', () => {
  beforeEach(() => {
    getList.mockReset()
  })

  it('stops after one request when the well has no logger record', async () => {
    getList.mockResolvedValue({ data: [], total: 0 })

    expect(await fetchContinuousWaterLevels(provider, 1443, 2019)).toBeNull()
    expect(getList).toHaveBeenCalledTimes(1)
  })

  it('describes the year from single readings, never the whole record', async () => {
    getList.mockImplementation(async ({ sorters, meta }) => {
      const inYear = 'start_time' in meta.params
      const [{ field, order }] = sorters
      if (!inYear) {
        return order === 'asc'
          ? { data: [logged('2016-03-09T18:00:00Z', 9.8)], total: 15901 }
          : { data: [logged('2019-04-03T05:00:00Z', 9.51)], total: 15901 }
      }
      if (field === 'value') {
        return order === 'asc'
          ? { data: [logged('2019-03-30T14:00:00Z', 9.41)], total: 1107 }
          : { data: [logged('2019-01-12T03:00:00Z', 10.86)], total: 1107 }
      }
      return order === 'asc'
        ? { data: [logged('2019-01-01T01:00:00Z', 10.21)], total: 1107 }
        : { data: [logged('2019-04-03T05:00:00Z', 9.51)], total: 1107 }
    })

    const summary = await fetchContinuousWaterLevels(provider, 1443, 2019)

    expect(getList).toHaveBeenCalledTimes(6)
    for (const [call] of getList.mock.calls) {
      expect(call.resource).toBe(TRANSDUCER_RESOURCE)
      expect(call.pagination).toEqual({ currentPage: 1, pageSize: 1 })
    }
    expect(summary).toMatchObject({
      recordsInYear: 1107,
      recordsOnFile: 15901,
      periodOfRecord: ['2016-03-09T18:00:00Z', '2019-04-03T05:00:00Z'],
      changeInYearFt: 0.7,
      shallowestInYear: { depthToWaterFt: 9.41 },
      deepestInYear: { depthToWaterFt: 10.86 },
    })
  })

  it('asks for the year with an inclusive end', async () => {
    getList.mockResolvedValue({
      data: [logged('2019-01-01T01:00:00Z', 1)],
      total: 1,
    })

    await fetchContinuousWaterLevels(provider, 1443, 2019)

    const windowed = getList.mock.calls
      .map(([call]) => call.meta.params)
      .filter((params) => 'start_time' in params)
    expect(windowed).toHaveLength(4)
    for (const params of windowed) {
      expect(params).toEqual({
        thing_id: 1443,
        start_time: '2019-01-01T00:00:00',
        end_time: '2019-12-31T23:59:59.999',
      })
    }
  })
})
