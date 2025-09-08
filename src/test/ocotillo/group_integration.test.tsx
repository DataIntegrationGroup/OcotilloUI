import { describe, it, expect, beforeEach } from 'vitest'
import { GroupSchema } from '@/pages/ocotillo/group/schema'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import { delay } from '@/test/delay'
import { IGroup } from '@/interfaces/ocotillo/IGroup'

describe.skip('Ocotillo Integration Tests: Group', () => {
  beforeEach(async () => {
    await delay(100)
  })

  it('should fetch groups using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'group',
      pagination: { current: 1, pageSize: 10 }
    })

  expect(result).toHaveProperty('data')
  expect(result).toHaveProperty('total')
  expect(Array.isArray(result.data)).toBe(true)

  if (result.data.length > 0) {
    const group = result.data[0] as IGroup
  

  // Validate against schema
  try {
    const validatedGroup = await GroupSchema.validate(group, { strict: true })
    expect(validatedGroup).toBeDefined()
  } catch (error) {
    console.error('Schema validation failed:', error.message)
    console.error('Group data:', JSON.stringify(group, null, 2))
    throw new Error(`API response doesn't match IGroup interface: ${error.message}`)
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

  const group = result.data as IGroup

  // Validate against schema
  try {
    const validatedGroup = await GroupSchema.validate(group, { strict: true })
    expect(validatedGroup).toBeDefined()
  } catch (error) {
    console.error('Schema validation failed:', error.message)
    console.error('Group data:', JSON.stringify(group, null, 2))
    throw new Error(`API response doesn't match IGroup interface: ${error.message}`)
  }
  })

  it('should create group using data provider', async () => {
    const result = await ocotilloDataProvider.create({
      resource: 'group',
      variables: {
        name: 'Test Group',
        parent_group_id: 1,
        project_area: 'Test Project Area',
        description: 'Test Description'
      }
    })

    expect(result).toHaveProperty('data')

    const createdGroup = result.data as IGroup

    // Validate against schema
    try {
      const validatedGroup = await GroupSchema.validate(createdGroup, { strict: true })
      expect(validatedGroup).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Group data:', JSON.stringify(createdGroup, null, 2))
      throw new Error(`API response doesn't match IGroup interface: ${error.message}`)
    }
  })

  it('should update group using data provider', async () => {
    const result = await ocotilloDataProvider.update({
      resource: 'group',
      id: 1,
      variables: {
        name: 'Updated Test Group',
        parent_group_id: 1,
        project_area: 'Updated Test Project Area',
        description: 'Updated Test Description'
      }
    })

  expect(result).toHaveProperty('data')

  const updatedGroup = result.data as IGroup

  // Validate against schema
  try {
    const validatedGroup = await GroupSchema.validate(updatedGroup, { strict: true })
    expect(validatedGroup).toBeDefined()
  } catch (error) {
    console.error('Schema validation failed:', error.message)
    console.error('Group data:', JSON.stringify(updatedGroup, null, 2))
    throw new Error(`API response doesn't match IGroup interface: ${error.message}`)
  }
  })
})