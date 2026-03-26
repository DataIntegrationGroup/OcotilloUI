// @vitest-environment jsdom
import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockedUseShow = vi.fn()
const mockedUseList = vi.fn()
const mockedUseOne = vi.fn()
const mockedUseDataGrid = vi.fn()
const mockedUseDataProvider = vi.fn()
const mockedUseQuery = vi.fn()
const mockedUseResourceParams = vi.fn()
const mockedUseAccessCapabilities = vi.fn()
const mockedUseGo = vi.fn()

vi.mock('@refinedev/core', async () => {
  const actual =
    await vi.importActual<typeof import('@refinedev/core')>('@refinedev/core')

  return {
    ...actual,
    useShow: (args?: unknown) => mockedUseShow(args),
    useList: (args?: unknown) => mockedUseList(args),
    useOne: (args?: unknown) => mockedUseOne(args),
    useDataProvider: (args?: unknown) => mockedUseDataProvider(args),
    useResourceParams: (args?: unknown) => mockedUseResourceParams(args),
    useGo: () => mockedUseGo,
  }
})

vi.mock('@refinedev/mui', async () => {
  return {
    useDataGrid: (args?: unknown) => mockedUseDataGrid(args),
    Show: ({
      children,
      headerButtons,
    }: {
      children: React.ReactNode
      headerButtons?: () => React.ReactNode
    }) => (
      <div>
        {headerButtons?.()}
        {children}
      </div>
    ),
  }
})

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => mockedUseQuery(),
}))

vi.mock('@/hooks', () => ({
  useAccessCapabilities: () => mockedUseAccessCapabilities(),
  useSensorDeploymentRows: () => [],
}))

vi.mock('@/components/AppBreadcrumb', () => ({
  AppBreadcrumb: () => <div />,
}))

vi.mock('@/components', () => {
  const Stub = ({ name }: { name: string }) => <div>{name}</div>
  return {
    CoreWellInfoCard: () => <Stub name="core" />,
    InteractiveSatelliteMapCard: () => <Stub name="map" />,
    HydrographCard: () => <Stub name="hydrograph" />,
    RecentWaterLevelObservationsCard: () => <Stub name="observations" />,
    ContactsCard: () => <Stub name="contacts" />,
    AttachmentsAccordion: () => <Stub name="attachments" />,
    AlternateIdsAccordion: () => <Stub name="ids" />,
    USGSInfoCard: () => <Stub name="usgs" />,
    OSEPODInfoCard: () => <Stub name="osepod" />,
    WellPDFPreviewButton: () => <Stub name="preview" />,
    WellScreensAccordion: () => <Stub name="screens" />,
    EquipmentAccordion: () => <Stub name="equipment" />,
    NotesAccordion: () => <Stub name="notes" />,
    ConstructionInfoAccordion: () => <Stub name="construction" />,
    GeologyInformationAccordion: () => <Stub name="geology" />,
    WellPhysicalPropertiesAccordion: () => <Stub name="physical" />,
    FieldEventHistoryAccordion: () => <Stub name="field-event" />,
    WellPDFDownloadButton: () => <Stub name="download" />,
    WellShowTitle: () => <Stub name="title" />,
    OwnerPermissionsCard: () => <Stub name="owner" />,
  }
})

import { WellShow } from '@/pages/ocotillo/thing/well-show'

describe('WellShow data loading', () => {
  beforeEach(() => {
    mockedUseShow.mockClear()
    mockedUseList.mockClear()
    mockedUseOne.mockClear()
    mockedUseDataGrid.mockClear()
    mockedUseDataProvider.mockClear()
    mockedUseQuery.mockClear()
    mockedUseResourceParams.mockClear()
    mockedUseAccessCapabilities.mockClear()
    mockedUseGo.mockClear()

    mockedUseShow.mockReturnValue({
      query: { isLoading: false },
      result: { id: 42, name: 'Test Well' },
    })
    mockedUseList.mockImplementation((args: any) => ({
      result: { data: [] },
      query: { isLoading: false, args },
    }))
    mockedUseOne.mockImplementation((args: any) => ({
      result: null,
      query: { isLoading: false, args },
    }))
    mockedUseDataGrid.mockImplementation((args: any) => ({
      dataGridProps: { rows: [], loading: false, args },
    }))
    mockedUseDataProvider.mockReturnValue(() => ({
      getList: vi.fn(),
    }))
    mockedUseQuery.mockReturnValue({
      data: { manualRows: [], transducerRows: [] },
      isLoading: false,
    })
    mockedUseResourceParams.mockReturnValue({ id: '42' })
    mockedUseAccessCapabilities.mockReturnValue({ canManageAmp: false })
    mockedUseGo.mockReturnValue(vi.fn())
  })

  it('enables well-scoped queries only when id is present', () => {
    render(<WellShow />)

    const listCalls = mockedUseList.mock.calls.map(([args]) => args)
    expect(listCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          resource: 'asset',
          queryOptions: expect.objectContaining({ enabled: true }),
        }),
        expect.objectContaining({
          resource: 'contact',
          queryOptions: expect.objectContaining({ enabled: true }),
        }),
        expect.objectContaining({
          resource: 'sensor',
          queryOptions: expect.objectContaining({ enabled: true }),
        }),
        expect.objectContaining({
          resource: 'thing/42/deployment',
          queryOptions: expect.objectContaining({ enabled: true }),
        }),
        expect.objectContaining({
          resource: 'thing/well-screen',
          queryOptions: expect.objectContaining({ enabled: true }),
        }),
      ])
    )

    const dataGridCalls = mockedUseDataGrid.mock.calls.map(([args]) => args)
    expect(dataGridCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          resource: 'observation/groundwater-level',
          queryOptions: expect.objectContaining({ enabled: true }),
        }),
        expect.objectContaining({
          resource: 'thing/42/id-link',
          queryOptions: expect.objectContaining({ enabled: true }),
        }),
      ])
    )

    expect(mockedUseOne).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: 'ocotillo.sample',
        queryOptions: expect.objectContaining({ enabled: false }),
      })
    )
  })

  it('keeps well-scoped queries disabled until an id exists', () => {
    mockedUseResourceParams.mockReturnValue({ id: undefined })

    render(<WellShow />)

    expect(mockedUseShow).toHaveBeenCalledWith(
      expect.objectContaining({
        queryOptions: expect.objectContaining({ enabled: false }),
      })
    )

    const listCalls = mockedUseList.mock.calls
      .map(([args]) => args as any)
      .filter(Boolean)
    expect(
      listCalls.every((args) => args.queryOptions?.enabled === false)
    ).toBe(true)

    const dataGridCalls = mockedUseDataGrid.mock.calls
      .map(([args]) => args as any)
      .filter(Boolean)
    expect(
      dataGridCalls.every((args) => args.queryOptions?.enabled === false)
    ).toBe(true)
  })

  it('shows an edit button only to AMP admins', () => {
    mockedUseAccessCapabilities.mockReturnValue({ canManageAmp: true })

    const { getByRole, rerender, queryByRole } = render(<WellShow />)

    expect(getByRole('button', { name: /edit/i })).toBeTruthy()

    mockedUseAccessCapabilities.mockReturnValue({ canManageAmp: false })
    rerender(<WellShow />)

    expect(queryByRole('button', { name: /edit/i })).toBeNull()
  })

  it('navigates to the edit page when edit is clicked', () => {
    mockedUseAccessCapabilities.mockReturnValue({ canManageAmp: true })

    const { getByRole } = render(<WellShow />)
    fireEvent.click(getByRole('button', { name: /edit/i }))

    expect(mockedUseGo).toHaveBeenCalledWith({
      to: '/ocotillo/well/edit/42',
      type: 'push',
    })
  })
})
