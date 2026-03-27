// @vitest-environment jsdom
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockedUseGo = vi.fn()
const mockedUseResourceParams = vi.fn()
const mockedUseAccessCapabilities = vi.fn()
const mockedUseLexicon = vi.fn()
const mockedUseQuery = vi.fn()
const mockedUseMutation = vi.fn()

vi.mock('@refinedev/core', async () => {
  const actual =
    await vi.importActual<typeof import('@refinedev/core')>('@refinedev/core')

  return {
    ...actual,
    useGo: () => mockedUseGo,
    useResourceParams: () => mockedUseResourceParams(),
  }
})

vi.mock('@tanstack/react-query', () => ({
  useQuery: (args?: unknown) => mockedUseQuery(args),
  useMutation: (args?: unknown) => mockedUseMutation(args),
}))

vi.mock('@/hooks', () => ({
  useAccessCapabilities: () => mockedUseAccessCapabilities(),
  useLexicon: (args: { category: string }) => mockedUseLexicon(args),
}))

vi.mock('@/components', () => ({
  MapComponent: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="map-component">{children}</div>
  ),
}))

vi.mock('react-map-gl', () => ({
  Source: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Layer: () => <div />,
}))

vi.mock('@/components/AppBreadcrumb', () => ({
  AppBreadcrumb: () => <div data-testid="breadcrumb" />,
}))

vi.mock('@/components/form/contact/CreateEditContact', () => ({
  CreateEditContact: () => <div data-testid="contact-editor" />,
}))

vi.mock('@/components/form/thing/CreateEditWell', () => ({
  CreateEditWell: () => <div data-testid="well-editor" />,
}))

vi.mock('@/components/form/thing/CreateEditWellScreen', () => ({
  CreateEditWellScreen: () => <div data-testid="well-screen-editor" />,
}))

vi.mock('@/pages/ocotillo/thing/well-edit.service', () => ({
  createEmptyWellEditForm: vi.fn(() => ({
    well: {
      id: 7,
      name: '',
      release_status: 'public',
      well_casing_materials: [],
      well_purposes: [],
    },
    location: {},
    contacts: [],
    wellScreens: [],
    notes: {},
  })),
  loadWellEditForm: vi.fn(),
  submitWellEditForm: vi.fn(),
}))

import { WellEdit } from '@/pages/ocotillo/thing/edit'

describe('WellEdit lexicon-backed fields', () => {
  beforeEach(() => {
    mockedUseGo.mockReset()
    mockedUseResourceParams.mockReset()
    mockedUseAccessCapabilities.mockReset()
    mockedUseLexicon.mockReset()
    mockedUseQuery.mockReset()
    mockedUseMutation.mockReset()

    mockedUseGo.mockReturnValue(vi.fn())
    mockedUseResourceParams.mockReturnValue({ id: '7' })
    mockedUseAccessCapabilities.mockReturnValue({ canManageAmp: true })
    mockedUseMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    })
    mockedUseQuery.mockReturnValue({
      data: {
        well: {
          id: 7,
          name: 'Test Well',
          release_status: 'public',
          first_visit_date: null,
          well_completion_date: null,
          well_construction_method: 'drilled',
          well_pump_type: 'submersible',
          well_status: 'active',
          well_casing_materials: ['steel'],
          well_purposes: ['monitoring'],
        },
        location: {
          coordinate_method: 'GPS',
          elevation_method: 'DEM',
          latitude: 34.1,
          longitude: -106.9,
        },
        contacts: [],
        wellScreens: [],
        notes: {},
      },
      isLoading: false,
      error: null,
    })
    mockedUseLexicon.mockImplementation(
      ({ category }: { category: string }) => ({
        options:
          {
            well_pump_type: [{ value: 'submersible', label: 'submersible' }],
            well_construction_method: [{ value: 'drilled', label: 'drilled' }],
            well_purpose: [{ value: 'monitoring', label: 'monitoring' }],
            coordinate_method: [{ value: 'GPS', label: 'GPS' }],
            elevation_method: [{ value: 'DEM', label: 'DEM' }],
            status: [{ value: 'active', label: 'active' }],
            casing_material: [{ value: 'steel', label: 'steel' }],
          }[category] ?? [],
      })
    )
  })

  it('renders the targeted fields as lexicon-backed selects and hydrates multi-select values', async () => {
    render(<WellEdit />)

    expect(screen.getByRole('combobox', { name: /pump type/i })).toBeTruthy()
    expect(
      screen.getByRole('combobox', { name: /construction method/i })
    ).toBeTruthy()
    expect(screen.getByRole('combobox', { name: /well status/i })).toBeTruthy()
    expect(
      screen.getByRole('combobox', { name: /coordinate method/i })
    ).toBeTruthy()
    expect(
      screen.getByRole('combobox', { name: /elevation method/i })
    ).toBeTruthy()

    await waitFor(() => {
      expect(screen.getAllByText('monitoring').length).toBeGreaterThan(0)
      expect(screen.getAllByText('steel').length).toBeGreaterThan(0)
    })

    expect(screen.queryByRole('textbox', { name: /pump type/i })).toBeNull()
    expect(
      screen.queryByRole('textbox', { name: /^construction method$/i })
    ).toBeNull()
    expect(screen.queryByRole('textbox', { name: /^well status$/i })).toBeNull()
    expect(
      screen.queryByRole('textbox', { name: /^coordinate method$/i })
    ).toBeNull()
    expect(
      screen.queryByRole('textbox', { name: /^elevation method$/i })
    ).toBeNull()
    expect(
      screen.queryByRole('textbox', { name: /release status/i })
    ).toBeNull()

    const firstVisitInput = screen.getByLabelText('First Visit Date')
    const wellCompletionInput = screen.getByLabelText('Well Completion Date')
    const firstVisitLabel = document.querySelector(
      `label[for="${firstVisitInput.id}"]`
    )
    const wellCompletionLabel = document.querySelector(
      `label[for="${wellCompletionInput.id}"]`
    )
    expect(firstVisitLabel?.getAttribute('data-shrink')).toBe('true')
    expect(wellCompletionLabel?.getAttribute('data-shrink')).toBe('true')
  })
})
