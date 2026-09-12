// @vitest-environment jsdom

import type { GridColDef } from '@mui/x-data-grid'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  ChemistryDisplayResponse,
  ChemistryDisplayTabKey,
} from '@/interfaces/ocotillo'
import { axiosCall } from '@/providers/ocotillo-data-provider'

const mockedUseQuery = vi.fn()
const mockedAxiosCall = vi.mocked(axiosCall)

vi.mock('@tanstack/react-query', () => ({
  useQuery: (args?: unknown) => mockedUseQuery(args),
}))

vi.mock('@mui/x-data-grid', () => ({
  DataGrid: ({
    columns,
    rows,
  }: {
    columns: GridColDef[]
    rows: { id: string | number }[]
  }) => (
    <div data-testid="water-chemistry-grid">
      <div data-testid="column-fields">
        {columns.map((column) => column.field).join(',')}
      </div>
      <div data-testid="row-count">{rows.length}</div>
    </div>
  ),
}))

vi.mock('@/providers/ocotillo-data-provider', () => ({
  axiosCall: vi.fn(),
}))

const tabData = (key: ChemistryDisplayTabKey) => ({
  results: [
    {
      id: `${key}-result`,
      sample_info_id: 1,
      source: 'major' as const,
      parameter_key: `${key}_result_parameter`,
      parameter_name: `${key} result`,
      value: 2,
    },
    {
      id: `${key}-sample-2-result`,
      sample_info_id: 2,
      source: 'major' as const,
      parameter_key: `${key}_result_parameter`,
      parameter_name: `${key} result`,
      value: 3,
    },
  ],
})

const chemistryResponse: ChemistryDisplayResponse = {
  samples: [
    {
      id: 1,
      thing_id: 42,
      label: 'Sample 1',
      nma_sample_point_id: 'SP-1',
      collection_date: '2026-01-02T00:00:00Z',
      sample_notes: 'Field parameter sample note',
    },
    {
      id: 2,
      thing_id: 42,
      label: 'Sample 2',
      nma_sample_point_id: 'SP-2',
      collection_date: '2026-02-03T00:00:00Z',
    },
  ],
  field_parameters: tabData('field_parameters'),
  general_chemistry: {
    ...tabData('general_chemistry'),
    standards_summary: {
      above_mcl_count: 0,
      above_smcl_count: 0,
      compared_parameter_count: 0,
      latest_analysis_date: null,
    },
  },
  environmental_tracers: tabData('environmental_tracers'),
  additional_analyses: tabData('additional_analyses'),
}

import { WaterChemistryCard } from '@/components/WellShow/WaterChemistry'

describe('WaterChemistryCard', () => {
  beforeEach(() => {
    mockedUseQuery.mockReset()
    mockedAxiosCall.mockReset()
  })

  it.each([
    ['General Chemistry', 'general_chemistry'],
    ['Environmental Tracers', 'environmental_tracers'],
    ['Additional Analyses', 'additional_analyses'],
  ])('always shows %s as a crosstab', async (tabLabel, tabKey) => {
    mockedUseQuery.mockReturnValue({
      data: chemistryResponse,
      isLoading: false,
      isPending: false,
      error: null,
    })

    const user = userEvent.setup()
    render(<WaterChemistryCard thingId={42} />)

    await user.click(screen.getByRole('tab', { name: tabLabel }))

    expect(screen.getByTestId('row-count')).toHaveTextContent('2')
    expect(
      within(screen.getByTestId('column-fields')).getByText(
        new RegExp(`sample_label.*parameter_${tabKey}_result_parameter`)
      )
    ).toBeInTheDocument()
  })

  it('shows every well sample in the field parameters crosstab', async () => {
    mockedUseQuery.mockReturnValue({
      data: chemistryResponse,
      isLoading: false,
      isPending: false,
      error: null,
    })

    const user = userEvent.setup()
    render(<WaterChemistryCard thingId={42} />)

    await user.click(screen.getByRole('combobox', { name: 'View' }))
    await user.click(
      screen.getByRole('option', { name: 'Cross-tab for all views' })
    )

    expect(screen.getByTestId('row-count')).toHaveTextContent('2')
    expect(
      within(screen.getByTestId('column-fields')).getByText(
        /sample_label.*parameter_field_parameters_result_parameter/
      )
    ).toBeInTheDocument()
    expect(screen.queryByText(/Sampling Event Note:/)).not.toBeInTheDocument()
  })

  it('shows the sampling event note only for current field parameters', async () => {
    mockedUseQuery.mockReturnValue({
      data: chemistryResponse,
      isLoading: false,
      isPending: false,
      error: null,
    })

    const user = userEvent.setup()
    render(<WaterChemistryCard thingId={42} />)

    expect(screen.getByText(/Sampling Event Note:/)).toBeInTheDocument()
    expect(screen.getByText('Field parameter sample note')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'General Chemistry' }))

    expect(screen.queryByText(/Sampling Event Note:/)).not.toBeInTheDocument()
  })

  it('fetches well-level chemistry instead of sample-scoped chemistry', async () => {
    mockedUseQuery.mockReturnValue({
      data: chemistryResponse,
      isLoading: false,
      isPending: false,
      error: null,
    })
    mockedAxiosCall.mockResolvedValue({
      data: { items: [], total: 0, page: 1, size: 10000, pages: 0 },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as Awaited<ReturnType<typeof axiosCall>>)

    render(<WaterChemistryCard thingId={42} />)

    const queryConfig = mockedUseQuery.mock.calls[0][0]
    await queryConfig.queryFn({ signal: undefined })

    expect(mockedAxiosCall).toHaveBeenCalledWith(
      'chemistry/results?thing_id=42&size=10000',
      expect.any(Object)
    )
  })

  it('adapts paginated results into samples and display tabs', async () => {
    mockedUseQuery.mockReturnValue({
      data: chemistryResponse,
      isLoading: false,
      isPending: false,
      error: null,
    })
    mockedAxiosCall.mockResolvedValue({
      data: {
        items: [
          {
            id: 'maj-1',
            thing_id: 42,
            sample_id: 7,
            parameter_name: 'Calcium',
            parameter_key: 'major_calcium',
            value: 12,
            source: 'major',
            result_kind: 'major',
            observation_datetime: '2026-01-02T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        size: 10000,
        pages: 1,
      },
    } as Awaited<ReturnType<typeof axiosCall>>)

    render(<WaterChemistryCard thingId={42} />)

    const queryConfig = mockedUseQuery.mock.calls[0][0]
    const result = await queryConfig.queryFn({ signal: undefined })

    expect(result.samples).toEqual([
      expect.objectContaining({
        id: 7,
        collection_date: '2026-01-02T00:00:00Z',
      }),
    ])
    expect(result.general_chemistry.results).toEqual([
      expect.objectContaining({ id: 'maj-1', sample_info_id: 7 }),
    ])
  })
})
