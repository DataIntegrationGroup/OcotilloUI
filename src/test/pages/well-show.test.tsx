// @vitest-environment jsdom
import React from 'react'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockedUseList = vi.fn()
const mockedUseDataGrid = vi.fn()
const mockedUseDataProvider = vi.fn()
const mockedUseQuery = vi.fn()
const mockedUseResourceParams = vi.fn()
const mockedUseAccessCapabilities = vi.fn()
const mockedUseWellDetails = vi.fn()

vi.mock('@refinedev/core', async () => {
  const actual =
    await vi.importActual<typeof import('@refinedev/core')>('@refinedev/core')

  return {
    ...actual,
    useList: (args?: unknown) => mockedUseList(args),
    useDataProvider: (args?: unknown) => mockedUseDataProvider(args),
    useResourceParams: (args?: unknown) => mockedUseResourceParams(args),
  }
})

vi.mock('@refinedev/mui', async () => {
  return {
    useDataGrid: (args?: unknown) => mockedUseDataGrid(args),
    Show: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  }
})

vi.mock('@tanstack/react-query', () => ({
  useQuery: (args?: unknown) => mockedUseQuery(args),
}))

vi.mock('@/hooks', () => ({
  useAccessCapabilities: () => mockedUseAccessCapabilities(),
  useSensorDeploymentRows:
    (): import('@/utils/SensorDeploymentRows').SensorDeploymentRow[] => [],
  useSidebarPanelSync: () => ({
    isPanelOpen: false,
    openPanel: vi.fn(),
    closePanel: vi.fn(),
    togglePanel: vi.fn(),
  }),
  useContainerMinWidth: () => false,
  useWellDetails: (id: unknown) => {
    mockedUseWellDetails(id)
    return {
      query: {
        data: {
          well: { id: 42, name: 'Test Well' },
          contacts: [],
          sensors: [],
          deployments: [],
          well_screens: [],
          field_events: [],
          first_field_event: null,
        },
        isLoading: false,
        isPending: false,
      },
      well: { id: 42, name: 'Test Well' },
      isLoading: false,
      isPending: false,
      invalidateWellDetails: vi.fn(),
    }
  },
}))

vi.mock('@/components', () => {
  const Stub = ({ name }: { name: string }) => <div>{name}</div>
  return {
    CoreWellInfoCard: () => <Stub name="core" />,
    InteractiveSatelliteMapCard: () => <Stub name="map" />,
    HydrographCard: () => <Stub name="hydrograph" />,
    RecentWaterLevelObservationsCard: () => <Stub name="observations" />,
    ContactsCard: () => <Stub name="contacts" />,
    AttachmentsCard: () => <Stub name="attachments" />,
    AlternateIdsCard: () => <Stub name="ids" />,
    USGSInfoCard: () => <Stub name="usgs" />,
    OSEPODInfoCard: () => <Stub name="osepod" />,
    WellPDFActionsButton: () => <Stub name="pdf-actions" />,
    WellScreensCard: () => <Stub name="screens" />,
    EquipmentCard: () => <Stub name="equipment" />,
    NotesAccordion: () => <Stub name="notes" />,
    ConstructionInfoCard: () => <Stub name="construction" />,
    GeologyInformationCard: () => <Stub name="geology" />,
    WellShowTitle: () => <Stub name="title" />,
    OwnerPermissionsCard: () => <Stub name="owner" />,
    MonitoringInfoCard: () => <Stub name="monitoring" />,
  }
})

import { WellShow } from '@/pages/ocotillo/thing/well-show'

describe('WellShow data loading', () => {
  beforeEach(() => {
    mockedUseList.mockClear()
    mockedUseDataGrid.mockClear()
    mockedUseDataProvider.mockClear()
    mockedUseQuery.mockClear()
    mockedUseResourceParams.mockClear()
    mockedUseAccessCapabilities.mockClear()
    mockedUseWellDetails.mockClear()

    mockedUseList.mockImplementation((args: any) => ({
      result: { data: [] },
      query: { isLoading: false, args },
    }))
    mockedUseDataGrid.mockImplementation((args: any) => ({
      dataGridProps: { rows: [], loading: false, args },
    }))
    mockedUseDataProvider.mockReturnValue(() => ({
      getList: vi.fn(),
      custom: vi.fn(),
    }))
    mockedUseQuery.mockImplementation((args: any) => {
      return {
        data: { manualRows: [], transducerRows: [] },
        isLoading: false,
        isPending: false,
      }
    })
    mockedUseResourceParams.mockReturnValue({ id: '42' })
    mockedUseAccessCapabilities.mockReturnValue({ canManageAmp: false })
  })

  it('enables well-scoped queries only when id is present', () => {
    render(<WellShow />)

    const listCalls = mockedUseList.mock.calls.map(([args]) => args)
    expect(listCalls).toEqual([
      expect.objectContaining({
        resource: 'asset',
        queryOptions: expect.objectContaining({ enabled: true }),
      }),
    ])

    const dataGridCalls = mockedUseDataGrid.mock.calls.map(([args]) => args)
    expect(dataGridCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          resource: 'thing/42/id-link',
          queryOptions: expect.objectContaining({ enabled: true }),
        }),
      ])
    )

    expect(mockedUseWellDetails).toHaveBeenCalledWith('42')
  })

  it('keeps well-scoped queries disabled until an id exists', () => {
    mockedUseResourceParams.mockReturnValue({ id: undefined })

    render(<WellShow />)

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

    expect(mockedUseWellDetails).toHaveBeenCalledWith(undefined)
  })
})
