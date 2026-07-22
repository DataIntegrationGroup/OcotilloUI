import { describe, it, expect } from 'vitest'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import {
  zAssetResponse,
  zCreateAsset,
  zUpdateAsset
} from '@/generated/zod.gen'
import {
  AssetResponse,
  CreateAsset,
  UpdateAsset
} from '@/generated/types.gen'

describe('Ocotillo Integration Tests: Asset', () => {

  it('should fetch assets using data provider', async () => {
    const result = await ocotilloDataProvider.getList({
      resource: 'asset',
      pagination: { currentPage: 1, pageSize: 10 }
    })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)

    if (result.data.length > 0) {
      const asset = result.data[0] as AssetResponse

      // Validate against schema
      try {
        const validatedAsset = zAssetResponse.parse(asset)
        expect(validatedAsset).toBeDefined()
      } catch (error) {
        console.error('Schema validation failed:', getErrorMessage(error))
        console.error('Asset data:', JSON.stringify(asset, null, 2))
        throw new Error(`API response doesn't match IAsset interface: ${getErrorMessage(error)}`)
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

  const asset = result.data as AssetResponse

  // Validate against schema
  try {
    const validatedAsset = zAssetResponse.parse(asset)
    expect(validatedAsset).toBeDefined()
  } catch (error) {
    console.error('Schema validation failed:', getErrorMessage(error))
    console.error('Asset data:', JSON.stringify(asset, null, 2))
    throw new Error(`API response doesn't match IAsset interface: ${getErrorMessage(error)}`)
  }
  })

  it('should create asset using data provider', async () => {
    const testData: CreateAsset = zCreateAsset.parse({
      label: 'Test Asset Label',
      name: 'Test Asset',
      storage_path: '/test/path/asset.txt',
      release_status: 'public',
      mime_type: 'text/plain',
      size: 1024,
      thing_id: 1,
      uri: 'https://example.com/test-asset.txt'
    })
    const result = await ocotilloDataProvider.create({
      resource: 'asset',
      variables: testData
    })

    expect(result).toHaveProperty('data')

    const createdAsset = result.data as AssetResponse

    // Validate against schema
    try {
      const validatedAsset = zAssetResponse.parse(createdAsset)
      expect(validatedAsset).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', getErrorMessage(error))
      console.error('Asset data:', JSON.stringify(createdAsset, null, 2))
      throw new Error(`API response doesn't match IAsset interface: ${getErrorMessage(error)}`)
    }
  })

  it.skip('should update asset using data provider', async () => {
    const testData: UpdateAsset = zUpdateAsset.parse({
      label: 'Updated Test Asset Label',
      name: 'Updated Test Asset',
      release_status: 'public',
    })

    const result = await ocotilloDataProvider.update({
      resource: 'asset',
      id: 1,
      variables: testData
    })

    expect(result).toHaveProperty('data')

    const updatedAsset = result.data as AssetResponse

    // Validate against schema
    try {
      const validatedAsset = zAssetResponse.parse(updatedAsset)
      expect(validatedAsset).toBeDefined()
    } catch (error) {
      console.error('Schema validation failed:', getErrorMessage(error))
      console.error('Asset data:', JSON.stringify(updatedAsset, null, 2))
      throw new Error(`API response doesn't match IAsset interface: ${getErrorMessage(error)}`)
    }
  })
})