import { describe, it, expect } from 'vitest'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import {
  zContactResponse,
  zCreateContact,
  zUpdateContact,
  zEmailResponse,
  zPhoneResponse,
  zAddressResponse,
  zUpdateEmail,
  zUpdatePhone,
  zUpdateAddress
} from '@/generated/zod.gen'
import {
  ContactResponse,
  CreateContact,
  UpdateContact,
  EmailResponse,
  PhoneResponse,
  AddressResponse,
  UpdateEmail,
  UpdatePhone,
  UpdateAddress
} from '@/generated/types.gen'

describe('Ocotillo Integration Tests: Contact', () => {

  it('should fetch contacts using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'contact',
      pagination: { current: 1, pageSize: 10 }
    })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)

    if (result.data.length > 0) {
      const contact = result.data[0] as ContactResponse 

      // Validate against schema
      try {
        const validatedContact = zContactResponse.parse(contact)
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

    const contact = result.data as ContactResponse

    // Validate against schema
    try {
      const validatedContact = zContactResponse.parse(contact)
      expect(validatedContact).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Contact data:', JSON.stringify(contact, null, 2))
      throw new Error(`API response doesn't match IContact interface: ${error.message}`)
    }
  })

  it('should create contact using data provider', async () => {
    const testData: CreateContact = zCreateContact.parse({
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
    })

    const result = await ocotilloDataProvider.create({
      resource: 'contact',
      variables: testData
    })

    expect(result).toHaveProperty('data')

    const createdContact = result.data as ContactResponse

    // Validate against schema
    try {
      const validatedContact = zContactResponse.parse(createdContact)
      expect(validatedContact).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Contact data:', JSON.stringify(createdContact, null, 2))
      throw new Error(`API response doesn't match IContact interface: ${error.message}`)
    }
  })

  it('should update contact using data provider', async () => {
    const testData: UpdateContact = zUpdateContact.parse({
      name: 'Updated Test Contact',
      role: 'Owner',
      contact_type: 'Primary',
      organization: 'Updated Test Organization',
      release_status: 'public'
    })

    const result = await ocotilloDataProvider.update({
      resource: 'contact',
      id: 1,
      variables: testData
    })

    expect(result).toHaveProperty('data')

    const updatedContact = result.data as ContactResponse

    // Validate against schema
    try {
      const validatedContact = zContactResponse.parse(updatedContact)
      expect(validatedContact).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Contact data:', JSON.stringify(updatedContact, null, 2))
      throw new Error(`API response doesn't match IContact interface: ${error.message}`)
    }
  })

  it('should fetch email by ID using data provider', async () => {
    const result = await ocotilloDataProvider.getOne({
      resource: 'contact/email',
      id: 1,
      meta: {}
    })

    expect(result).toHaveProperty('data')

    const email = result.data as EmailResponse

    // Validate against schema
    try {
      const validatedEmail = zEmailResponse.parse(email)
      expect(validatedEmail).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Email data:', JSON.stringify(email, null, 2))
      throw new Error(`API response doesn't match EmailResponse interface: ${error.message}`)
    }
  })

  it('should update email using data provider', async () => {
    const testData: UpdateEmail = zUpdateEmail.parse({
      email: 'updated@test.com',
      email_type: 'Secondary',
      release_status: 'public',
      contact_id: 1
    })

    const result = await ocotilloDataProvider.update({
      resource: 'contact/email',
      id: 1,
      variables: testData
    })

    expect(result).toHaveProperty('data')

    const updatedEmail = result.data as EmailResponse

    // Validate against schema
    try {
      const validatedEmail = zEmailResponse.parse(updatedEmail)
      expect(validatedEmail).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Email data:', JSON.stringify(updatedEmail, null, 2))
      throw new Error(`API response doesn't match EmailResponse interface: ${error.message}`)
    }
  })

  it('should fetch phone by ID using data provider', async () => {
    const result = await ocotilloDataProvider.getOne({
      resource: 'contact/phone',
      id: 1,
      meta: {}
    })

    expect(result).toHaveProperty('data')

    const phone = result.data as PhoneResponse

    // Validate against schema
    try {
      const validatedPhone = zPhoneResponse.parse(phone)
      expect(validatedPhone).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Phone data:', JSON.stringify(phone, null, 2))
      throw new Error(`API response doesn't match PhoneResponse interface: ${error.message}`)
    }
  })

  it('should update phone using data provider', async () => {
    const testData: UpdatePhone = zUpdatePhone.parse({
      phone_number: '5551234567',
      phone_type: 'Secondary',
      release_status: 'public',
      contact_id: 1
    })

    const result = await ocotilloDataProvider.update({
      resource: 'contact/phone',
      id: 1,
      variables: testData
    })

    expect(result).toHaveProperty('data')

    const updatedPhone = result.data as PhoneResponse

    // Validate against schema
    try {
      const validatedPhone = zPhoneResponse.parse(updatedPhone)
      expect(validatedPhone).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Phone data:', JSON.stringify(updatedPhone, null, 2))
      throw new Error(`API response doesn't match PhoneResponse interface: ${error.message}`)
    }
  })

  it('should fetch address by ID using data provider', async () => {
    const result = await ocotilloDataProvider.getOne({
      resource: 'contact/address',
      id: 1,
      meta: {}
    })

    expect(result).toHaveProperty('data')

    const address = result.data as AddressResponse

    // Validate against schema
    try {
      const validatedAddress = zAddressResponse.parse(address)
      expect(validatedAddress).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Address data:', JSON.stringify(address, null, 2))
      throw new Error(`API response doesn't match AddressResponse interface: ${error.message}`)
    }
  })

  it('should update address using data provider', async () => {
    const testData: UpdateAddress = zUpdateAddress.parse({
      address_line_1: 'Updated Test Address Line 1',
      address_line_2: 'Updated Test Address Line 2',
      city: 'Updated Test City',
      state: 'Updated Test State',
      postal_code: '12345',
      country: 'United States',
      address_type: 'Secondary',
      release_status: 'public',
      contact_id: 1
    })

    const result = await ocotilloDataProvider.update({
      resource: 'contact/address',
      id: 1,
      variables: testData
    })

    expect(result).toHaveProperty('data')

    const updatedAddress = result.data as AddressResponse

    // Validate against schema
    try {
      const validatedAddress = zAddressResponse.parse(updatedAddress)
      expect(validatedAddress).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Address data:', JSON.stringify(updatedAddress, null, 2))
      throw new Error(`API response doesn't match AddressResponse interface: ${error.message}`)
    }
  })
})