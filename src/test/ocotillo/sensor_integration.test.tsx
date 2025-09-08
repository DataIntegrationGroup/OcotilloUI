import { describe, it, expect, beforeEach } from 'vitest'
import { SensorResponseSchema, SensorCreateSchema, SensorUpdateSchema } from '@/pages/ocotillo/sensor/schema'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import { delay } from '@/test/delay'
import { ISensor } from '@/interfaces/ocotillo/ISensor'

describe('Ocotillo Integration Tests: Sensor', () => {
  beforeEach(async () => {
    await delay(100)
  })

  it('should fetch sensors using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'sensor',
      pagination: { current: 1, pageSize: 10 }
    })
    
    
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)

    if (result.data.length > 0) {
      const sensor = result.data[0] as ISensor

      // Validate against schema
      try {
        const validatedSensor = await SensorResponseSchema.validate(sensor, { strict: true })
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

  const sensor = result.data as ISensor
  
  // Validate against schema
  try {
    const validatedSensor = await SensorResponseSchema.validate(sensor, { strict: true })
    expect(validatedSensor).toBeDefined()
  } catch (error) {
    console.error('Schema validation failed:', error.message)
    console.error('Sensor data:', JSON.stringify(sensor, null, 2))
    throw new Error(`API response doesn't match ISensor interface: ${error.message}`)
  }
  })

  it('should create a sensor using data provider', async () => {
    const createData = SensorCreateSchema.cast({
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
  const sensor = result.data as ISensor
  // Validate against schema
  try {
    const validatedSensor = await SensorResponseSchema.validate(sensor, { strict: true })
    expect(validatedSensor).toBeDefined()
  } catch (error) {
    console.error('Schema validation failed:', error.message)
    console.error('Sensor data:', JSON.stringify(sensor, null, 2))
    throw new Error(`API response doesn't match ISensor interface: ${error.message}`)
  }
  })

  it('should update a sensor using data provider', async () => {
    const updateData = SensorUpdateSchema.cast({
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
  const sensor = result.data as ISensor
  // Validate against schema
  try {
    const validatedSensor = await SensorResponseSchema.validate(sensor, { strict: true })
    expect(validatedSensor).toBeDefined()
  } catch (error) {
    console.error('Schema validation failed:', error.message)
    console.error('Sensor data:', JSON.stringify(sensor, null, 2))
    throw new Error(`API response doesn't match ISensor interface: ${error.message}`)
  }
  })
})