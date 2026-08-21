// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChemistryObservation } from '@/hooks/useChemistryReportData'

const mockedUseList = vi.fn()
const mockedGetList = vi.fn()

vi.mock('@refinedev/core', async () => {
  const actual =
    await vi.importActual<typeof import('@refinedev/core')>('@refinedev/core')

  return {
    ...actual,
    useList: (args?: unknown) => mockedUseList(args),
    useDataProvider: () => () => ({ getList: mockedGetList }),
  }
})

import { useWellChemistryReport } from '@/hooks/useWellChemistryReport'

const observation = (
  id: number,
  parameterName: string,
  observation_datetime: string
) =>
  ({
    id,
    observation_datetime,
    value: 1,
    unit: 'mg/L',
    parameter: { parameter_name: parameterName },
  }) as ChemistryObservation

describe('useWellChemistryReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseList.mockReturnValue({
      result: { data: [] },
      query: { isLoading: false },
    })
  })

  it('asks for only the newest sample, newest first', () => {
    renderHook(() => useWellChemistryReport({ thingId: 7834 }))

    expect(mockedUseList).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: 'observation/water-chemistry',
        pagination: { currentPage: 1, pageSize: 1, mode: 'server' },
        sorters: [{ field: 'observation_datetime', order: 'desc' }],
        meta: { params: { thing_id: 7834 } },
        queryOptions: expect.objectContaining({ enabled: true }),
      })
    )
  })

  it('stays idle until the report is on offer', () => {
    renderHook(() => useWellChemistryReport({ thingId: 7834, enabled: false }))

    expect(mockedUseList).toHaveBeenCalledWith(
      expect.objectContaining({
        queryOptions: expect.objectContaining({ enabled: false }),
      })
    )
  })

  it('reports on the most recent sampled year, not the current one', () => {
    mockedUseList.mockReturnValue({
      result: { data: [observation(9, 'Arsenic', '2024-05-15T00:00:00Z')] },
      query: { isLoading: false },
    })

    const { result } = renderHook(() =>
      useWellChemistryReport({ thingId: 7834 })
    )

    expect(result.current.reportYear).toBe(2024)
    expect(result.current.hasChemistry).toBe(true)
  })

  it('has no year to report on when the well has never been sampled', () => {
    const { result } = renderHook(() =>
      useWellChemistryReport({ thingId: 7834 })
    )

    expect(result.current.reportYear).toBeNull()
    expect(result.current.hasChemistry).toBe(false)
  })

  it('pulls the year as a calendar window, sorted for the report', async () => {
    mockedGetList.mockResolvedValue({
      data: [
        observation(2, 'Zinc', '2024-05-15T00:00:00Z'),
        observation(1, 'Arsenic', '2024-05-15T00:00:00Z'),
      ],
      total: 2,
    })

    const { result } = renderHook(() =>
      useWellChemistryReport({ thingId: 7834 })
    )
    const observations = await result.current.fetchYearObservations(2024)

    expect(mockedGetList).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: 'observation/water-chemistry',
        meta: {
          params: {
            thing_id: 7834,
            start_time: '2024-01-01T00:00:00',
            end_time: '2025-01-01T00:00:00',
          },
        },
      })
    )
    expect(observations.map((row) => row.parameter?.parameter_name)).toEqual([
      'Arsenic',
      'Zinc',
    ])
  })

  it('keeps paging until every result for the year is collected', async () => {
    mockedGetList
      .mockResolvedValueOnce({
        data: [observation(1, 'Arsenic', '2024-05-15T00:00:00Z')],
        total: 2,
      })
      .mockResolvedValueOnce({
        data: [observation(2, 'Zinc', '2024-05-15T00:00:00Z')],
        total: 2,
      })

    const { result } = renderHook(() =>
      useWellChemistryReport({ thingId: 7834 })
    )
    const observations = await result.current.fetchYearObservations(2024)

    expect(mockedGetList).toHaveBeenCalledTimes(2)
    expect(observations).toHaveLength(2)
  })

  it('stops rather than looping when a page comes back short of its total', async () => {
    // A total that never gets reached would otherwise page forever.
    mockedGetList.mockResolvedValue({ data: [], total: 99 })

    const { result } = renderHook(() =>
      useWellChemistryReport({ thingId: 7834 })
    )
    const observations = await result.current.fetchYearObservations(2024)

    expect(mockedGetList).toHaveBeenCalledTimes(1)
    expect(observations).toEqual([])
  })
})
