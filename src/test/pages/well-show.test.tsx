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
  useSensorDeploymentRows: () => [],
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
    mockedUseList.mockClear()
    mockedUseDataGrid.mockClear()
    mockedUseDataProvider.mockClear()
    mockedUseQuery.mockClear()
    mockedUseResourceParams.mockClear()
    mockedUseAccessCapabilities.mockClear()

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
      if (args?.queryKey?.[0] === 'well-details') {
        return {
          data: {
            well: { id: 42, name: 'Test Well' },
            contacts: [],
            sensors: [],
            deployments: [],
            well_screens: [],
            recent_groundwater_level_observations: [],
            latest_field_event_sample: null,
          },
          isLoading: false,
        }
      }

      return {
        data: { manualRows: [], transducerRows: [] },
        isLoading: false,
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

    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['well-details', '42'],
        enabled: true,
      })
    )
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

    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['well-details', undefined],
        enabled: false,
      })
    )
  })
})
