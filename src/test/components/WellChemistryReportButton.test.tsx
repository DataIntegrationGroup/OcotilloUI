// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChemistryObservation } from '@/hooks/useChemistryReportData'
import type { IWell } from '@/interfaces/ocotillo'

const mockedUseList = vi.fn()
const mockedGetList = vi.fn()
const mockedDownload = vi.fn()

vi.mock('@refinedev/core', async () => {
  const actual =
    await vi.importActual<typeof import('@refinedev/core')>('@refinedev/core')

  return {
    ...actual,
    useList: (args?: unknown) => mockedUseList(args),
    useDataProvider: () => () => ({ getList: mockedGetList }),
    useNotification: () => ({ open: vi.fn() }),
  }
})

vi.mock('@/components/pdf/chemistry', () => ({
  downloadChemistryReport: (args: unknown) => mockedDownload(args),
}))

import { WellChemistryReportButton } from '@/components/Button/ChemistryReportDownload'
import { TooltipProvider } from '@/components/ui/tooltip'

const well = { id: 7834, name: 'SA-0231' } as IWell

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

const renderButton = () =>
  render(
    <TooltipProvider>
      <WellChemistryReportButton well={well} contacts={[]} />
    </TooltipProvider>
  )

const getButton = () =>
  screen.getByRole('button', { name: /chemistry report/i })

describe('WellChemistryReportButton', () => {
  beforeEach(() => {
    mockedUseList.mockReset()
    mockedGetList.mockReset()
    mockedDownload.mockReset()
    mockedDownload.mockResolvedValue('chemistry-report-SA-0231-2024.pdf')
  })

  it('asks for only the newest sample, newest first', () => {
    mockedUseList.mockReturnValue({
      result: { data: [] },
      query: { isLoading: false },
    })

    renderButton()

    expect(mockedUseList).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: 'observation/water-chemistry',
        pagination: { currentPage: 1, pageSize: 1, mode: 'server' },
        sorters: [{ field: 'observation_datetime', order: 'desc' }],
        meta: { params: { thing_id: 7834 } },
      })
    )
  })

  it('is disabled when the well has no chemistry on file', () => {
    mockedUseList.mockReturnValue({
      result: { data: [] },
      query: { isLoading: false },
    })

    renderButton()

    expect(getButton()).toBeDisabled()
  })

  it('reports on the most recent sampled year, not the current one', async () => {
    // A well last sampled in 2024 must not produce an empty report for
    // whatever year it happens to be when someone opens the page.
    mockedUseList.mockReturnValue({
      result: { data: [observation(9, 'Arsenic', '2024-05-15T00:00:00Z')] },
      query: { isLoading: false },
    })
    mockedGetList.mockResolvedValue({
      data: [
        observation(2, 'Zinc', '2024-05-15T00:00:00Z'),
        observation(1, 'Arsenic', '2024-05-15T00:00:00Z'),
      ],
      total: 2,
    })

    renderButton()
    const button = getButton()
    expect(button).toBeEnabled()
    await act(async () => {
      fireEvent.click(button)
    })

    await waitFor(() => expect(mockedDownload).toHaveBeenCalledTimes(1))

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

    const [args] = mockedDownload.mock.calls[0]
    expect(args.year).toBe(2024)
    expect(
      args.observations.map(
        (row: ChemistryObservation) => row.parameter?.parameter_name
      )
    ).toEqual(['Arsenic', 'Zinc'])
  })

  it('keeps paging until every result for the year is collected', async () => {
    mockedUseList.mockReturnValue({
      result: { data: [observation(9, 'Arsenic', '2024-05-15T00:00:00Z')] },
      query: { isLoading: false },
    })
    mockedGetList
      .mockResolvedValueOnce({
        data: [observation(1, 'Arsenic', '2024-05-15T00:00:00Z')],
        total: 2,
      })
      .mockResolvedValueOnce({
        data: [observation(2, 'Zinc', '2024-05-15T00:00:00Z')],
        total: 2,
      })

    renderButton()
    await act(async () => {
      fireEvent.click(getButton())
    })

    await waitFor(() => expect(mockedDownload).toHaveBeenCalledTimes(1))

    expect(mockedGetList).toHaveBeenCalledTimes(2)
    expect(mockedDownload.mock.calls[0][0].observations).toHaveLength(2)
  })
})
