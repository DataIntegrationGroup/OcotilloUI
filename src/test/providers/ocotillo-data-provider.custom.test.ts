import type { InternalAxiosRequestConfig } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/providers/authentik-provider', () => ({
  getAccessToken: vi.fn(async () => 'test-token'),
}))

import {
  axiosInstance,
  ocotilloDataProvider,
} from '@/providers/ocotillo-data-provider'

// Stands in for the network, keeping the config the provider built.
let sent: InternalAxiosRequestConfig | null = null
const originalAdapter = axiosInstance.defaults.adapter

const stubNetwork = () => {
  sent = null
  axiosInstance.defaults.adapter = async (config) => {
    sent = config
    return {
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }
}

afterEach(() => {
  axiosInstance.defaults.adapter = originalAdapter
})

describe('ocotilloDataProvider.custom', () => {
  it('hands a caller’s upload progress callback to the request', async () => {
    stubNetwork()
    const onUploadProgress = vi.fn()

    await ocotilloDataProvider.custom!({
      url: 'observation/transducer-groundwater-level/block',
      method: 'post',
      payload: { measurements: [] },
      meta: { onUploadProgress },
    })

    expect(sent?.onUploadProgress).toBe(onUploadProgress)
    expect(sent?.url).toMatch(
      /\/observation\/transducer-groundwater-level\/block$/
    )
  })

  it('sends no progress callback when the caller gives none', async () => {
    stubNetwork()

    await ocotilloDataProvider.custom!({
      url: 'observation/transducer-groundwater-level',
      method: 'delete',
    })

    expect(sent?.onUploadProgress).toBeUndefined()
  })

  it('ignores a meta value that is not a function', async () => {
    stubNetwork()

    await ocotilloDataProvider.custom!({
      url: 'thing',
      method: 'get',
      meta: { onUploadProgress: 'not a function' },
    })

    expect(sent?.onUploadProgress).toBeUndefined()
  })
})
