// @vitest-environment jsdom
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const captureEventMock = vi.fn()
const updateMutateAsyncMock = vi.fn()
const customMutateMock = vi.fn()
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
  useCustomMutation: () => ({
    mutateAsync: customMutateMock,
    mutation: { isPending: false },
  }),
  useInvalidate: () => invalidateMock,
  useNotification: () => ({ open: notifyMock }),
}))

vi.mock('@/hooks', () => ({
  useLexicon: ({ category }: { category: string }) => {
    const options: Record<string, { value: string; label: string }[]> = {
      role: [
        { value: 'Owner', label: 'Owner' },
        { value: 'Manager', label: 'Manager' },
      ],
      contact_type: [
        { value: 'Primary', label: 'Primary' },
        { value: 'Secondary', label: 'Secondary' },
      ],
      email_type: [
        { value: 'Primary', label: 'Primary' },
        { value: 'Work', label: 'Work' },
      ],
      phone_type: [
        { value: 'Primary', label: 'Primary' },
        { value: 'Mobile', label: 'Mobile' },
      ],
      address_type: [
        { value: 'Mailing', label: 'Mailing' },
        { value: 'Physical', label: 'Physical' },
      ],
    }
    return { options: options[category] ?? [], isLoading: false }
  },
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

// ─── Test fixtures ────────────────────────────────────────────────────────────

const SAMPLE_CONTACT: IContact = {
  id: 7,
  name: 'Rachel Benjamin',
  organization: 'NMBGMR',
  role: 'Owner',
  contact_type: 'Primary',
  created_at: new Date('2026-01-01'),
  release_status: 'public',
}

const CONTACT_WITH_EMAIL: IContact = {
  ...SAMPLE_CONTACT,
  emails: [
    {
      id: 101,
      email: 'rachel@nmbgmr.gov',
      email_type: 'Primary',
      contact_id: 7,
      created_at: new Date('2026-01-01'),
      release_status: 'public',
    },
  ],
}

const CONTACT_WITH_PHONE: IContact = {
  ...SAMPLE_CONTACT,
  phones: [
    {
      id: 201,
      phone_number: '5055550001',
      phone_type: 'Primary',
      contact_id: 7,
      created_at: new Date('2026-01-01'),
      release_status: 'public',
    },
  ],
}

const CONTACT_WITH_ADDRESS: IContact = {
  ...SAMPLE_CONTACT,
  addresses: [
    {
      id: 301,
      address_line_1: '801 Leroy Place',
      city: 'Socorro',
      state: 'NM',
      postal_code: '87801',
      country: 'United States',
      address_type: 'Mailing',
      contact_id: 7,
      created_at: new Date('2026-01-01'),
      release_status: 'public',
    },
  ],
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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ContactEditPanel', () => {
  beforeEach(() => {
    captureEventMock.mockClear()
    updateMutateAsyncMock.mockClear()
    customMutateMock.mockClear()
    invalidateMock.mockClear()
    notifyMock.mockClear()
    onCloseMock.mockClear()
    updateMutateAsyncMock.mockResolvedValue({})
    customMutateMock.mockResolvedValue({})
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

    it('fires edit_saved with contact_details section after saving basic fields', async () => {
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
            fields_changed: ['contact_details'],
          })
        )
      })
    })

    it('fires edit_saved with emails section after deleting an email', async () => {
      const user = userEvent.setup()
      renderPanel(CONTACT_WITH_EMAIL)

      await user.click(
        screen.getByRole('button', { name: /Remove email rachel@nmbgmr.gov/i })
      )
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(captureEventMock).toHaveBeenCalledWith(
          'edit_saved',
          expect.objectContaining({
            fields_changed: expect.arrayContaining(['emails']),
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

  describe('saving contact details', () => {
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

  describe('email section', () => {
    it('renders existing email addresses from the contact', () => {
      renderPanel(CONTACT_WITH_EMAIL)
      expect(screen.getByDisplayValue('rachel@nmbgmr.gov')).toBeTruthy()
    })

    it('keeps Save disabled when an empty email row is added', async () => {
      const user = userEvent.setup()
      renderPanel()
      await user.click(screen.getByRole('button', { name: /Add email/i }))
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    })

    it('enables Save after typing into a new email row', async () => {
      const user = userEvent.setup()
      renderPanel()
      await user.click(screen.getByRole('button', { name: /Add email/i }))
      await user.type(
        screen.getByPlaceholderText('name@example.com'),
        'new@example.com'
      )
      expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
    })

    it('enables Save when an existing email is deleted', async () => {
      const user = userEvent.setup()
      renderPanel(CONTACT_WITH_EMAIL)
      await user.click(
        screen.getByRole('button', { name: /Remove email rachel@nmbgmr.gov/i })
      )
      expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
    })

    it('removes the email row from view after deletion', async () => {
      const user = userEvent.setup()
      renderPanel(CONTACT_WITH_EMAIL)
      await user.click(
        screen.getByRole('button', { name: /Remove email rachel@nmbgmr.gov/i })
      )
      expect(screen.queryByDisplayValue('rachel@nmbgmr.gov')).toBeNull()
    })

    it('sends DELETE mutation for a removed email on save', async () => {
      const user = userEvent.setup()
      renderPanel(CONTACT_WITH_EMAIL)

      await user.click(
        screen.getByRole('button', { name: /Remove email rachel@nmbgmr.gov/i })
      )
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(customMutateMock).toHaveBeenCalledWith(
          expect.objectContaining({
            url: 'contact/email/101',
            method: 'delete',
          })
        )
      })
    })

    it('sends POST mutation for a new email on save', async () => {
      const user = userEvent.setup()
      renderPanel()

      await user.click(screen.getByRole('button', { name: /Add email/i }))
      await user.type(
        screen.getByPlaceholderText('name@example.com'),
        'new@example.com'
      )
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(customMutateMock).toHaveBeenCalledWith(
          expect.objectContaining({
            url: 'contact/email',
            method: 'post',
            values: expect.objectContaining({
              contact_id: SAMPLE_CONTACT.id,
              email: 'new@example.com',
            }),
          })
        )
      })
    })

    it('sends PATCH mutation for a modified email on save', async () => {
      const user = userEvent.setup()
      renderPanel(CONTACT_WITH_EMAIL)

      const emailInput = screen.getByDisplayValue('rachel@nmbgmr.gov')
      await user.clear(emailInput)
      await user.type(emailInput, 'rachel.updated@nmbgmr.gov')
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(customMutateMock).toHaveBeenCalledWith(
          expect.objectContaining({
            url: 'contact/email/101',
            method: 'patch',
            values: expect.objectContaining({
              email: 'rachel.updated@nmbgmr.gov',
            }),
          })
        )
      })
    })
  })

  describe('phone section', () => {
    it('renders existing phone numbers from the contact', () => {
      renderPanel(CONTACT_WITH_PHONE)
      expect(screen.getByDisplayValue('5055550001')).toBeTruthy()
    })

    it('keeps Save disabled when an empty phone row is added', async () => {
      const user = userEvent.setup()
      renderPanel()
      await user.click(screen.getByRole('button', { name: /Add phone/i }))
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    })

    it('enables Save after typing into a new phone row', async () => {
      const user = userEvent.setup()
      renderPanel()
      await user.click(screen.getByRole('button', { name: /Add phone/i }))
      await user.type(
        screen.getByPlaceholderText('+1 (505) 555-0100'),
        '5055559999'
      )
      expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
    })

    it('enables Save when an existing phone is deleted', async () => {
      const user = userEvent.setup()
      renderPanel(CONTACT_WITH_PHONE)
      await user.click(
        screen.getByRole('button', { name: /Remove phone 5055550001/i })
      )
      expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
    })

    it('sends DELETE mutation for a removed phone on save', async () => {
      const user = userEvent.setup()
      renderPanel(CONTACT_WITH_PHONE)

      await user.click(
        screen.getByRole('button', { name: /Remove phone 5055550001/i })
      )
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(customMutateMock).toHaveBeenCalledWith(
          expect.objectContaining({
            url: 'contact/phone/201',
            method: 'delete',
          })
        )
      })
    })

    it('sends POST mutation for a new phone on save', async () => {
      const user = userEvent.setup()
      renderPanel()

      await user.click(screen.getByRole('button', { name: /Add phone/i }))
      await user.type(
        screen.getByPlaceholderText('+1 (505) 555-0100'),
        '5055559999'
      )
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(customMutateMock).toHaveBeenCalledWith(
          expect.objectContaining({
            url: 'contact/phone',
            method: 'post',
            values: expect.objectContaining({
              contact_id: SAMPLE_CONTACT.id,
              phone_number: '5055559999',
            }),
          })
        )
      })
    })
  })

  describe('address section', () => {
    it('renders existing address fields from the contact', () => {
      renderPanel(CONTACT_WITH_ADDRESS)
      expect(screen.getByDisplayValue('801 Leroy Place')).toBeTruthy()
      expect(screen.getByDisplayValue('Socorro')).toBeTruthy()
    })

    it('keeps Save disabled when an empty address block is added', async () => {
      const user = userEvent.setup()
      renderPanel()
      await user.click(screen.getByRole('button', { name: /Add address/i }))
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    })

    it('enables Save after typing an address line into a new block', async () => {
      const user = userEvent.setup()
      renderPanel()
      await user.click(screen.getByRole('button', { name: /Add address/i }))
      await user.type(
        screen.getByRole('textbox', { name: /Address line 1/i }),
        '123 Main St'
      )
      expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
    })

    it('enables Save when an existing address is deleted', async () => {
      const user = userEvent.setup()
      renderPanel(CONTACT_WITH_ADDRESS)
      await user.click(
        screen.getByRole('button', { name: /Remove address 801 Leroy Place/i })
      )
      expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
    })

    it('sends DELETE mutation for a removed address on save', async () => {
      const user = userEvent.setup()
      renderPanel(CONTACT_WITH_ADDRESS)

      await user.click(
        screen.getByRole('button', { name: /Remove address 801 Leroy Place/i })
      )
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(customMutateMock).toHaveBeenCalledWith(
          expect.objectContaining({
            url: 'contact/address/301',
            method: 'delete',
          })
        )
      })
    })

    it('sends POST mutation for a new address on save', async () => {
      const user = userEvent.setup()
      renderPanel()

      await user.click(screen.getByRole('button', { name: /Add address/i }))
      await user.type(
        screen.getByRole('textbox', { name: /Address line 1/i }),
        '123 Main St'
      )
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(customMutateMock).toHaveBeenCalledWith(
          expect.objectContaining({
            url: 'contact/address',
            method: 'post',
            values: expect.objectContaining({
              contact_id: SAMPLE_CONTACT.id,
              address_line_1: '123 Main St',
            }),
          })
        )
      })
    })

    it('sends PATCH mutation for a modified address on save', async () => {
      const user = userEvent.setup()
      renderPanel(CONTACT_WITH_ADDRESS)

      const cityInput = screen.getByDisplayValue('Socorro')
      await user.clear(cityInput)
      await user.type(cityInput, 'Albuquerque')
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(customMutateMock).toHaveBeenCalledWith(
          expect.objectContaining({
            url: 'contact/address/301',
            method: 'patch',
            values: expect.objectContaining({
              city: 'Albuquerque',
            }),
          })
        )
      })
    })
  })
})
