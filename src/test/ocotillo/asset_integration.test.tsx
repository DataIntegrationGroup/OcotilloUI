import { describe, it, expect, beforeEach } from 'vitest'
import { AssetSchema } from '@/pages/ocotillo/asset/schema'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import { delay } from '@/test/delay'
import { IAsset } from '@/interfaces/ocotillo/IAsset'

describe('Ocotillo Integration Tests: Asset', () => {
  beforeEach(async () => {
    await delay(100)
  })

  it('should fetch assets using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'asset',
      pagination: { current: 1, pageSize: 10 }
    })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)

    if (result.data.length > 0) {
      const asset = result.data[0] as IAsset

      // Validate against schema
      try {
        const validatedAsset = await AssetSchema.validate(asset, { strict: true })
        expect(validatedAsset).toBeDefined()
      } catch (error) {
        console.error('Schema validation failed:', error.message)
        console.error('Asset data:', JSON.stringify(asset, null, 2))
        throw new Error(`API response doesn't match IAsset interface: ${error.message}`)
      }
    }
  })

  it('should fetch single asset by ID using data provider', async () => {
    const result = await ocotilloDataProvider.getOne({
      resource: 'asset',
      id: 1,
      meta: {}
    })

  expect(result).toHaveProperty('data')

  const asset = result.data as IAsset

  // Validate against schema
  try {
    const validatedAsset = await AssetSchema.validate(asset, { strict: true })
    expect(validatedAsset).toBeDefined()
  } catch (error) {
    console.error('Schema validation failed:', error.message)
    console.error('Asset data:', JSON.stringify(asset, null, 2))
    throw new Error(`API response doesn't match IAsset interface: ${error.message}`)
  }
  })

  it('should create asset using data provider', async () => {
    const result = await ocotilloDataProvider.create({
      resource: 'asset',
      variables: {
        label: 'Test Asset Label',
        name: 'Test Asset',
        storage_path: '/test/path/asset.txt',
        storage_service: 'local',
        release_status: 'public',
        mime_type: 'text/plain',
        size: 1024,
        file: null,
        thing_id: null,
        uri: 'https://example.com/test-asset.txt',
        signed_url: 'https://example.com/signed/test-asset.txt'
      }
    })

    expect(result).toHaveProperty('data')

    const createdAsset = result.data as IAsset

    // Validate against schema
    try {
      const validatedAsset = await AssetSchema.validate(createdAsset, { strict: true })
      expect(validatedAsset).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', error.message)
      console.error('Asset data:', JSON.stringify(createdAsset, null, 2))
      throw new Error(`API response doesn't match IAsset interface: ${error.message}`)
    }
  })
})