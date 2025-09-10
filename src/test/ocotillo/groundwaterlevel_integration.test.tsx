import { describe, it, expect } from 'vitest'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import {
  zGroundwaterLevelObservationResponse,
  zCreateGroundwaterLevelObservation,
  zUpdateGroundwaterLevelObservation
} from '@/generated/zod.gen'
import {
  GroundwaterLevelObservationResponse,
  CreateGroundwaterLevelObservation,
  UpdateGroundwaterLevelObservation
} from '@/generated/types.gen'

describe('Ocotillo Integration Tests: Groundwater Level Observation', () => {

  it('should fetch groundwater level observations using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'observation/groundwater-level',
      pagination: { current: 1, pageSize: 10 }
    })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)

    if (result.data.length > 0) {
      const observation = result.data[0] as GroundwaterLevelObservationResponse

      // Validate against schema
      try {
        const validatedObservation = zGroundwaterLevelObservationResponse.parse(observation)
        expect(validatedObservation).toBeDefined()
      } catch (error) {
        console.error('Schema validation failed:', error.message)
        console.error('Groundwater level observation data:', JSON.stringify(observation, null, 2))
        throw new Error(`API response doesn't match IGroundwaterLevelObservation interface: ${error.message}`)
      }
    }
  })

  it('should fetch single groundwater level observation by ID using data provider', async () => {
    const result = await ocotilloDataProvider.getOne({
      resource: 'observation/groundwater-level',
      id: 1,
      meta: {}
    })

    expect(result).toHaveProperty('data')

    const observation = result.data as GroundwaterLevelObservationResponse

    // Validate against schema
    try {
      const validatedObservation = zGroundwaterLevelObservationResponse.parse(observation)
      expect(validatedObservation).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Groundwater level observation data:', JSON.stringify(observation, null, 2))
      throw new Error(`API response doesn't match IGroundwaterLevelObservation interface: ${error.message}`)
    }
  })

  it('should create a groundwater level observation using data provider', async () => {
    const createData = zCreateGroundwaterLevelObservation.parse({
      sample_id: 1,
      sensor_id: 1,
      observed_property: 'groundwater level',
      observation_datetime: '2025-01-08T21:15:18.139Z',
      value: 6,
      unit: 'ft',
      depth_to_water_bgs: 10,
      measuring_point_height: 4,
      release_status: 'public',
      level_status: 'normal'
    })

  const result = await ocotilloDataProvider.create({
    resource: 'observation/groundwater-level',
    variables: createData
  })

  expect(result).toHaveProperty('data')
  const observation = result.data as GroundwaterLevelObservationResponse
  // Validate against schema
  try {
    const validatedObservation = zGroundwaterLevelObservationResponse.parse(observation)
    expect(validatedObservation).toBeDefined()
  } catch (error) {
    console.error('Schema validation failed:', error.message)
    console.error('Groundwater level observation data:', JSON.stringify(observation, null, 2))
    throw new Error(`API response doesn't match IGroundwaterLevelObservation interface: ${error.message}`)
  }
  })

  it('should update a groundwater level observation using data provider', async () => {
    const updateData: UpdateGroundwaterLevelObservation = zUpdateGroundwaterLevelObservation.parse({
      id: 1,
      observed_property: 'groundwater level',
      observation_datetime: '2025-02-08T21:15:18.139Z',
      sample_id: 1,
      sensor_id: 1,
      value: 5,
      unit: 'ft',
      depth_to_water_bgs: 10,
      measuring_point_height: 5,
      release_status: 'draft',
      level_status: 'normal'
    })

  const result = await ocotilloDataProvider.update({
    resource: 'observation/groundwater-level',
    id: 1,
    variables: updateData
  })

  expect(result).toHaveProperty('data')
  const observation = result.data as GroundwaterLevelObservationResponse
  // Validate against schema
  try {
    const validatedObservation = zGroundwaterLevelObservationResponse.parse(observation)
    expect(validatedObservation).toBeDefined()
  } catch (error) {
    console.error('Schema validation failed:', error.message)
    console.error('Groundwater level observation data:', JSON.stringify(observation, null, 2))
    throw new Error(`API response doesn't match IGroundwaterLevelObservation interface: ${error.message}`)
  }
  })
})

