// @vitest-environment jsdom
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const captureEventMock = vi.fn()
const updateMutateAsyncMock = vi.fn()
const invalidateMock = vi.fn()
const notifyMock = vi.fn()
const onCloseMock = vi.fn()

vi.mock('@/analytics/posthog', () => ({
  captureEvent: (...args: unknown[]) => captureEventMock(...args),
}))

vi.mock('@refinedev/core', () => ({
  useUpdate: () => ({
    mutateAsync: updateMutateAsyncMock,
    mutation: { isPending: false },
  }),
  useInvalidate: () => invalidateMock,
  useNotification: () => ({ open: notifyMock }),
}))

vi.mock('@/hooks', () => ({
  useLexicon: ({ category }: { category: string }) => ({
    options:
      category === 'role'
        ? [
            { value: 'Owner', label: 'Owner' },
            { value: 'Manager', label: 'Manager' },
          ]
        : [
            { value: 'Primary', label: 'Primary' },
            { value: 'Secondary', label: 'Secondary' },
          ],
    isLoading: false,
  }),
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
  EditPanelSection: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
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

import { ContactEditPanel } from '@/components/ContactEdit/ContactEditPanel'
import type { IContact } from '@/interfaces/ocotillo'

const SAMPLE_CONTACT: IContact = {
  id: 7,
  name: 'Rachel Benjamin',
  organization: 'NMBGMR',
  role: 'Owner',
  contact_type: 'Primary',
  created_at: new Date('2026-01-01'),
  release_status: 'public',
}

const renderPanel = (contact: IContact = SAMPLE_CONTACT) =>
  render(
    <ContactEditPanel
      contactId={contact.id}
      contact={contact}
      isLoading={false}
      onClose={onCloseMock}
    />
  )

describe('ContactEditPanel', () => {
  beforeEach(() => {
    captureEventMock.mockClear()
    updateMutateAsyncMock.mockClear()
    invalidateMock.mockClear()
    notifyMock.mockClear()
    onCloseMock.mockClear()
    updateMutateAsyncMock.mockResolvedValue({})
    invalidateMock.mockResolvedValue(undefined)
  })

  describe('PostHog events', () => {
    it('fires edit_panel_opened with resource and contact_id on mount', () => {
      renderPanel()
      expect(captureEventMock).toHaveBeenCalledWith('edit_panel_opened', {
        resource: 'contact',
        contact_id: SAMPLE_CONTACT.id,
      })
    })

    it('fires edit_saved with changed fields after a successful save', async () => {
      const user = userEvent.setup()
      renderPanel()

      const nameInput = screen.getByDisplayValue('Rachel Benjamin')
      await user.clear(nameInput)
      await user.type(nameInput, 'Rachel B.')
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(captureEventMock).toHaveBeenCalledWith(
          'edit_saved',
          expect.objectContaining({
            resource: 'contact',
            contact_id: SAMPLE_CONTACT.id,
            fields_changed: ['name'],
          })
        )
      })
    })

    it('fires edit_abandoned with had_changes:true when the user discards unsaved changes', async () => {
      const user = userEvent.setup()
      renderPanel()

      const nameInput = screen.getByDisplayValue('Rachel Benjamin')
      await user.clear(nameInput)
      await user.type(nameInput, 'Changed')
      await user.click(screen.getByTestId('panel-close'))
      await user.click(screen.getByRole('button', { name: 'Discard' }))

      expect(captureEventMock).toHaveBeenCalledWith(
        'edit_abandoned',
        expect.objectContaining({
          resource: 'contact',
          contact_id: SAMPLE_CONTACT.id,
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
    it('shows the contact display name in the title', () => {
      renderPanel()
      expect(screen.getByTestId('panel-title')).toHaveTextContent(
        'Edit: Rachel Benjamin'
      )
    })

    it('falls back to Edit when no contact is provided', () => {
      render(
        <ContactEditPanel
          contactId={99}
          contact={undefined}
          isLoading={false}
          onClose={onCloseMock}
        />
      )
      expect(screen.getByTestId('panel-title')).toHaveTextContent('Edit')
    })
  })

  describe('field pre-population', () => {
    it('fills the name and organization inputs from the contact prop', () => {
      renderPanel()
      expect(screen.getByDisplayValue('Rachel Benjamin')).toBeTruthy()
      expect(screen.getByDisplayValue('NMBGMR')).toBeTruthy()
    })
  })

  describe('save button state', () => {
    it('disables Save when no fields have changed', () => {
      renderPanel()
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    })

    it('enables Save after editing the name field', async () => {
      const user = userEvent.setup()
      renderPanel()
      const nameInput = screen.getByDisplayValue('Rachel Benjamin')
      await user.clear(nameInput)
      await user.type(nameInput, 'New Name')
      expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
    })

    it('enables Save after editing the organization field', async () => {
      const user = userEvent.setup()
      renderPanel()
      const orgInput = screen.getByDisplayValue('NMBGMR')
      await user.clear(orgInput)
      await user.type(orgInput, 'Bureau of Geology')
      expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
    })

    it('re-disables Save if the user reverts their changes', async () => {
      const user = userEvent.setup()
      renderPanel()
      const nameInput = screen.getByDisplayValue('Rachel Benjamin')
      await user.clear(nameInput)
      await user.type(nameInput, 'Temp Name')
      await user.clear(nameInput)
      await user.type(nameInput, 'Rachel Benjamin')
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    })
  })

  describe('saving', () => {
    it('sends only the changed field to useUpdate', async () => {
      const user = userEvent.setup()
      renderPanel()

      const orgInput = screen.getByDisplayValue('NMBGMR')
      await user.clear(orgInput)
      await user.type(orgInput, 'Bureau of Geology')
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(updateMutateAsyncMock).toHaveBeenCalledWith(
          expect.objectContaining({
            resource: 'contact',
            dataProviderName: 'ocotillo',
            id: SAMPLE_CONTACT.id,
            values: { organization: 'Bureau of Geology' },
          })
        )
      })
    })

    it('invalidates the contact detail and list after a successful save', async () => {
      const user = userEvent.setup()
      renderPanel()

      const nameInput = screen.getByDisplayValue('Rachel Benjamin')
      await user.clear(nameInput)
      await user.type(nameInput, 'New Name')
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(invalidateMock).toHaveBeenCalledWith(
          expect.objectContaining({
            resource: 'contact',
            id: SAMPLE_CONTACT.id,
            invalidates: ['detail', 'list'],
          })
        )
      })
    })

    it('calls onClose after a successful save', async () => {
      const user = userEvent.setup()
      renderPanel()

      const nameInput = screen.getByDisplayValue('Rachel Benjamin')
      await user.clear(nameInput)
      await user.type(nameInput, 'New Name')
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

      const nameInput = screen.getByDisplayValue('Rachel Benjamin')
      await user.clear(nameInput)
      await user.type(nameInput, 'Changed')
      await user.click(screen.getByTestId('panel-close'))

      expect(screen.getByRole('alertdialog')).toBeTruthy()
      expect(onCloseMock).not.toHaveBeenCalled()
    })

    it('calls onClose when the user confirms discard', async () => {
      const user = userEvent.setup()
      renderPanel()

      const nameInput = screen.getByDisplayValue('Rachel Benjamin')
      await user.clear(nameInput)
      await user.type(nameInput, 'Changed')
      await user.click(screen.getByTestId('panel-close'))
      await user.click(screen.getByRole('button', { name: 'Discard' }))

      expect(onCloseMock).toHaveBeenCalled()
    })

    it('does not close when the user cancels the discard dialog', async () => {
      const user = userEvent.setup()
      renderPanel()

      const nameInput = screen.getByDisplayValue('Rachel Benjamin')
      await user.clear(nameInput)
      await user.type(nameInput, 'Changed')
      await user.click(screen.getByTestId('panel-close'))
      await user.click(screen.getByRole('button', { name: 'Keep editing' }))

      expect(onCloseMock).not.toHaveBeenCalled()
    })
  })
})
