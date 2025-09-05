import { describe, it, expect, beforeEach } from 'vitest'
import { ContactSchema } from '@/pages/ocotillo/contact/schema'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import { delay } from '@/test/delay'
import { IContact } from '@/interfaces/ocotillo/IContact'

describe('Ocotillo Integration Tests: Contact', () => {
  beforeEach(async () => {
    await delay(100)
  })

  it('should fetch contacts using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'contact',
      pagination: { current: 1, pageSize: 10 }
    })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)

    if (result.data.length > 0) {
      const contact = result.data[0] as IContact 

      // Validate against schema
      try {
        const validatedContact = await ContactSchema.validate(contact, { strict: true })
        expect(validatedContact).toBeDefined()
      } catch (error) {
        console.error('Schema validation failed:', error.message)
        console.error('Contact data:', JSON.stringify(contact, null, 2))
        throw new Error(`API response doesn't match IContact interface: ${error.message}`)
      }
    }
  })

  it('should fetch single contact by ID using data provider', async () => {
    const result = await ocotilloDataProvider.getOne({
      resource: 'contact',
      id: 1,
      meta: {}
    })

    expect(result).toHaveProperty('data')

    const contact = result.data as IContact

    // Validate against schema
    try {
      const validatedContact = await ContactSchema.validate(contact, { strict: true })
      expect(validatedContact).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Contact data:', JSON.stringify(contact, null, 2))
      throw new Error(`API response doesn't match IContact interface: ${error.message}`)
    }
  })

  it('should create contact using data provider', async () => {
    const result = await ocotilloDataProvider.create({
      resource: 'contact',
      variables: {
        name: 'Test Contact',
        role: 'Owner',
        thing_id: 1,
        contact_type: 'Primary',
        organization: 'Test Organization',
        emails: [{
          email: 'test@test.com',
          email_type: 'Primary',
          release_status: 'public'
        }],
        phones: [{
          phone_number: '9714567890',
          phone_type: 'Primary',
          release_status: 'public'
        }],
        addresses: [{
          address_line_1: 'Test Address Line 1',
          address_line_2: 'Test Address Line 2',
          city: 'Test City',
          state: 'Test State',
          postal_code: '97456',
          address_type: 'Primary',
          release_status: 'public'
        }],
        release_status: 'public'
      }
    })

    expect(result).toHaveProperty('data')

    const createdContact = result.data as IContact

    // Validate against schema
    try {
      const validatedContact = await ContactSchema.validate(createdContact, { strict: true })
      expect(validatedContact).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Contact data:', JSON.stringify(createdContact, null, 2))
      throw new Error(`API response doesn't match IContact interface: ${error.message}`)
    }
  })

  it('should update contact using data provider', async () => {
    const result = await ocotilloDataProvider.update({
      resource: 'contact',
      id: 1,
      variables: {
        name: 'Updated Test Contact',
        role: 'Owner',
        thing_id: 1,
        contact_type: 'Primary',
        organization: 'Test Organization',
        emails: [{
          email: 'testupdate@test.com',
          email_type: 'Primary',
          release_status: 'public'
        }],
        phones: [{
          phone_number: '9714567890',
          phone_type: 'Primary',
          release_status: 'public'
        }],
        addresses: [{
          address_line_1: 'Test Address Line 1',
          address_line_2: 'Test Address Line 2',
          city: 'Test Update City',
          state: 'Test State',
          postal_code: '97456',
          address_type: 'Primary',
          release_status: 'public'
        }],
        release_status: 'public'
      }
    })

    expect(result).toHaveProperty('data')

    const updatedContact = result.data as IContact

    // Validate against schema
    try {
      const validatedContact = await ContactSchema.validate(updatedContact, { strict: true })
      expect(validatedContact).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Contact data:', JSON.stringify(updatedContact, null, 2))
      throw new Error(`API response doesn't match IContact interface: ${error.message}`)
    }
  })
})