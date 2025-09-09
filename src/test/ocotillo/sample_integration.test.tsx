import { describe, it, expect, beforeEach } from 'vitest'
import { SampleResponseSchema, SampleCreateSchema, SampleUpdateSchema } from '@/pages/ocotillo/sample/schema'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import { delay } from '@/test/delay'
import { ISample } from '@/interfaces/ocotillo/ISample'

describe('Ocotillo Integration Tests: Sample', () => {
  beforeEach(async () => {
    await delay(100)
  })

  it('should fetch samples using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'sample',
      pagination: { current: 1, pageSize: 10 }
    })
    
    
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)
    
    if (result.data.length > 0) {
      const sample = result.data[0] as ISample
      
      
      // Validate against schema
      try {
        const validatedSample = await SampleResponseSchema.validate(sample, { strict: true })
        expect(validatedSample).toBeDefined()
      } catch (error) {
        console.error('Schema validation failed:', error.message)
        console.error('Sample data:', JSON.stringify(sample, null, 2))
        throw new Error(`API response doesn't match ISample interface: ${error.message}`)
      }
    }
  })

  it('should fetch single sample by ID using data provider', async () => {
    const result = await ocotilloDataProvider.getOne({
      resource: 'sample',
      id: 1,
      meta: {}
    })

    expect(result).toHaveProperty('data')

    const sample = result.data as ISample
    
    // Validate against schema
    try {
        const validatedSample = await SampleResponseSchema.validate(sample, { strict: true })
        expect(validatedSample).toBeDefined()
    } catch (error) {
        console.error('Schema validation failed:', error.message)
        console.error('Sample data:', JSON.stringify(sample, null, 2))
        throw new Error(`API response doesn't match ISample interface: ${error.message}`)
    }
  })

  it('should create a sample using data provider', async () => {
    const createData = SampleCreateSchema.cast({
        thing_id: 1,
        sample_type: 'groundwater',
        field_sample_id: 'test',
        sample_date: '2025-01-08T21:15:18.139Z',
        release_status: 'public',
        sampler_name: 'test',
        qc_sample: 'original',
        sensor_id: 1,
        sample_matrix: 'test',
        sample_method: 'manual',
        duplicate_sample_number: 1,
        sample_top: 1,
        sample_bottom: 1,
      })
      
    const result = await ocotilloDataProvider.create({
        resource: 'sample',
        variables: createData
    })

    expect(result).toHaveProperty('data')
    const sample = result.data as ISample
    // Validate against schema
    try {
      const validatedSample = await SampleResponseSchema.validate(sample, { strict: true })
      expect(validatedSample).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Sample data:', JSON.stringify(sample, null, 2))
        throw new Error(`API response doesn't match ISample interface: ${error.message}`)
    }
  })

  it('should update a sample using data provider', async () => {
    const updateData = SampleUpdateSchema.cast({
      id: 1,
      sample_type: 'surface water',
    })

    const result = await ocotilloDataProvider.update({
      resource: 'sample',
      id: 1,
      variables: updateData
    })

    expect(result).toHaveProperty('data')
    const sample = result.data as ISample
    // Validate against schema
    try {
      const validatedSample = await SampleResponseSchema.validate(sample, { strict: true })
      expect(validatedSample).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Sample data:', JSON.stringify(sample, null, 2))
        throw new Error(`API response doesn't match ISample interface: ${error.message}`)
    }
  })
  
})