import { describe, it, expect } from 'vitest'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import {
  zSampleResponse,
  zCreateSample,
  zUpdateSample,
} from '@/generated/zod.gen'
import {
  SampleResponse,
  CreateSample,
  UpdateSample,
} from '@/generated/types.gen'

describe('Ocotillo Integration Tests: Sample', () => {
  it('should fetch samples using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'sample',
      pagination: { currentPage: 1, pageSize: 10 },
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
        console.error('Schema validation failed:', getErrorMessage(error))
        console.error('Sample data:', JSON.stringify(sample, null, 2))
        throw new Error(
          `API response doesn't match ISample interface: ${getErrorMessage(error)}`
        )
      }
    }
  })

  it('should fetch single sample by ID using data provider', async () => {
    const result = await ocotilloDataProvider.getOne({
      resource: 'sample',
      id: 1,
      meta: {},
    })

    expect(result).toHaveProperty('data')

    const sample = result.data as SampleResponse

    // Validate against schema
    try {
      const validatedSample = zSampleResponse.parse(sample)
      expect(validatedSample).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', getErrorMessage(error))
      console.error('Sample data:', JSON.stringify(sample, null, 2))
      throw new Error(
        `API response doesn't match ISample interface: ${getErrorMessage(error)}`
      )
    }
  })

  it('should create a sample using data provider', async () => {
    const createData: CreateSample = zCreateSample.parse({
      sample_date: '2025-01-08T21:15:18.139Z',
      depth_top: 1.0,
      depth_bottom: 2.0,
      release_status: 'public',
      field_activity_id: 1,
      field_event_participant_id: 1,
      sample_name: 'test-sample',
      sample_matrix: 'groundwater',
      sample_method: 'grab sample',
      qc_type: 'Normal',
      notes: 'Test sample creation',
    })

    const result = await ocotilloDataProvider.create({
      resource: 'sample',
      variables: createData,
    })

    expect(result).toHaveProperty('data')
    const sample = result.data as SampleResponse
    // Validate against schema
    try {
      const validatedSample = zSampleResponse.parse(sample)
      expect(validatedSample).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', getErrorMessage(error))
      console.error('Sample data:', JSON.stringify(sample, null, 2))
      throw new Error(
        `API response doesn't match ISample interface: ${getErrorMessage(error)}`
      )
    }
  })

  it('should update a sample using data provider', async () => {
    const updateData: UpdateSample = zUpdateSample.parse({
      sample_date: '2025-01-08T21:15:18.139Z',
      depth_top: 1.5,
      depth_bottom: 2.5,
      release_status: 'public',
      field_activity_id: 1,
      field_event_participant_id: 1,
      sample_name: 'updated-sample',
      sample_matrix: 'water',
      sample_method: 'pump',
      qc_type: 'Duplicate',
      notes: 'Updated sample data',
    })

    const result = await ocotilloDataProvider.update({
      resource: 'sample',
      id: 1,
      variables: updateData,
    })

    expect(result).toHaveProperty('data')
    const sample = result.data as SampleResponse
    // Validate against schema
    try {
      const validatedSample = zSampleResponse.parse(sample)
      expect(validatedSample).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', getErrorMessage(error))
      console.error('Sample data:', JSON.stringify(sample, null, 2))
      throw new Error(
        `API response doesn't match ISample interface: ${getErrorMessage(error)}`
      )
    }
  })
})
