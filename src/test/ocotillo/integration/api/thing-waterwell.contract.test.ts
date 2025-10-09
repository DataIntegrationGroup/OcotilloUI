import { describe, it, expect } from 'vitest'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import {
  zWellResponse,
  zCreateWell,
  zUpdateWell
} from '@/generated/zod.gen'
import {
  WellResponse,
  CreateWell,
  UpdateWell
} from '@/generated/types.gen'

describe('Ocotillo Integration Tests: Water Well', () => {

  it('should fetch water wells using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'thing/water-well',
      pagination: { current: 1, pageSize: 10 }
    })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)

    if (result.data.length > 0) {
      const well = result.data[0] as WellResponse

      // Validate against schema
      try {
        const validatedWell = zWellResponse.parse(well)
        expect(validatedWell).toBeDefined()
      } catch (error) {
        console.error('Schema validation failed:', error.message)
        console.error('Water well data:', JSON.stringify(well, null, 2))
        throw new Error(`API response doesn't match IWaterWell interface: ${error.message}`)
      }
    }
  })

  it('should fetch single water well by ID using data provider', async () => {
    const result = await ocotilloDataProvider.getOne({
      resource: 'thing/water-well',
      id: 1,
      meta: {}
    })

    expect(result).toHaveProperty('data')

    const well = result.data as WellResponse

    // Validate against schema
    try {
      const validatedWell = zWellResponse.parse(well)
      expect(validatedWell).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Water well data:', JSON.stringify(well, null, 2))
      throw new Error(`API response doesn't match IWell interface: ${error.message}`)
    }
  })

  it('should create a water well using data provider', async () => {
    const createData: CreateWell = zCreateWell.parse({
      name: 'Test Water Well',
      release_status: 'public',
      first_visit_date: '2025-01-08',
      location_id: 1,
      well_depth: 10,
      hole_depth: 10,
      well_purpose: 'monitoring',
      well_construction_notes: 'Test construction notes',
      group_id: 1,
    })

    const result = await ocotilloDataProvider.create({
      resource: 'thing/water-well',
      variables: createData
    })

    expect(result).toHaveProperty('data')

    const well = result.data as WellResponse

    // Validate against schema
    try {
      const validatedWell = zWellResponse.parse(well)
      expect(validatedWell).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Water well data:', JSON.stringify(well, null, 2))
      throw new Error(`API response doesn't match IWell interface: ${error.message}`)
    }
  })

  it('should update a water well using data provider', async () => {
    const updateData: UpdateWell = zUpdateWell.parse({
      name: 'Updated Test Water Well',
      release_status: 'public',
      first_visit_date: '2025-01-08',
      well_depth: 10,
      hole_depth: 10,
      well_purpose: 'monitoring',
      well_construction_notes: 'Updated test construction notes'
    })

    const result = await ocotilloDataProvider.update({
      resource: 'thing/water-well',
      id: 1,
      variables: updateData
    })

    expect(result).toHaveProperty('data')

    const well = result.data as WellResponse

    // Validate against schema
    try {
      const validatedWell = zWellResponse.parse(well)
      expect(validatedWell).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Water well data:', JSON.stringify(well, null, 2))
      throw new Error(`API response doesn't match IWell interface: ${error.message}`)
    }
  })
})