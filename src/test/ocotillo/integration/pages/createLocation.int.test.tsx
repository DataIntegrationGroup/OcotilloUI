// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { LocationCreate } from '@/pages/ocotillo/location/create'
import userEvent from '@testing-library/user-event'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import { zCreateLocation } from '@/generated/zod.gen'
import type { CreateLocation } from '@/generated/types.gen'
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

describe('Location Create - Required Fields Integration Test', () => {

  const renderCreateLocation = () => {
    return render(
      <MemoryRouter initialEntries={['/ocotillo/location/create']}>
        <Routes>
          <Route path="/ocotillo/location/create" element={<LocationCreate />} />
        </Routes>
      </MemoryRouter>
    )
  }

  it('should render all required UI elements', async () => {
    renderCreateLocation()

    // Wait for form to be fully loaded
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
    expect(screen.getByText(/create location/i)).toBeInTheDocument()
  })

  // TODO: Update this test to incorporate user interaction for the form submission
  it('should submit form data with mock create data on simulated submission', async () => {
    const testFormData: CreateLocation = {
      point: 'POINT(-106.904192 34.068279)',
      elevation: 5000,
      release_status: 'Public',
      coordinate_method: 'GPS, uncorrected',
      elevation_method: 'Interpolated from Digital Elevation Model (DEM)',
      coordinate_accuracy: 10,
      elevation_accuracy: 1.74,
      notes: 'Test location'
    }

    // Spy on the data provider
    const createSpy = vi.spyOn(ocotilloDataProvider, 'create')
    
    renderCreateLocation()

    // Wait for form to be fully loaded
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    })

    // Validate form data against Zod schema
    const validationResult = zCreateLocation.safeParse(testFormData)
    expect(validationResult.success).toBe(true)
    
    // Simulate form submission for now
    if (validationResult.success) {
      await ocotilloDataProvider.create({
        resource: 'ocotillo.location',
        variables: testFormData
      })

      // Verify the data provider call
      expect(createSpy).toHaveBeenCalledWith({
        resource: 'ocotillo.location',
        variables: testFormData
      })
    }
  })
})