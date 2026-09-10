import { describe, expect, it, vi } from 'vitest'
import { createOgcapiDataProvider } from '@/providers/create-ogcapi-data-provider'

/**
 * The internal provider is the shared factory pointed at a different mount, so
 * what is worth pinning is that the mount reaches the request untouched and
 * that the public resource name cannot be served by it.
 */
const createInternalProvider = () => {
  const request = vi.fn(async (_url: string, _config?: unknown) => ({
    status: 200,
    data: { collections: [{ id: 'staff_only_wells' }] },
  }))

  const provider = createOgcapiDataProvider({
    supportedResources: ['ogcapi-internal', 'ocotillo.ogcapi-internal'],
    apiUrl: 'https://example.test',
    collectionsPathPrefix: 'ogcapi-internal',
    request,
  })

  return { provider, request }
}

describe('the internal OGC data provider', () => {
  it('lists collections off the internal mount', async () => {
    const { provider, request } = createInternalProvider()

    const result = await provider.getList({ resource: 'ogcapi-internal' })

    const [url] = request.mock.calls[0]
    expect(url).toBe('ogcapi-internal/collections')
    expect(result.data).toEqual([{ id: 'staff_only_wells' }])
    expect(result.total).toBe(1)
  })

  it('builds item paths under the internal mount', async () => {
    const { provider, request } = createInternalProvider()

    await provider.getList({
      resource: 'ogcapi-internal',
      meta: { requestConfig: { params: { collection: 'staff_only_wells' } } },
    })

    const [url] = request.mock.calls[0]
    expect(url).toBe('ogcapi-internal/collections/staff_only_wells/items')
  })

  it('refuses the public resource name', async () => {
    const { provider } = createInternalProvider()

    await expect(provider.getList({ resource: 'ogcapi' })).rejects.toThrow(
      /Unsupported OGC API resource/
    )
  })
})
