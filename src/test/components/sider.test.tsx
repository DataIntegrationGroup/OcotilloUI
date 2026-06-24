// @vitest-environment jsdom
import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ColorModeContext } from '@/contexts'
import { ThemedSiderV2 } from '@/components/layout/sider'

let mockSiderCollapsed = false
let mockMenuItems: any[] = []
const hiddenResources = new Set<string>()

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual<typeof import('@mui/material')>(
    '@mui/material'
  )

  return {
    ...actual,
    Tooltip: ({ title, children }: any) => (
      <div
        data-testid="tooltip"
        data-tooltip-title={typeof title === 'string' ? title : ''}
      >
        {children}
      </div>
    ),
  }
})

vi.mock('@refinedev/core', () => ({
  CanAccess: ({
    resource,
    children,
  }: {
    resource?: string
    children?: React.ReactNode
  }) => {
    if (resource && hiddenResources.has(resource)) return null
    return <>{children}</>
  },
  useMenu: () => ({
    menuItems: mockMenuItems,
    selectedKey: undefined as string | undefined,
    defaultOpenKeys: [] as string[],
  }),
}))

vi.mock('@refinedev/mui', () => ({
  useThemedLayoutContext: () => ({
    siderCollapsed: mockSiderCollapsed,
    setSiderCollapsed: vi.fn(),
    mobileSiderOpen: false,
    setMobileSiderOpen: vi.fn(),
  }),
  ThemedTitle: () => <div data-testid="themed-title" />,
}))

vi.mock('@/components/layout/dashboard', () => ({
  Dashboard: () => <div data-testid="dashboard" />,
}))

vi.mock('@/components/layout/logout', () => ({
  Logout: () => <div data-testid="logout" />,
}))

const renderSider = () =>
  render(
    <MemoryRouter>
      <ColorModeContext.Provider value={{ mode: 'light', setMode: vi.fn() }}>
        <ThemedSiderV2 />
      </ColorModeContext.Provider>
    </MemoryRouter>
  )

describe('ThemedSiderV2 admin-only indicators', () => {
  beforeEach(() => {
    hiddenResources.clear()
    mockSiderCollapsed = false
    mockMenuItems = [
      {
        key: 'ocotillo.location',
        name: 'ocotillo.location',
        route: '/ocotillo/location',
        children: [],
        meta: { label: 'Locations' },
      },
      {
        key: 'ocotillo.thing-well',
        name: 'ocotillo.thing-well',
        route: '/ocotillo/well',
        children: [],
        meta: { label: 'Wells' },
      },
    ]
  })

  it('shows a lock icon next to visible admin-only menu entries', () => {
    renderSider()

    expect(screen.getAllByText('Locations').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Wells').length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('LockOutlinedIcon').length).toBeGreaterThan(0)
  })

  it('adds Admin only text in collapsed sidebar tooltips', () => {
    mockSiderCollapsed = true

    renderSider()

    const tooltipTitles = screen
      .getAllByTestId('tooltip')
      .map((node) => node.getAttribute('data-tooltip-title'))

    expect(tooltipTitles).toContain('Locations (Admin only)')
    expect(tooltipTitles).toContain('Wells')
  })

  it('keeps non-admin visibility behavior unchanged via CanAccess', () => {
    hiddenResources.add('ocotillo.location')

    renderSider()

    expect(screen.queryByText('Locations')).toBeNull()
    expect(screen.getAllByText('Wells').length).toBeGreaterThan(0)
  })
})
