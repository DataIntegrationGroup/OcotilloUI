import { describe, it, expect, beforeEach } from 'vitest'
import { ILocation } from '@/interfaces/ocotillo/ILocation'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import { LocationSchema } from '@/pages/ocotillo/location/schema'

// small delay to not overwhelm mock server
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('Ocotillo Integration Tests: Location', () => {
  beforeEach(async () => {
    await delay(100)
  })

  it('should fetch locations using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'ocotillo.location',
      pagination: { current: 1, pageSize: 10 }
    })
    
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)
    
    if (result.data.length > 0) {
      const location = result.data[0] as ILocation
      
      // Validate against schema 
      try {
        const validatedLocation = await LocationSchema.validate(location, { strict: true })
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
    
    const location = result.data as ILocation
    
    // Validate against schema
    try {
      const validatedLocation = await LocationSchema.validate(location, { strict: true })
      expect(validatedLocation).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      throw new Error(`API response doesn't match ILocation interface: ${error.message}`)
    }
  })

  it('should create location using data provider', async () => {
    const testData = {
      name: 'Test Location',
      notes: 'Test notes',
      point: 'POINT(-106.6504 35.0844)',
      release_status: 'public'
    }

    try {
      const result = await ocotilloDataProvider.create({
        resource: 'ocotillo.location',
        variables: testData
      })
      
      expect(result).toHaveProperty('data')
      
      const createdLocation = result.data as ILocation
      
      // Validate the schema
      try {
        const validatedLocation = await LocationSchema.validate(createdLocation)
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
    const testData = {
      id: 1,
      name: 'Updated Location',
      notes: 'Updated notes',
      point: 'POINT(-106.6504 35.0844 5000)',
      release_status: 'public'
    }

    try {
      const result = await ocotilloDataProvider.update({
        resource: 'ocotillo.location',
        id: 1,
        variables: testData
      })

      expect(result).toHaveProperty('data')

      const updatedLocation = result.data as ILocation

      // Validate the schema
      try {
        const validatedLocation = await LocationSchema.validate(updatedLocation, { strict: true })
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
