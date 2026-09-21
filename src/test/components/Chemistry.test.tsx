// @vitest-environment jsdom

import type { GridColDef } from '@mui/x-data-grid'
import { fireEvent, render, screen, within } from '@testing-library/react'
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
    rows: { id: string | number; parameter_name?: string | null }[]
  }) => (
    <div data-testid="water-chemistry-grid">
      <div data-testid="column-fields">
        {columns.map((column) => column.field).join(',')}
      </div>
      <div data-testid="column-headers">
        {columns.map((column) => column.headerName).join(',')}
      </div>
      <div data-testid="column-capabilities">
        {columns
          .map(
            (column) =>
              `${column.field}:${column.sortable !== false}:${
                column.filterable !== false
              }`
          )
          .join(',')}
      </div>
      <div data-testid="column-alignments">
        {columns
          .map((column) => `${column.field}:${column.align}:${column.headerAlign}`)
          .join(',')}
      </div>
      <div data-testid="row-count">{rows.length}</div>
      <div data-testid="row-ids">{rows.map((row) => row.id).join(',')}</div>
      <div data-testid="row-parameters">
        {rows.map((row) => row.parameter_name).join(',')}
      </div>
      <div data-testid="rendered-cells">
        {rows[0]
          ? columns.map((column) => (
              <React.Fragment key={column.field}>
                {column.renderCell?.({ row: rows[0] } as never)}
              </React.Fragment>
            ))
          : null}
      </div>
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
      unit: 'mg/L',
      stabilized: true,
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
      id: 2,
      thing_id: 42,
      label: 'Sample 2',
      nma_sample_point_id: 'SP-2',
      collection_date: '2026-02-03T00:00:00Z',
      sample_notes: 'Field parameter sample note',
    },
    {
      id: 1,
      thing_id: 42,
      label: 'Sample 1',
      nma_sample_point_id: 'SP-1',
      collection_date: '2026-01-02T00:00:00Z',
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

import { ChemistryCard } from '@/components/WellShow/Chemistry'

describe('ChemistryCard', () => {
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
    render(<ChemistryCard thingId={42} />)

    await user.click(screen.getByRole('tab', { name: tabLabel }))

    expect(screen.getByTestId('row-count')).toHaveTextContent('2')
    expect(
      within(screen.getByTestId('column-fields')).getByText(
        new RegExp(`sample_label.*parameter_${tabKey}_result_parameter`)
      )
    ).toBeInTheDocument()
    expect(screen.getByTestId('column-capabilities')).toHaveTextContent(
      `sample_label:true:true,collection_date:true:true,parameter_${tabKey}_result_parameter:false:false,sample_notes:false:false`
    )
  })

  it('shows every well sample in the field parameters crosstab', async () => {
    mockedUseQuery.mockReturnValue({
      data: chemistryResponse,
      isLoading: false,
      isPending: false,
      error: null,
    })

    const user = userEvent.setup()
    render(<ChemistryCard thingId={42} />)

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
    expect(screen.getByRole('combobox', { name: 'Sample' })).toBeDisabled()
  })

  it('uses the canonical field parameter aliases and order in the crosstab', async () => {
    mockedUseQuery.mockReturnValue({
      data: {
        ...chemistryResponse,
        field_parameters: {
          results: [
            {
              id: 'temperature-result',
              sample_info_id: 2,
              source: 'field',
              parameter_key: 'temperature',
              parameter_name: 'temperture',
              value: 18,
              unit: 'deg C',
            },
            {
              id: 'cf-result',
              sample_info_id: 2,
              source: 'field',
              parameter_key: 'cf',
              parameter_name: 'CF',
              value: 450,
              unit: 'uS/cm',
            },
            {
              id: 'dr-result',
              sample_info_id: 2,
              source: 'field',
              parameter_key: 'dr',
              parameter_name: 'DR',
              value: 2,
            },
          ],
        },
      },
      isLoading: false,
      isPending: false,
      error: null,
    })

    const user = userEvent.setup()
    render(<ChemistryCard thingId={42} />)

    await user.click(screen.getByRole('combobox', { name: 'View' }))
    await user.click(
      screen.getByRole('option', { name: 'Cross-tab for all views' })
    )

    expect(screen.getByTestId('column-headers')).toHaveTextContent(
      'Sample,Sample Collection Date,Discharge Rate,Dissolved Oxygen,ORP / Redox,pH,Specific Conductance (uS/cm),Temperature (deg C),Turbidity,Sampling Event Note'
    )
  })

  it('shows the streamlined, left-aligned field parameters columns', () => {
    mockedUseQuery.mockReturnValue({
      data: chemistryResponse,
      isLoading: false,
      isPending: false,
      error: null,
    })

    render(<ChemistryCard thingId={42} />)

    expect(screen.getByTestId('column-fields')).toHaveTextContent(
      'parameter_name,value,unit,stabilized,notes'
    )
    expect(screen.getByTestId('column-headers')).toHaveTextContent(
      'Parameter,Value,Unit,Stabilized,Notes'
    )
    expect(screen.getByTestId('column-alignments')).toHaveTextContent(
      'parameter_name:left:left,value:left:left,unit:left:left,stabilized:left:left,notes:left:left'
    )
  })

  it('normalizes, fills, and orders the field parameter rows', () => {
    mockedUseQuery.mockReturnValue({
      data: {
        ...chemistryResponse,
        field_parameters: {
          results: [
            {
              id: 'temperature-result',
              sample_info_id: 2,
              source: 'field',
              parameter_key: 'temperature',
              parameter_name: 'temperture',
              value: 18,
            },
            {
              id: 'dr-result',
              sample_info_id: 2,
              source: 'field',
              parameter_key: 'dr',
              parameter_name: 'DR',
              value: 2,
            },
            {
              id: 'orp-result',
              sample_info_id: 2,
              source: 'field',
              parameter_key: 'orp',
              parameter_name: 'ORP',
              value: 100,
            },
            {
              id: 'cf-result',
              sample_info_id: 2,
              source: 'field',
              parameter_key: 'cf',
              parameter_name: 'CF',
              value: 450,
            },
          ],
        },
      },
      isLoading: false,
      isPending: false,
      error: null,
    })

    render(<ChemistryCard thingId={42} />)

    expect(screen.getByTestId('row-parameters')).toHaveTextContent(
      'Discharge Rate,Dissolved Oxygen,ORP / Redox,pH,Specific Conductance,Temperature,Turbidity'
    )
    expect(screen.getByTestId('row-count')).toHaveTextContent('7')
  })

  it('shows units in crosstab headers but not result cells', async () => {
    mockedUseQuery.mockReturnValue({
      data: chemistryResponse,
      isLoading: false,
      isPending: false,
      error: null,
    })

    const user = userEvent.setup()
    render(<ChemistryCard thingId={42} />)

    await user.click(screen.getByRole('combobox', { name: 'View' }))
    await user.click(
      screen.getByRole('option', { name: 'Cross-tab for all views' })
    )

    expect(screen.getByTestId('column-headers')).toHaveTextContent(
      'field_parameters result (mg/L)'
    )
    expect(screen.getByTestId('rendered-cells')).toHaveTextContent('2')
    expect(screen.getByTestId('rendered-cells')).not.toHaveTextContent('mg/L')
  })

  it('alphabetizes analysis columns between sample details and notes', async () => {
    mockedUseQuery.mockReturnValue({
      data: {
        ...chemistryResponse,
        general_chemistry: {
          results: [
            {
              id: 'sulfate-result',
              sample_info_id: 1,
              source: 'major',
              parameter_key: 'sulfate',
              parameter_name: 'Sulfate',
              value: 3,
              unit: 'mg/L',
            },
            {
              id: 'arsenic-result',
              sample_info_id: 1,
              source: 'major',
              parameter_key: 'arsenic',
              parameter_name: 'Arsenic',
              value: 2,
              unit: 'mg/L',
            },
          ],
        },
      },
      isLoading: false,
      isPending: false,
      error: null,
    })

    const user = userEvent.setup()
    render(<ChemistryCard thingId={42} />)

    await user.click(screen.getByRole('tab', { name: 'General Chemistry' }))

    expect(screen.getByTestId('column-headers')).toHaveTextContent(
      'Sample,Sample Collection Date,Arsenic (mg/L),Sulfate (mg/L),Sampling Event Note'
    )
  })

  it('orders the sample selector and crosstab chronologically', async () => {
    mockedUseQuery.mockReturnValue({
      data: chemistryResponse,
      isLoading: false,
      isPending: false,
      error: null,
    })

    const user = userEvent.setup()
    render(<ChemistryCard thingId={42} />)

    await user.click(screen.getByRole('combobox', { name: 'Sample' }))

    const sampleOptions = screen.getAllByRole('option')
    expect(
      sampleOptions.map((option) => option.textContent?.split(' - ')[0])
    ).toEqual(['Sample 1', 'Sample 2'])

    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('combobox', { name: 'View' }))
    await user.click(
      screen.getByRole('option', { name: 'Cross-tab for all views' })
    )

    expect(screen.getByTestId('row-ids')).toHaveTextContent('1,2')
  })

  it('selects the newest sample by collection date by default', () => {
    mockedUseQuery.mockReturnValue({
      data: chemistryResponse,
      isLoading: false,
      isPending: false,
      error: null,
    })

    render(<ChemistryCard thingId={42} />)

    expect(screen.getByRole('combobox', { name: 'Sample' })).toHaveTextContent(
      /^Sample 2 -/
    )
    expect(screen.getByTestId('row-ids')).toHaveTextContent(
      'field_parameters-sample-2-result'
    )
    expect(screen.getByTestId('row-ids')).not.toHaveTextContent(
      'field_parameters-result'
    )
  })

  it('constrains the date range to valid sample and calendar dates', () => {
    mockedUseQuery.mockReturnValue({
      data: chemistryResponse,
      isLoading: false,
      isPending: false,
      error: null,
    })

    render(<ChemistryCard thingId={42} />)

    const from = screen.getByLabelText('From')
    const to = screen.getByLabelText('To')
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(now.getDate()).padStart(2, '0')}`

    expect(from).toHaveAttribute('min', '2026-01-02')
    expect(from).toHaveAttribute('max', today)
    expect(to).toHaveAttribute('min', '2026-01-02')
    expect(to).toHaveAttribute('max', today)

    fireEvent.change(to, { target: { value: '2026-01-15' } })
    expect(to).toHaveValue('2026-01-15')
    expect(from).toHaveAttribute('max', '2026-01-15')

    fireEvent.change(from, { target: { value: '2026-01-16' } })
    expect(from).toHaveValue('')

    fireEvent.change(from, { target: { value: '2026-01-10' } })
    expect(from).toHaveValue('2026-01-10')
    expect(to).toHaveAttribute('min', '2026-01-10')

    fireEvent.change(to, { target: { value: '2026-01-09' } })
    expect(to).toHaveValue('2026-01-15')
    fireEvent.change(from, { target: { value: '2026-01-01' } })
    expect(from).toHaveValue('2026-01-10')
    fireEvent.change(to, { target: { value: '2999-01-01' } })
    expect(to).toHaveValue('2026-01-15')
  })

  it('shows the sampling event note only for current field parameters', async () => {
    mockedUseQuery.mockReturnValue({
      data: chemistryResponse,
      isLoading: false,
      isPending: false,
      error: null,
    })

    const user = userEvent.setup()
    render(<ChemistryCard thingId={42} />)

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

    render(<ChemistryCard thingId={42} />)

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
            id: 'maj-2',
            thing_id: 42,
            sample_id: 8,
            parameter_name: 'Calcium',
            parameter_key: 'major_calcium',
            value: 13,
            source: 'major',
            result_kind: 'major',
            observation_datetime: '2025-12-01T00:00:00Z',
          },
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
        total: 2,
        page: 1,
        size: 10000,
        pages: 1,
      },
    } as Awaited<ReturnType<typeof axiosCall>>)

    render(<ChemistryCard thingId={42} />)

    const queryConfig = mockedUseQuery.mock.calls[0][0]
    const result = await queryConfig.queryFn({ signal: undefined })

    expect(result.samples).toEqual([
      expect.objectContaining({
        id: 8,
        collection_date: '2025-12-01T00:00:00Z',
      }),
      expect.objectContaining({
        id: 7,
        collection_date: '2026-01-02T00:00:00Z',
      }),
    ])
    expect(result.general_chemistry.results).toEqual([
      expect.objectContaining({ id: 'maj-2', sample_info_id: 8 }),
      expect.objectContaining({ id: 'maj-1', sample_info_id: 7 }),
    ])
  })
})
