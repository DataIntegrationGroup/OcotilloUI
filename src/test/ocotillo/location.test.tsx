import { describe, it, expect, beforeEach } from 'vitest'
import { ILocation } from '@/interfaces/ocotillo/ILocation'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider' // Use the real data provider!

// Add a small delay between tests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('Ocotillo Location API Integration Tests', () => {
  beforeEach(async () => {
    // Add a small delay between tests to avoid overwhelming the mock server
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
      expect(location).toHaveProperty('id')
      expect(location).toHaveProperty('name')
      expect(location).toHaveProperty('point')
      expect(location).toHaveProperty('release_status')
      expect(location).toHaveProperty('created_at')
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
    expect(location).toHaveProperty('id')
    expect(location).toHaveProperty('name')
    expect(location).toHaveProperty('point')
    expect(location).toHaveProperty('release_status')
    expect(location).toHaveProperty('created_at')
  })

  it('should create location using data provider', async () => {
    const newLocationData = {
      name: 'Test Location',
      notes: 'Test notes',
      point: 'POINT(-106.6504 35.0844)',
      release_status: 'public'
    }

    console.log('About to create location with data:', newLocationData)

    try {
      const result = await ocotilloDataProvider.create({
        resource: 'ocotillo.location',
        variables: newLocationData
      })
      
      console.log('Create result:', JSON.stringify(result, null, 2))
      expect(result).toHaveProperty('data')
      
      const createdLocation = result.data as ILocation
      console.log('Created location:', JSON.stringify(createdLocation, null, 2))
      
      expect(createdLocation).toHaveProperty('id')
      expect(createdLocation).toHaveProperty('name')
      expect(createdLocation).toHaveProperty('point')
      expect(createdLocation).toHaveProperty('release_status')
      expect(createdLocation).toHaveProperty('created_at')
      
      expect(createdLocation.id).toBeDefined()
    } catch (error) {
      console.error('Create failed with error:', error)
      throw error
    }
  })
})
