// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { ContactEdit } from '@/pages/ocotillo/contact/edit'
import userEvent from '@testing-library/user-event'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import { zUpdateContact } from '@/generated/zod.gen'
import type { UpdateContact } from '@/generated/types.gen'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { render } from '@/test/test-utils'

// Mock the useLexicon hook for necessary fields
vi.mock('@/hooks/useLexicon', () => ({
  useLexicon: () => ({
    options: [
      { value: 'Public', label: 'Public' },
      { value: 'Private', label: 'Private' },
      { value: 'Primary', label: 'Primary' },
      { value: 'Owner', label: 'Owner' }
    ],
    isLoading: false
  })
}))

// Mock the useAutocomplete hook for the thing field
vi.mock('@refinedev/mui', async () => {
  const actual = await vi.importActual('@refinedev/mui')
  return {
    ...actual,
    useAutocomplete: () => ({
      autocompleteProps: {
        options: [
          { id: 1, name: 'Test Thing 1' },
          { id: 2, name: 'Test Thing 2' }
        ],
        loading: false
      }
    })
  }
})

describe('Contact Edit - Required Fields Integration Test', () => {

  const renderEditContact = () => {
    return render(
      <MemoryRouter initialEntries={['/ocotillo/contact/edit/1']}>
        <Routes>
          <Route path="/ocotillo/contact/edit/:id" element={<ContactEdit />} />
        </Routes>
      </MemoryRouter>
    )
  }

  it('should render all required UI elements', async () => {
    renderEditContact()

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /thing/i })).toBeInTheDocument()
    })

    // Check for Refine buttons
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByText(/edit contact/i)).toBeInTheDocument()
    
    // Check for form fields
    expect(screen.getByLabelText(/contact name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/organization/i)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /release status/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /contact role/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/contact type/i)).toBeInTheDocument()
  })

  it('should allow user to modify form fields', async () => {
    const user = userEvent.setup()
    renderEditContact()

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /thing/i })).toBeInTheDocument()
    })

    // Modify contact fields
    const nameInput = screen.getByLabelText(/contact name/i)
    const orgInput = screen.getByLabelText(/organization/i)
    
    // Clear and type new values
    await user.click(nameInput)
    await user.keyboard('{Control>}a{/Control}')
    await user.keyboard('{Backspace}')
    await user.type(nameInput, 'Updated User')
    await user.click(orgInput)
    await user.keyboard('{Control>}a{/Control}')
    await user.keyboard('{Backspace}')
    await user.type(orgInput, 'Updated Org')
    
    expect(nameInput).toHaveValue('Updated User')
    expect(orgInput).toHaveValue('Updated Org')
  })

  it('should allow user to select from autocomplete', async () => {
    const user = userEvent.setup()
    renderEditContact()

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /thing/i })).toBeInTheDocument()
    })

    // Select a different thing from the autocomplete
    const thingInput = screen.getByRole('combobox', { name: /thing/i })
    await user.click(thingInput)
    await waitFor(() => {
      expect(screen.getByText('Test Thing 2')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Test Thing 2'))
    
    expect(thingInput).toHaveValue('Test Thing 2')
  })

  it('should submit form data when save button is clicked', async () => {
    const user = userEvent.setup()
    
    // Spy on the data provider method
    const updateSpy = vi.spyOn(ocotilloDataProvider, 'update')
    
    renderEditContact()

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /thing/i })).toBeInTheDocument()
    })

    // Test form data with proper UpdateContact type
    const testFormData: UpdateContact = {
      name: 'Updated User',
      organization: 'Updated Organization',
      contact_type: 'Primary',
      thing_id: 2,
      release_status: 'Public',
      role: 'Owner'
    }

    // Validate test form data with Zod schema
    const validationResult = zUpdateContact.safeParse(testFormData)
    expect(validationResult.success).toBe(true)
    
    if (validationResult.success) {
      // Fill out the form with user interactions
      const nameInput = screen.getByLabelText(/contact name/i)
      const orgInput = screen.getByLabelText(/organization/i)
      const thingInput = screen.getByRole('combobox', { name: /thing/i })
      const releaseStatusSelect = screen.getByRole('combobox', { name: /release status/i })
      const contactRoleSelect = screen.getByRole('combobox', { name: /contact role/i })
      const contactTypeSelect = screen.getByRole('combobox', { name: /contact type/i })

      // Clear and fill text inputs
      await user.clear(nameInput)
      await user.keyboard('{Control>}a{/Control}')
      await user.keyboard('{Backspace}')
      await user.type(nameInput, testFormData.name)
      await user.clear(orgInput)
      await user.keyboard('{Control>}a{/Control}')
      await user.keyboard('{Backspace}')
      await user.type(orgInput, testFormData.organization)

      // Select thing from autocomplete
      await user.click(thingInput)
      await user.type(thingInput, 'Test')
      await waitFor(() => {
        expect(screen.getByText('Test Thing 2')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Test Thing 2'))

      // Select from dropdowns
      await user.click(releaseStatusSelect)
      await waitFor(() => {
        expect(screen.getByText(testFormData.release_status)).toBeInTheDocument()
      })
      await user.click(screen.getByText(testFormData.release_status))

      await user.click(contactRoleSelect)
      await waitFor(() => {
        expect(screen.getByText(testFormData.role)).toBeInTheDocument()
      })
      await user.click(screen.getByText(testFormData.role))

      await user.click(contactTypeSelect)
      await waitFor(() => {
        expect(screen.getByText(testFormData.contact_type)).toBeInTheDocument()
      })
      await user.click(screen.getByText(testFormData.contact_type))

      // Click save button to trigger form submission
      const saveButton = screen.getByRole('button', { name: /save/i })
      expect(saveButton).toBeInTheDocument()
      expect(saveButton).not.toBeDisabled()
      
      await user.click(saveButton)

      await waitFor(() => {
        // Look for alert or success on page for success!!!
        const notification = screen.queryByRole('alert') || screen.queryByText(/success|updated|saved|submitted successfully/i)
        expect(notification).toBeInTheDocument()
        expect(notification).toHaveTextContent(/success|updated|saved|submitted successfully/i)
      }, { timeout: 10000 })

      // Verify the data provider call (another check besides success in document)
      expect(updateSpy).toHaveBeenCalledWith({
        resource: 'ocotillo.contact',
        id: '1',
        meta: expect.objectContaining({
          dataProviderName: 'ocotillo',
          label: 'Contacts'
        }),
        metaData: expect.objectContaining({
          dataProviderName: 'ocotillo',
          label: 'Contacts'
        }),
        variables: expect.objectContaining({
          name: testFormData.name,
          organization: testFormData.organization,
          contact_type: testFormData.contact_type,
          thing_id: testFormData.thing_id,
          release_status: testFormData.release_status,
          role: testFormData.role
        })
      })
    }
  })
})
