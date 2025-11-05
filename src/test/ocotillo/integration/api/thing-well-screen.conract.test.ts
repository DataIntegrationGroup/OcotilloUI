import { describe, it, expect } from 'vitest'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import {
  zWellScreenResponse,
  zCreateWellScreen,
  zUpdateWellScreen,
} from '@/generated/zod.gen'
import {
  WellScreenResponse,
  CreateWellScreen,
  UpdateWellScreen,
} from '@/generated/types.gen'

describe('Ocotillo Integration Tests: Well Screen', () => {
  it('should fetch well screens using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'thing/well-screen',
      pagination: { current: 1, pageSize: 10 },
    })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)

    if (result.data.length > 0) {
      const wellScreen = result.data[0] as WellScreenResponse

      // Validate against schema
      try {
        const validatedWellScreen = zWellScreenResponse.parse(wellScreen)
        expect(validatedWellScreen).toBeDefined()
      } catch (error) {
        console.error('Schema validation failed:', error.message)
        console.error('WellScreen data:', JSON.stringify(wellScreen, null, 2))
        throw new Error(
          `API response doesn't match IWellScreen interface: ${error.message}`
        )
      }
    }
  })

  it('should fetch single well screen by ID using data provider', async () => {
    const result = await ocotilloDataProvider.getOne({
      resource: 'thing/well-screen',
      id: 1,
      meta: {},
    })

    expect(result).toHaveProperty('data')

    const wellScreen = result.data as WellScreenResponse

    // Validate against schema
    try {
      const validatedWellScreen = zWellScreenResponse.parse(wellScreen)
      expect(validatedWellScreen).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('WellScreen data:', JSON.stringify(wellScreen, null, 2))
      throw new Error(
        `API response doesn't match IWellScreen interface: ${error.message}`
      )
    }
  })

  it('should create well screen using data provider', async () => {
    const createData: CreateWellScreen = zCreateWellScreen.parse({
      thing_id: 1,
      release_status: 'public',
      screen_depth_bottom: 100,
      screen_depth_top: 200,
      screen_type: 'Steel',
      screen_description: 'Test Description',
    })

    const result = await ocotilloDataProvider.create({
      resource: 'thing/well-screen',
      variables: createData,
    })

    expect(result).toHaveProperty('data')

    const wellScreen = result.data as WellScreenResponse

    // Validate against schema
    try {
      const validatedWellScreen = zWellScreenResponse.parse(wellScreen)
      expect(validatedWellScreen).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('WellScreen data:', JSON.stringify(wellScreen, null, 2))
      throw new Error(
        `API response doesn't match IWellScreen interface: ${error.message}`
      )
    }
  })

  it('should update well screen using data provider', async () => {
    const updateData: UpdateWellScreen = zUpdateWellScreen.parse({
      release_status: 'public',
      screen_depth_bottom: 80,
      screen_depth_top: 180,
      screen_type: 'Steel',
      screen_description: 'Updated Test Description',
    })

    const result = await ocotilloDataProvider.update({
      resource: 'thing/well-screen',
      id: 1,
      variables: updateData,
    })

    expect(result).toHaveProperty('data')

    const wellScreen = result.data as WellScreenResponse

    // Validate against schema
    try {
      const validatedWellScreen = zWellScreenResponse.parse(wellScreen)
      expect(validatedWellScreen).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('WellScreen data:', JSON.stringify(wellScreen, null, 2))
      throw new Error(
        `API response doesn't match IWellScreen interface: ${error.message}`
      )
    }
  })
})
