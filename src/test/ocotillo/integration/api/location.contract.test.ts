import { describe, it, expect } from 'vitest'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import {
  zLocationResponse,
  zCreateLocation,
  zUpdateLocation,
} from '@/generated/zod.gen'
import {
  LocationResponse,
  CreateLocation,
  UpdateLocation,
} from '@/generated/types.gen'

describe('Ocotillo Integration Tests: Location', () => {

  it('should fetch locations using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'ocotillo.location',
      pagination: { current: 1, pageSize: 10 }
    })
    
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)
    
    if (result.data.length > 0) {
      const location = result.data[0] as LocationResponse
      
      // Validate against schema 
      try {
        const validatedLocation = zLocationResponse.parse(location)
        expect(validatedLocation).toBeDefined()
      } catch (error) {
        console.error('Schema validation failed:', error.message)
        console.error('Location data:', JSON.stringify(location, null, 2))
        throw new Error(`API response doesn't match ILocation interface: ${error.message}`)
      }
    }
  })

  it('should fetch single location by ID using data provider', async () => {
    const result = await ocotilloDataProvider.getOne({
      resource: 'ocotillo.location',
      id: 1,
      meta: {}
    })
    
    expect(result).toHaveProperty('data')
    
    const location = result.data as LocationResponse
    
    // Validate against schema
    try {
      const validatedLocation = zLocationResponse.parse(location)
      expect(validatedLocation).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      throw new Error(`API response doesn't match ILocation interface: ${error.message}`)
    }
  })

  it('should create location using data provider', async () => {
    const testData: CreateLocation = zCreateLocation.parse({
      point: 'POINT(-106.904192 34.068279)', 
      elevation: 5000, 
      notes: 'Test notes',
      release_status: 'Public',
      coordinate_method: 'GPS, uncorrected',
      elevation_method: 'Interpolated from Digital Elevation Model (DEM)',
      coordinate_accuracy: 10,
      elevation_accuracy: 1.74
    })

    try {
      const result = await ocotilloDataProvider.create({
        resource: 'ocotillo.location',
        variables: testData
      })
      
      expect(result).toHaveProperty('data')
      
      const createdLocation = result.data as LocationResponse
      
      // Validate the schema
      try {
        const validatedLocation = zLocationResponse.parse(createdLocation)
        expect(validatedLocation).toBeDefined()
      } catch (error) {
        console.error('Created location schema validation failed:', error.message)
        console.error('Created location data:', JSON.stringify(createdLocation, null, 2))
        throw new Error(`Created location doesn't match ILocation interface: ${error.message}`)
      }
      
    } catch (error) {
      console.error('Create failed with error:', error)
      throw error
    }
  })

  it('should update location using data provider', async () => {
    const testData: UpdateLocation = zUpdateLocation.parse({
      id: 1,
      point: 'POINT(-106.904192 34.068279)',
      elevation: 6000,
      notes: 'Updated notes',
      release_status: 'Private',
      coordinate_method: 'GPS, uncorrected',
      elevation_method: 'Interpolated from Digital Elevation Model (DEM)',
      coordinate_accuracy: 12,
      elevation_accuracy: 1.84
    })

    try {
      const result = await ocotilloDataProvider.update({
        resource: 'ocotillo.location',
        id: 1,
        variables: testData
      })

      expect(result).toHaveProperty('data')

      const updatedLocation = result.data as LocationResponse

      // Validate the schema
      try {
        const validatedLocation = zLocationResponse.parse(updatedLocation)
        expect(validatedLocation).toBeDefined()
      } catch (error) {
        console.error('Updated location schema validation failed:', error.message)
        console.error('Updated location data:', JSON.stringify(updatedLocation, null, 2))
        throw new Error(`Updated location doesn't match ILocation interface: ${error.message}`)
      }
    } catch (error) {
      console.error('Update failed with error:', error)
      throw error
    }
  })
})
