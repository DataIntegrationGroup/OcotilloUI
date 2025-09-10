import { describe, it, expect } from 'vitest'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import {
  zSensorResponse,
  zCreateSensor,
  zUpdateSensor
} from '@/generated/zod.gen'
import {
  SensorResponse,
  CreateSensor,
  UpdateSensor
} from '@/generated/types.gen'

describe('Ocotillo Integration Tests: Sensor', () => {

  it('should fetch sensors using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'sensor',
      pagination: { current: 1, pageSize: 10 }
    })
    
    
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)

    if (result.data.length > 0) {
      const sensor = result.data[0] as SensorResponse

      // Validate against schema
      try {
        const validatedSensor = zSensorResponse.parse(sensor)
        expect(validatedSensor).toBeDefined()
      } catch (error) {
        console.error('Schema validation failed:', error.message)
        console.error('Sensor data:', JSON.stringify(sensor, null, 2))
        throw new Error(`API response doesn't match ISensor interface: ${error.message}`)
      }
    }
  })

  it('should fetch single sensor by ID using data provider', async () => {
    const result = await ocotilloDataProvider.getOne({
      resource: 'sensor',
      id: 1,
      meta: {}
    })

  expect(result).toHaveProperty('data')

  const sensor = result.data as SensorResponse
  
  // Validate against schema
  try {
    const validatedSensor = zSensorResponse.parse(sensor)
    expect(validatedSensor).toBeDefined()
  } catch (error) {
    console.error('Schema validation failed:', error.message)
    console.error('Sensor data:', JSON.stringify(sensor, null, 2))
    throw new Error(`API response doesn't match ISensor interface: ${error.message}`)
  }
  })

  it('should create a sensor using data provider', async () => {
    const createData: CreateSensor = zCreateSensor.parse({
      name: 'Test Sensor',
      model: 'Test Model',
      serial_no: '1234567890',
      datetime_installed: '2025-01-08T21:15:18.139Z',
      datetime_removed: '2025-01-08T21:15:18.139Z',
      recording_interval: 10,
      notes: 'Test Notes',
      release_status: 'public'
    })

  const result = await ocotilloDataProvider.create({
    resource: 'sensor',
    variables: createData
  })

  expect(result).toHaveProperty('data')
  const sensor = result.data as SensorResponse
  // Validate against schema
  try {
    const validatedSensor = zSensorResponse.parse(sensor)
    expect(validatedSensor).toBeDefined()
  } catch (error) {
    console.error('Schema validation failed:', error.message)
    console.error('Sensor data:', JSON.stringify(sensor, null, 2))
    throw new Error(`API response doesn't match ISensor interface: ${error.message}`)
  }
  })

  it('should update a sensor using data provider', async () => {
    const updateData: UpdateSensor = zUpdateSensor.parse({
      id: 1,
      name: 'Updated Test Sensor',
      model: 'Updated Test Model',
      serial_no: '1234567890',
      datetime_installed: '2025-01-08T21:15:18.139Z',
      datetime_removed: '2025-01-08T21:15:18.139Z',
      recording_interval: 10,
      notes: 'Updated Test Notes'
    })

  const result = await ocotilloDataProvider.update({
    resource: 'sensor',
    id: 1,
    variables: updateData
  })

  expect(result).toHaveProperty('data')
  const sensor = result.data as SensorResponse
  // Validate against schema
  try {
    const validatedSensor = zSensorResponse.parse(sensor)
    expect(validatedSensor).toBeDefined()
  } catch (error) {
    console.error('Schema validation failed:', error.message)
    console.error('Sensor data:', JSON.stringify(sensor, null, 2))
    throw new Error(`API response doesn't match ISensor interface: ${error.message}`)
  }
  })
})