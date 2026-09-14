// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { IGroup } from '@/interfaces/ocotillo/IGroup'

vi.mock('react-router', () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string
    children: React.ReactNode
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

// Radix Select needs pointer APIs jsdom lacks; swap in a native select.
vi.mock('@/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value?: string
    onValueChange?: (value: string) => void
    children: React.ReactNode
  }) => (
    <select
      value={value ?? ''}
      onChange={(event) => onValueChange?.(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ 'aria-label': label }: { 'aria-label'?: string }) => (
    <optgroup label={label} />
  ),
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectItem: ({
    value,
    children,
  }: {
    value: string
    children: React.ReactNode
  }) => <option value={value}>{children}</option>,
}))

import { ProjectsTable } from '@/components/ProjectsTable/ProjectsTable'

const project = (overrides: Partial<IGroup> & { id: number }): IGroup => ({
  name: `Project ${overrides.id}`,
  description: null,
  created_at: '2026-02-27T17:37:49Z',
  release_status: 'draft',
  group_type: 'Monitoring Plan',
  ...overrides,
})

const PROJECTS: IGroup[] = [
  project({
    id: 1,
    name: 'Tularosa Basin',
    description: 'Southern basin monitoring',
    created_at: '2026-03-01T00:00:00Z',
  }),
  project({
    id: 2,
    name: 'Arroyo Seco',
    group_type: null,
    release_status: 'public',
    created_at: '2026-01-01T00:00:00Z',
  }),
  project({
    id: 3,
    name: 'Espanola Basin',
    group_type: 'Historical',
    created_at: '2026-02-01T00:00:00Z',
    project_area:
      'MULTIPOLYGON (((-106 35, -105 35, -105 36, -106 36, -106 35)))',
  }),
]

const renderTable = (
  props: Partial<React.ComponentProps<typeof ProjectsTable>> = {}
) =>
  render(
    <ProjectsTable
      projects={PROJECTS}
      projectHref={(item) => `/projects/${item.id}`}
      {...props}
    />
  )

/** Row names in render order, skipping the header row. */
const rowNames = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent)

describe('ProjectsTable sorting', () => {
  it('sorts by name ascending by default', () => {
    renderTable()

    expect(rowNames()).toEqual([
      'Arroyo Seco',
      'Espanola Basin',
      'Tularosa Basin',
    ])
  })

  it('reverses direction when the same header is clicked again', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.click(screen.getByRole('button', { name: /^Name/ }))

    expect(rowNames()).toEqual([
      'Tularosa Basin',
      'Espanola Basin',
      'Arroyo Seco',
    ])
  })

  it('sorts dates chronologically, not as strings', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.click(screen.getByRole('button', { name: /^Created At/ }))

    expect(rowNames()).toEqual([
      'Arroyo Seco',
      'Espanola Basin',
      'Tularosa Basin',
    ])
  })

  it('sorts blank values last regardless of direction', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.click(screen.getByRole('button', { name: /^Type/ }))
    expect(rowNames()[2]).toBe('Arroyo Seco')

    await user.click(screen.getByRole('button', { name: /^Type/ }))
    expect(rowNames()[2]).toBe('Arroyo Seco')
  })

  it('exposes sort state to assistive tech', async () => {
    const user = userEvent.setup()
    renderTable()

    const nameHeader = screen
      .getByRole('button', { name: /^Name/ })
      .closest('th') as HTMLElement
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')

    await user.click(screen.getByRole('button', { name: /^Name/ }))
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending')
  })
})

describe('ProjectsTable filtering', () => {
  it('searches across name and description', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.type(screen.getByLabelText('Search projects'), 'southern')

    expect(rowNames()).toEqual(['Tularosa Basin'])
  })

  it('filters by type, including projects with no type', async () => {
    const user = userEvent.setup()
    renderTable()

    const [typeSelect] = screen.getAllByRole('combobox')

    await user.selectOptions(typeSelect, 'Historical')
    expect(rowNames()).toEqual(['Espanola Basin'])

    await user.selectOptions(typeSelect, '__empty__')
    expect(rowNames()).toEqual(['Arroyo Seco'])

    await user.selectOptions(typeSelect, '__all__')
    expect(rowNames()).toHaveLength(3)
  })

  it('combines search with a facet filter', async () => {
    const user = userEvent.setup()
    renderTable()

    const [typeSelect] = screen.getAllByRole('combobox')
    await user.selectOptions(typeSelect, 'Monitoring Plan')
    await user.type(screen.getByLabelText('Search projects'), 'arroyo')

    expect(screen.getByText('No projects match these filters.')).toBeVisible()
  })

  it('reports how many rows the filters left', async () => {
    const user = userEvent.setup()
    renderTable()

    expect(screen.getByText('3 projects')).toBeVisible()

    await user.type(screen.getByLabelText('Search projects'), 'basin')
    expect(screen.getByText('2 of 3 projects')).toBeVisible()
  })
})

describe('ProjectsTable row actions', () => {
  it('hides the edit action from users who cannot edit', () => {
    renderTable({ canEdit: false })

    expect(screen.queryByRole('button', { name: /^Edit / })).toBeNull()
  })

  it('reports the edit source for the button and for double click', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    renderTable({ canEdit: true, onEdit })

    await user.click(screen.getByRole('button', { name: 'Edit Arroyo Seco' }))
    expect(onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ id: 2 }),
      'edit_action'
    )

    await user.dblClick(screen.getByText('Tularosa Basin'))
    expect(onEdit).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 1 }),
      'row_double_click'
    )
  })

  it('selects on row click without triggering an edit', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onEdit = vi.fn()
    renderTable({ canEdit: true, onSelect, onEdit })

    await user.click(screen.getByText('Espanola Basin').closest('td')!)

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 3 }))
    expect(onEdit).not.toHaveBeenCalled()
  })

  it('offers the boundary action only for projects that have geometry', async () => {
    const user = userEvent.setup()
    const onViewBoundary = vi.fn()
    renderTable({ onViewBoundary })

    const buttons = screen.getAllByRole('button', { name: /^View boundary/ })
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveAccessibleName('View boundary for Espanola Basin')

    await user.click(buttons[0])
    expect(onViewBoundary).toHaveBeenCalledWith(
      expect.objectContaining({ id: 3 })
    )
  })

  it('does not select the row when the boundary action is used', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    renderTable({ onSelect, onViewBoundary: vi.fn() })

    await user.click(
      screen.getByRole('button', { name: 'View boundary for Espanola Basin' })
    )

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('marks the selected row for styling and assistive tech', () => {
    renderTable({ selectedProjectId: 3 })

    const selected = screen
      .getByText('Espanola Basin')
      .closest('tr') as HTMLElement
    expect(selected).toHaveAttribute('data-state', 'selected')
  })
})
