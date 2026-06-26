// @vitest-environment jsdom
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const captureEventMock = vi.fn()
const mutateGroupThingMock = vi.fn()
const invalidateWellDetailsMock = vi.fn()
const notifyMock = vi.fn()
const onCloseMock = vi.fn()

const queryClientMock = {
  getQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
}

vi.mock('@/analytics/posthog', () => ({
  captureEvent: (...args: unknown[]) => captureEventMock(...args),
}))

vi.mock('@refinedev/core', () => ({
  useCustomMutation: () => ({
    mutateAsync: mutateGroupThingMock,
    mutation: { isPending: false },
  }),
  useList: () => ({
    result: {
      data: [
        { id: 10, name: 'Available Project', group_type: 'Monitoring' },
        { id: 11, name: 'Another Project', group_type: null },
      ],
    },
    query: { isLoading: false },
  }),
  useNotification: () => ({ open: notifyMock }),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => queryClientMock,
}))

vi.mock('@/hooks', () => ({
  invalidateWellDetails: (...args: unknown[]) =>
    invalidateWellDetailsMock(...args),
  wellDetailsQueryKey: (id: unknown) => ['wells', id],
}))

vi.mock('@/components/editing', () => ({
  EditPanel: ({
    title,
    children,
    footer,
    onClose,
  }: {
    title: string
    children: React.ReactNode
    footer?: React.ReactNode
    onClose: () => void
  }) => (
    <div data-testid="edit-panel">
      <span data-testid="panel-title">{title}</span>
      <button data-testid="panel-close" onClick={onClose}>
        ×
      </button>
      <div>{children}</div>
      {footer && <div data-testid="panel-footer">{footer}</div>}
    </div>
  ),
  EditPanelSection: ({
    title,
    children,
  }: {
    title: string
    children: React.ReactNode
  }) => (
    <div>
      <h3>{title}</h3>
      {children}
    </div>
  ),
  EditPanelField: ({
    label,
    children,
  }: {
    label: string
    children: React.ReactNode
  }) => (
    <div>
      <label>{label}</label>
      {children}
    </div>
  ),
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
    disabled,
  }: {
    value?: string
    onValueChange?: (v: string) => void
    children: React.ReactNode
    disabled?: boolean
  }) => (
    <select
      value={value ?? ''}
      onChange={(e) => onValueChange?.(e.target.value)}
      disabled={disabled}
    >
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <option value="">{placeholder}</option>
  ),
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

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({
    open,
    children,
  }: {
    open: boolean
    children: React.ReactNode
  }) => (open ? <div role="alertdialog">{children}</div> : null),
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
  AlertDialogAction: ({
    onClick,
    children,
  }: {
    onClick: () => void
    children: React.ReactNode
  }) => <button onClick={onClick}>{children}</button>,
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}))

import { WellEditPanel } from '@/components/WellEdit/WellEditPanel'
import type { IGroup } from '@/interfaces/ocotillo/IGroup'

const GROUP_ALPHA: IGroup = { id: 1, name: 'Project Alpha', group_type: 'Monitoring' }
const GROUP_BETA: IGroup = { id: 2, name: 'Project Beta', group_type: null }

const renderPanel = (assignedGroups: IGroup[] = [GROUP_ALPHA]) =>
  render(
    <WellEditPanel
      wellId={42}
      wellName="Test Well"
      assignedGroups={assignedGroups}
      isAssignedGroupsLoading={false}
      onClose={onCloseMock}
    />
  )

describe('WellEditPanel', () => {
  beforeEach(() => {
    captureEventMock.mockClear()
    mutateGroupThingMock.mockClear()
    invalidateWellDetailsMock.mockClear()
    notifyMock.mockClear()
    onCloseMock.mockClear()
    mutateGroupThingMock.mockResolvedValue({})
    invalidateWellDetailsMock.mockResolvedValue(undefined)
    queryClientMock.getQueryData.mockReturnValue({ well: { groups: [GROUP_ALPHA] } })
  })

  describe('PostHog events', () => {
    it('fires edit_panel_opened with resource and well_id on mount', () => {
      renderPanel()
      expect(captureEventMock).toHaveBeenCalledWith('edit_panel_opened', {
        resource: 'well',
        well_id: 42,
      })
    })

    it('fires edit_saved after successfully saving group changes', async () => {
      const user = userEvent.setup()
      renderPanel()

      await user.click(screen.getByRole('button', { name: 'Remove Project Alpha' }))
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(captureEventMock).toHaveBeenCalledWith(
          'edit_saved',
          expect.objectContaining({
            resource: 'well',
            well_id: 42,
            fields_changed: ['groups'],
          })
        )
      })
    })

    it('fires edit_abandoned with had_changes:true when the user discards unsaved changes', async () => {
      const user = userEvent.setup()
      renderPanel()

      await user.click(screen.getByRole('button', { name: 'Remove Project Alpha' }))
      await user.click(screen.getByTestId('panel-close'))
      await user.click(screen.getByRole('button', { name: 'Discard' }))

      expect(captureEventMock).toHaveBeenCalledWith(
        'edit_abandoned',
        expect.objectContaining({
          resource: 'well',
          well_id: 42,
          had_changes: true,
        })
      )
    })

    it('does not fire edit_abandoned when closing without any changes', async () => {
      const user = userEvent.setup()
      renderPanel()
      await user.click(screen.getByTestId('panel-close'))

      expect(captureEventMock).not.toHaveBeenCalledWith(
        'edit_abandoned',
        expect.anything()
      )
    })
  })

  describe('panel title', () => {
    it('shows Edit: {well name} in the title', () => {
      renderPanel()
      expect(screen.getByTestId('panel-title')).toHaveTextContent('Edit: Test Well')
    })
  })

  describe('assigned groups display', () => {
    it('shows assigned group chips', () => {
      renderPanel()
      expect(screen.getByText('Project Alpha')).toBeTruthy()
    })

    it('shows multiple assigned groups', () => {
      renderPanel([GROUP_ALPHA, GROUP_BETA])
      expect(screen.getByText('Project Alpha')).toBeTruthy()
      expect(screen.getByText('Project Beta')).toBeTruthy()
    })

    it('shows "No projects assigned yet." when assignedGroups is empty', () => {
      renderPanel([])
      expect(screen.getByText('No projects assigned yet.')).toBeTruthy()
    })
  })

  describe('save button state', () => {
    it('disables Save when no groups have changed', () => {
      renderPanel()
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    })

    it('enables Save after removing a group', async () => {
      const user = userEvent.setup()
      renderPanel()
      await user.click(screen.getByRole('button', { name: 'Remove Project Alpha' }))
      expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
    })
  })

  describe('saving', () => {
    it('calls the delete mutation for removed groups', async () => {
      const user = userEvent.setup()
      renderPanel()

      await user.click(screen.getByRole('button', { name: 'Remove Project Alpha' }))
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(mutateGroupThingMock).toHaveBeenCalledWith(
          expect.objectContaining({
            url: 'group/1/things/42',
            method: 'delete',
            dataProviderName: 'ocotillo',
          })
        )
      })
    })

    it('invalidates well details after a successful save', async () => {
      const user = userEvent.setup()
      renderPanel()

      await user.click(screen.getByRole('button', { name: 'Remove Project Alpha' }))
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(invalidateWellDetailsMock).toHaveBeenCalledWith(
          queryClientMock,
          42
        )
      })
    })

    it('calls onClose after a successful save', async () => {
      const user = userEvent.setup()
      renderPanel()

      await user.click(screen.getByRole('button', { name: 'Remove Project Alpha' }))
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => expect(onCloseMock).toHaveBeenCalled())
    })
  })

  describe('close and discard behavior', () => {
    it('calls onClose immediately when there are no unsaved changes', async () => {
      const user = userEvent.setup()
      renderPanel()
      await user.click(screen.getByTestId('panel-close'))
      expect(onCloseMock).toHaveBeenCalled()
    })

    it('shows the discard dialog when closing with unsaved changes', async () => {
      const user = userEvent.setup()
      renderPanel()

      await user.click(screen.getByRole('button', { name: 'Remove Project Alpha' }))
      await user.click(screen.getByTestId('panel-close'))

      expect(screen.getByRole('alertdialog')).toBeTruthy()
      expect(onCloseMock).not.toHaveBeenCalled()
    })

    it('calls onClose when the user confirms discard', async () => {
      const user = userEvent.setup()
      renderPanel()

      await user.click(screen.getByRole('button', { name: 'Remove Project Alpha' }))
      await user.click(screen.getByTestId('panel-close'))
      await user.click(screen.getByRole('button', { name: 'Discard' }))

      expect(onCloseMock).toHaveBeenCalled()
    })

    it('does not close when the user cancels the discard dialog', async () => {
      const user = userEvent.setup()
      renderPanel()

      await user.click(screen.getByRole('button', { name: 'Remove Project Alpha' }))
      await user.click(screen.getByTestId('panel-close'))
      await user.click(screen.getByRole('button', { name: 'Keep editing' }))

      expect(onCloseMock).not.toHaveBeenCalled()
    })
  })
})
