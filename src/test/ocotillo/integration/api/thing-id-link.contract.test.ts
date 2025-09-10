import { describe, it, expect } from 'vitest'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import {
  zThingIdLinkResponse,
  zCreateThingIdLink,
  zUpdateThingIdLink
} from '@/generated/zod.gen'
import {
  ThingIdLinkResponse,
  CreateThingIdLink,
  UpdateThingIdLink
} from '@/generated/types.gen'

describe('Ocotillo Integration Tests: Thing Id Link', () => {

  it('should fetch thing id links using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'thing/id-link',
      pagination: { current: 1, pageSize: 10 }
    })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)

    if (result.data.length > 0) {
      const idLink = result.data[0] as ThingIdLinkResponse

      // Validate against schema
      try {
        const validatedIdLink = zThingIdLinkResponse.parse(idLink)
        expect(validatedIdLink).toBeDefined()
      } catch (error) {
        console.error('Schema validation failed:', error.message)
        console.error('IdLink data:', JSON.stringify(idLink, null, 2))
        throw new Error(`API response doesn't match IThingIdLink interface: ${error.message}`)
      }
    }
  })

  it('should fetch single thing id link by ID using data provider', async () => {
    const result = await ocotilloDataProvider.getOne({
      resource: 'thing/id-link',
      id: 1,
      meta: {}
    })
  })

  it('should create thing id link using data provider', async () => {
    const createData: CreateThingIdLink = zCreateThingIdLink.parse({
      thing_id: 1,
      alternate_organization: 'Test Organization',
      alternate_id: 'RP-1234567',
      relation: 'OSEPOD'
    })

    const result = await ocotilloDataProvider.create({
      resource: 'thing/id-link',
      variables: createData
    })

    expect(result).toHaveProperty('data')

    const idLink = result.data as ThingIdLinkResponse

    // Validate against schema
    try {
      const validatedIdLink = zThingIdLinkResponse.parse(idLink)
      expect(validatedIdLink).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('IdLink data:', JSON.stringify(idLink, null, 2))
      throw new Error(`API response doesn't match IThingIdLink interface: ${error.message}`)
    }
  })

  it('should update thing id link using data provider', async () => {
    const updateData: UpdateThingIdLink = zUpdateThingIdLink.parse({
      alternate_organization: 'Updated Test Organization',
      alternate_id: 'RP-1dsad7',
      relation: 'PLSS'
    })

    const result = await ocotilloDataProvider.update({
      resource: 'thing/id-link',
      id: 1,
      variables: updateData
    })

    expect(result).toHaveProperty('data')

    const idLink = result.data as ThingIdLinkResponse

    // Validate against schema
    try {
      const validatedIdLink = zThingIdLinkResponse.parse(idLink)
      expect(validatedIdLink).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('IdLink data:', JSON.stringify(idLink, null, 2))
      throw new Error(`API response doesn't match IThingIdLink interface: ${error.message}`)
    }
  })
})