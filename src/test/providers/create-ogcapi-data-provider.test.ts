import { describe, expect, it, vi } from 'vitest'
import { createOgcapiDataProvider } from '@/providers/create-ogcapi-data-provider'

const COLLECTION = 'water_wells'
const FEATURE_ID = 'NM-12345'

const createTestProvider = () => {
  const request = vi.fn(
    async (_url: string, _config?: unknown) => ({
      status: 200,
      data: { type: 'FeatureCollection', features: [] },
    })
  )

  const provider = createOgcapiDataProvider({
    supportedResources: ['ogcapi'],
    apiUrl: 'https://example.test',
    collectionsPathPrefix: 'ogcapi',
    request,
  })

  return { provider, request }
}

const collectionListMeta = {
  requestConfig: {
    params: {
      collection: COLLECTION,
      f: 'json',
      limit: 1000,
      offset: 0,
    },
  },
}

describe('createOgcapiDataProvider getOne collection paths', () => {
  it('requests .../items?f=json when id is an empty string', async () => {
    const { provider, request } = createTestProvider()

    await provider.getOne({
      resource: 'ogcapi',
      id: '',
      meta: collectionListMeta,
    })

    expect(request).toHaveBeenCalledOnce()
    const [url] = request.mock.calls[0]
    expect(url).toBe(`ogcapi/collections/${COLLECTION}/items`)
    expect(url).not.toMatch(/\/items\/$/)
  })

  it('requests .../items?f=json when id is null', async () => {
    const { provider, request } = createTestProvider()

    await provider.getOne({
      resource: 'ogcapi',
      id: null as unknown as string,
      meta: collectionListMeta,
    })

    expect(request).toHaveBeenCalledOnce()
    const [url] = request.mock.calls[0]
    expect(url).toBe(`ogcapi/collections/${COLLECTION}/items`)
    expect(url).not.toMatch(/\/items\/$/)
  })

  it('requests .../items/{fid} when id is a feature id', async () => {
    const { provider, request } = createTestProvider()

    await provider.getOne({
      resource: 'ogcapi',
      id: FEATURE_ID,
      meta: collectionListMeta,
    })

    expect(request).toHaveBeenCalledOnce()
    const [url] = request.mock.calls[0]
    expect(url).toBe(`ogcapi/collections/${COLLECTION}/items/${FEATURE_ID}`)
  })
})
