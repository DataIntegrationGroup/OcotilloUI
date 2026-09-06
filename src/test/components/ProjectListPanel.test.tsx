// @vitest-environment jsdom

import { act, render, screen } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectsTableProps } from '@/components/ProjectsTable/ProjectsTable'
import type { IGroup } from '@/interfaces/ocotillo/IGroup'

const captureEventMock = vi.fn()
let canEditAmp = true

const PROJECT: IGroup = {
  id: 7,
  name: 'Questa Red River',
  description: null,
  created_at: '2026-02-27T17:37:49Z',
  group_type: 'Monitoring Plan',
  release_status: 'draft',
}

vi.mock('@/analytics/posthog', () => ({
  captureEvent: (...args: unknown[]) => captureEventMock(...args),
}))

vi.mock('@refinedev/core', () => ({
  CanAccess: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useList: () => ({
    result: { data: [PROJECT], total: 1 },
    query: { isLoading: false },
  }),
}))

vi.mock('@mui/material', () => ({
  Typography: ({ children }: { children: React.ReactNode }) => (
    <h1>{children}</h1>
  ),
}))

vi.mock('@/components/AppBreadcrumb', () => ({ AppBreadcrumb: () => null }))
vi.mock('@/components/OcotilloPageHeader', () => ({
  ocotilloPageTitleTypographySx: {},
}))

vi.mock('@/hooks', () => ({
  useAccessCapabilities: () => ({ canEditAmp }),
}))

// Captures what the page hands the table so the wiring can be driven directly.
let tableProps: ProjectsTableProps | null = null

vi.mock('@/components/ProjectsTable/ProjectsTable', () => ({
  ProjectsTable: (props: ProjectsTableProps) => {
    tableProps = props
    return <div data-testid="projects-table" />
  },
}))

vi.mock('@/components/editing', () => ({
  EditPanelLayout: ({
    open,
    panel,
    children,
  }: {
    open: boolean
    panel: React.ReactNode
    children: React.ReactNode
  }) => (
    <div>
      {children}
      {open ? <div data-testid="panel-open">{panel}</div> : null}
    </div>
  ),
}))

vi.mock('@/components/ProjectEdit/ProjectEditPanel', () => ({
  ProjectEditPanel: ({ projectName }: { projectName?: string | null }) => (
    <div data-testid="project-edit-panel">{projectName}</div>
  ),
}))

// Stubbed out because the real dialog pulls in mapbox-gl, which jsdom cannot run.
vi.mock('@/components/ProjectsTable/ProjectBoundaryDialog', () => ({
  ProjectBoundaryDialog: ({ project }: { project: IGroup | null }) =>
    project ? <div data-testid="boundary-dialog">{project.name}</div> : null,
}))

import { ProjectList } from '@/pages/ocotillo/projects'

describe('ProjectList edit wiring', () => {
  beforeEach(() => {
    tableProps = null
    captureEventMock.mockClear()
    canEditAmp = true
  })

  it('tells the table whether the user can edit', () => {
    render(<ProjectList />)
    expect(tableProps?.canEdit).toBe(true)

    canEditAmp = false
    render(<ProjectList />)
    expect(tableProps?.canEdit).toBe(false)
  })

  it('opens the panel for the edited project and records the trigger', () => {
    render(<ProjectList />)
    expect(screen.queryByTestId('panel-open')).toBeNull()

    act(() => tableProps?.onEdit?.(PROJECT, 'edit_action'))

    expect(screen.getByTestId('project-edit-panel')).toHaveTextContent(
      'Questa Red River'
    )
    expect(captureEventMock).toHaveBeenCalledWith('projects_edit_opened', {
      project_id: PROJECT.id,
      project_name: PROJECT.name,
      trigger: 'edit_action',
    })
  })

  it('records double click as its own trigger', () => {
    render(<ProjectList />)

    act(() => tableProps?.onEdit?.(PROJECT, 'row_double_click'))

    expect(captureEventMock).toHaveBeenCalledWith('projects_edit_opened', {
      project_id: PROJECT.id,
      project_name: PROJECT.name,
      trigger: 'row_double_click',
    })
  })

  it('does not open the panel for users who cannot edit', () => {
    canEditAmp = false
    render(<ProjectList />)

    act(() => tableProps?.onEdit?.(PROJECT, 'edit_action'))

    expect(screen.queryByTestId('panel-open')).toBeNull()
    expect(captureEventMock).not.toHaveBeenCalledWith(
      'projects_edit_opened',
      expect.anything()
    )
  })

  it('opens the boundary dialog for the chosen project', () => {
    render(<ProjectList />)
    expect(screen.queryByTestId('boundary-dialog')).toBeNull()

    act(() => tableProps?.onViewBoundary?.(PROJECT))

    expect(screen.getByTestId('boundary-dialog')).toHaveTextContent(
      'Questa Red River'
    )
    expect(screen.queryByTestId('panel-open')).toBeNull()
    expect(captureEventMock).toHaveBeenCalledWith('project_boundary_viewed', {
      project_id: PROJECT.id,
      project_name: PROJECT.name,
    })
  })

  it('selects a row without opening the panel', () => {
    render(<ProjectList />)

    act(() => tableProps?.onSelect?.(PROJECT))

    expect(screen.queryByTestId('panel-open')).toBeNull()
    expect(tableProps?.selectedProjectId).toBe(PROJECT.id)
  })
})
