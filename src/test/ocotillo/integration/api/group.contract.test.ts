import { describe, it, expect } from 'vitest'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import {
  zGroupResponse,
  zCreateGroup,
  zUpdateGroup
} from '@/generated/zod.gen'
import {
  GroupResponse,
  CreateGroup,
  UpdateGroup
} from '@/generated/types.gen'

describe('Ocotillo Integration Tests: Group', () => {

  it('should fetch groups using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'group',
      pagination: { currentPage: 1, pageSize: 10 }
    })

  expect(result).toHaveProperty('data')
  expect(result).toHaveProperty('total')
  expect(Array.isArray(result.data)).toBe(true)

  if (result.data.length > 0) {
    const group = result.data[0] as GroupResponse
  

  // Validate against schema
  try {
    const validatedGroup = zGroupResponse.parse(group)
    expect(validatedGroup).toBeDefined()
  } catch (error) {
    console.error('Schema validation failed:', getErrorMessage(error))
    console.error('Group data:', JSON.stringify(group, null, 2))
    throw new Error(`API response doesn't match IGroup interface: ${getErrorMessage(error)}`)
  }
}
})

  it('should fetch single group by ID using data provider', async () => {
    const result = await ocotilloDataProvider.getOne({
      resource: 'group',
      id: 1,
      meta: {}
    })

  expect(result).toHaveProperty('data')

  const group = result.data as GroupResponse

  // Validate against schema
  try {
    const validatedGroup = zGroupResponse.parse(group)
    expect(validatedGroup).toBeDefined()
  } catch (error) {
    console.error('Schema validation failed:', getErrorMessage(error))
    console.error('Group data:', JSON.stringify(group, null, 2))
    throw new Error(`API response doesn't match IGroup interface: ${getErrorMessage(error)}`)
  }
  })

  it('should create group using data provider', async () => {
    const testData: CreateGroup = zCreateGroup.parse({
      name: 'Test Group',
      release_status: 'public',
      parent_group_id: 1,
      project_area: 'Test Project Area',
      description: 'Test Description'
    })

    const result = await ocotilloDataProvider.create({
      resource: 'group',
      variables: testData
    })

    expect(result).toHaveProperty('data')

    const createdGroup = result.data as GroupResponse

    // Validate against schema
    try {
      const validatedGroup = zGroupResponse.parse(createdGroup)
      expect(validatedGroup).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', getErrorMessage(error))
      console.error('Group data:', JSON.stringify(createdGroup, null, 2))
      throw new Error(`API response doesn't match IGroup interface: ${getErrorMessage(error)}`)
    }
  })

  it('should update group using data provider', async () => {
    const testData: UpdateGroup = zUpdateGroup.parse({
      name: 'Updated Test Group',
      release_status: 'public',
      parent_group_id: 1,
      project_area: 'Updated Test Project Area',
      description: 'Updated Test Description'
    })

    const result = await ocotilloDataProvider.update({
      resource: 'group',
      id: 1,
      variables: testData
    })

  expect(result).toHaveProperty('data')

  const updatedGroup = result.data as GroupResponse

  // Validate against schema
  try {
    const validatedGroup = zGroupResponse.parse(updatedGroup)
    expect(validatedGroup).toBeDefined()
  } catch (error) {
    console.error('Schema validation failed:', getErrorMessage(error))
    console.error('Group data:', JSON.stringify(updatedGroup, null, 2))
    throw new Error(`API response doesn't match IGroup interface: ${getErrorMessage(error)}`)
  }
  })
})