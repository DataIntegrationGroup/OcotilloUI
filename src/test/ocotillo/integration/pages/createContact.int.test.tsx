// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { ContactCreate } from '@/pages/ocotillo/contact/create'
import userEvent from '@testing-library/user-event'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import { zCreateContact } from '@/generated/zod.gen'
import type { CreateContact } from '@/generated/types.gen'
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

describe('Contact Create - Required Fields Integration Test', () => {

  const renderCreateContact = () => {
    return render(
      <MemoryRouter initialEntries={['/ocotillo/contact/create']}>
        <Routes>
          <Route path="/ocotillo/contact/create" element={<ContactCreate />} />
        </Routes>
      </MemoryRouter>
    )
  }

  it('should render all required UI elements', async () => {
    renderCreateContact()

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /thing/i })).toBeInTheDocument()
    })

    // Check for Refine buttons
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByText(/create contact/i)).toBeInTheDocument()
    
    // Check for form fields
    expect(screen.getByLabelText(/contact name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/organization/i)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /release status/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /contact role/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/contact type/i)).toBeInTheDocument()
  })

  it('should allow user to fill form fields', async () => {
    const user = userEvent.setup()
    renderCreateContact()

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /thing/i })).toBeInTheDocument()
    })

    // Fill in required contact fields
    const nameInput = screen.getByLabelText(/contact name/i)
    const orgInput = screen.getByLabelText(/organization/i)
    
    await user.type(nameInput, 'Test User')
    await user.type(orgInput, 'Test Org')
    
    expect(nameInput).toHaveValue('Test User')
    expect(orgInput).toHaveValue('Test Org')
  })

  it('should allow user to select from autocomplete', async () => {
    const user = userEvent.setup()
    renderCreateContact()

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /thing/i })).toBeInTheDocument()
    })

    // Select a thing from the autocomplete
    const thingInput = screen.getByRole('combobox', { name: /thing/i })
    await user.click(thingInput)
    await waitFor(() => {
      expect(screen.getByText('Test Thing 1')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Test Thing 1'))
    
    expect(thingInput).toHaveValue('Test Thing 1')
  })


  it('should submit form data when save button is clicked', async () => {
    const user = userEvent.setup()
    
    // Spy on the data provider method
    const createSpy = vi.spyOn(ocotilloDataProvider, 'create')
    
    renderCreateContact()

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /thing/i })).toBeInTheDocument()
    })

    // Test form data with proper CreateContact type
    const testFormData: CreateContact = {
      name: 'Test User',
      organization: 'Test Organization',
      contact_type: 'Primary',
      thing_id: 1,
      release_status: 'Public',
      role: 'Owner',
      emails: [],
      phones: [],
      addresses: []
    }

    // Validate test form data with Zod schema
    const validationResult = zCreateContact.safeParse(testFormData)
    expect(validationResult.success).toBe(true)
    
    if (validationResult.success) {
      // Fill out the form with user interactions
      const nameInput = screen.getByLabelText(/contact name/i)
      const orgInput = screen.getByLabelText(/organization/i)
      const thingInput = screen.getByRole('combobox', { name: /thing/i })
      const releaseStatusSelect = screen.getByRole('combobox', { name: /release status/i })
      const contactRoleSelect = screen.getByRole('combobox', { name: /contact role/i })
      const contactTypeSelect = screen.getByRole('combobox', { name: /contact type/i })

      // Fill text inputs
      await user.type(nameInput, testFormData.name!)
      await user.type(orgInput, testFormData.organization!)

      // Select thing from autocomplete
      await user.click(thingInput)
      await user.type(thingInput, 'Test')
      await waitFor(() => {
        expect(screen.getByText('Test Thing 1')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Test Thing 1'))

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
        const notification = screen.queryByRole('alert') || screen.queryByText(/success|created|saved|submitted successfully/i)
        expect(notification).toBeInTheDocument()
        expect(notification).toHaveTextContent(/success|created|saved|submitted successfully/i)
      }, { timeout: 10000 })

      // Verify the data provider call (another check besides success in document)
      expect(createSpy).toHaveBeenCalledWith({
        resource: 'ocotillo.contact',
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
          role: testFormData.role,
          emails: testFormData.emails,
          phones: testFormData.phones,
          addresses: testFormData.addresses
        })
      })
    }
  })
})
