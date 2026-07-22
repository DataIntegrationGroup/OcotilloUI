import { describe, it, expect } from 'vitest'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import {
  zSpringResponse,
  zCreateSpring,
  zUpdateSpring,
} from '@/generated/zod.gen'
import { SpringResponse, UpdateSpring } from '@/generated/types.gen'

describe('Ocotillo Integration Tests: Spring', () => {
  it('should fetch springs using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'thing/spring',
      pagination: { currentPage: 1, pageSize: 10 },
    })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)

    if (result.data.length > 0) {
      const spring = result.data[0] as SpringResponse

      // Validate against schema
      try {
        const validatedSpring = zSpringResponse.parse(spring)
        expect(validatedSpring).toBeDefined()
      } catch (error) {
        console.error('Schema validation failed:', getErrorMessage(error))
        console.error('Spring data:', JSON.stringify(spring, null, 2))
        throw new Error(
          `API response doesn't match ISpring interface: ${getErrorMessage(error)}`
        )
      }
    }
  })

  it('should fetch single spring by ID using data provider', async () => {
    const result = await ocotilloDataProvider.getOne({
      resource: 'thing/spring',
      id: 1,
      meta: {},
    })

    expect(result).toHaveProperty('data')

    const spring = result.data as SpringResponse

    // Validate against schema
    try {
      const validatedSpring = zSpringResponse.parse(spring)
      expect(validatedSpring).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', getErrorMessage(error))
      console.error('Spring data:', JSON.stringify(spring, null, 2))
      throw new Error(
        `API response doesn't match ISpring interface: ${getErrorMessage(error)}`
      )
    }
  })

  it('should create spring using data provider', async () => {
    const createData = zCreateSpring.parse({
      name: 'Test Spring',
      release_status: 'public',
      first_visit_date: '2025-01-08',
      location_id: 1,
      group_id: 1,
      spring_type: 'Artesian',
    })

    const result = await ocotilloDataProvider.create({
      resource: 'thing/spring',
      variables: createData,
    })

    expect(result).toHaveProperty('data')

    const spring = result.data as SpringResponse

    // Validate against schema
    try {
      const validatedSpring = zSpringResponse.parse(spring)
      expect(validatedSpring).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', getErrorMessage(error))
      console.error('Spring data:', JSON.stringify(spring, null, 2))
      throw new Error(
        `API response doesn't match ISpring interface: ${getErrorMessage(error)}`
      )
    }
  })

  it('should update spring using data provider', async () => {
    const updateData: UpdateSpring = zUpdateSpring.parse({
      name: 'Updated Test Spring',
      release_status: 'public',
      first_visit_date: '2025-01-08',
      spring_type: 'artesian',
    })

    const result = await ocotilloDataProvider.update({
      resource: 'thing/spring',
      id: 1,
      variables: updateData,
    })

    expect(result).toHaveProperty('data')

    const spring = result.data as SpringResponse

    // Validate against schema
    try {
      const validatedSpring = zSpringResponse.parse(spring)
      expect(validatedSpring).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', getErrorMessage(error))
      console.error('Spring data:', JSON.stringify(spring, null, 2))
      throw new Error(
        `API response doesn't match ISpring interface: ${getErrorMessage(error)}`
      )
    }
  })
})
