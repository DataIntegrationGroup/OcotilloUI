import { describe, it, expect } from 'vitest'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import {
  zSampleResponse,
  zCreateSample,
  zUpdateSample
} from '@/generated/zod.gen'
import {
  SampleResponse,
  CreateSample,
  UpdateSample
} from '@/generated/types.gen'

describe('Ocotillo Integration Tests: Sample', () => {

  it('should fetch samples using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'sample',
      pagination: { current: 1, pageSize: 10 }
    })
    
    
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)
    
    if (result.data.length > 0) {
      const sample = result.data[0] as SampleResponse
      
      
      // Validate against schema
      try {
        const validatedSample = zSampleResponse.parse(sample)
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

    const sample = result.data as SampleResponse
    
    // Validate against schema
    try {
        const validatedSample = zSampleResponse.parse(sample)
        expect(validatedSample).toBeDefined()
    } catch (error) {
        console.error('Schema validation failed:', error.message)
        console.error('Sample data:', JSON.stringify(sample, null, 2))
        throw new Error(`API response doesn't match ISample interface: ${error.message}`)
    }
  })

  it('should create a sample using data provider', async () => {
    const createData: CreateSample = zCreateSample.parse({
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
    const sample = result.data as SampleResponse
    // Validate against schema
    try {
      const validatedSample = zSampleResponse.parse(sample)
      expect(validatedSample).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Sample data:', JSON.stringify(sample, null, 2))
        throw new Error(`API response doesn't match ISample interface: ${error.message}`)
    }
  })

  it('should update a sample using data provider', async () => {
    const updateData: UpdateSample = zUpdateSample.parse({
      id: 1,
      sample_type: 'surface water',
      field_sample_id: 'test',
      sample_date: '2025-01-08T21:15:18.139Z',
      release_status: 'public',
      sampler_name: 'updated',
      qc_sample: 'original',
      sensor_id: 1,
      sample_matrix: 'test',
      sample_method: 'manual',
      duplicate_sample_number: 1,
      sample_top: 1,
      sample_bottom: 1,
    })

    const result = await ocotilloDataProvider.update({
      resource: 'sample',
      id: 1,
      variables: updateData
    })

    expect(result).toHaveProperty('data')
    const sample = result.data as SampleResponse
    // Validate against schema
    try {
      const validatedSample = zSampleResponse.parse(sample)
      expect(validatedSample).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Sample data:', JSON.stringify(sample, null, 2))
        throw new Error(`API response doesn't match ISample interface: ${error.message}`)
    }
  })
  
})