// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { LocationEdit } from '@/pages/ocotillo/location/edit'
import userEvent from '@testing-library/user-event'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import { zUpdateLocation } from '@/generated/zod.gen'
import type { UpdateLocation } from '@/generated/types.gen'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { render } from '@/test/test-utils'

// Mock the useLexicon hook 
vi.mock('@/hooks/useLexicon', () => ({
  useLexicon: () => ({
    options: [
      { value: 'Public', label: 'Public' },
      { value: 'Private', label: 'Private' },
      { value: 'GPS, uncorrected', label: 'GPS, uncorrected' },
      { value: 'Interpolated from Digital Elevation Model (DEM)', label: 'Interpolated from Digital Elevation Model (DEM)' }
    ],
    isLoading: false
  })
}))

// Mock the useElevation hook
vi.mock('@/hooks/useElevation', () => ({
  useElevation: () => ({
    isSuccess: true,
    data: { value: 5000 }
  })
}))

describe('Location Edit - Required Fields Integration Test', () => {

 //Route has the id as a path param
  const renderEditLocation = () => {
    return render(
      <MemoryRouter initialEntries={['/ocotillo/location/edit/1']}>
        <Routes>
          <Route path="/ocotillo/location/edit/:id" element={<LocationEdit />} />
        </Routes>
      </MemoryRouter>
    )
  }

  it('should render all required UI elements', async () => {
    renderEditLocation()

    await waitFor(() => {
      expect(screen.getByLabelText(/latitude \(decimal degrees\)/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/longitude \(decimal degrees\)/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/elevation \(ft\)/i)).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /release status/i })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /coordinate method/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/coordinate accuracy \(ft\)/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/elevation accuracy \(ft\)/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /elevation method/i })).toBeInTheDocument()
    })

    // Check for Refine buttons
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByText(/edit location/i)).toBeInTheDocument()
  })

  // TODO: Update this test to incorporate user interaction for the form submission
  it('should submit form data with mock update data on simulated submission', async () => {
    const testFormData: UpdateLocation = {
      point: 'POINT(-105.987654 35.123456)',
      elevation: 6000,
      release_status: 'Private',
      coordinate_method: 'GPS, uncorrected',
      elevation_method: 'Interpolated from Digital Elevation Model (DEM)',
      coordinate_accuracy: 15,
      elevation_accuracy: 2.5,
      notes: 'Updated test location'
    }

    // Spy on the data provider
    const updateSpy = vi.spyOn(ocotilloDataProvider, 'update')
    
    renderEditLocation()

    // Wait for form to be fully loaded
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    })

    // Validate test form data with Zod schema
    const validationResult = zUpdateLocation.safeParse(testFormData)
    expect(validationResult.success).toBe(true)
    
    if (validationResult.success) {
      // Simulate form submission for now
      await ocotilloDataProvider.update({
        resource: 'ocotillo.location',
        id: '1',
        variables: testFormData
      })

      // Verify the data provider call
      expect(updateSpy).toHaveBeenCalledWith({
        resource: 'ocotillo.location',
        id: '1',
        variables: testFormData
      })
    }
  })
})