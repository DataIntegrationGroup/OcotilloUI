import type { DataProvider } from '@refinedev/core'
import type { AxiosRequestConfig } from 'axios'

type ParamsRecord = Record<string, string | number | boolean | null | undefined>

type OgcApiRequest = (
  url: string,
  config?: AxiosRequestConfig
) => Promise<{ status: number; data: any }>

const toParamsRecord = (params: unknown): ParamsRecord => {
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    return {}
  }

  return { ...(params as ParamsRecord) }
}

const normalizeOgcListResponse = (payload: any) => {
  if (payload?.type === 'FeatureCollection' && Array.isArray(payload.features)) {
    return {
      data: payload.features,
      total:
        typeof payload.numberMatched === 'number'
          ? payload.numberMatched
          : payload.features.length,
    }
  }

  if (Array.isArray(payload?.collections)) {
    return {
      data: payload.collections,
      total: payload.collections.length,
    }
  }

  if (Array.isArray(payload?.items)) {
    return {
      data: payload.items,
      total:
        typeof payload.total === 'number' ? payload.total : payload.items.length,
    }
  }

  return {
    data: [],
    total: 0,
  }
}

const getOgcPath = ({
  collection,
  fid,
  collectionsPathPrefix,
}: {
  collection?: string
  fid?: string | number
  collectionsPathPrefix: string
}) => {
  const basePath = [collectionsPathPrefix, 'collections']
    .filter(Boolean)
    .join('/')

  if (!collection) return basePath
  const encodedCollection = encodeURIComponent(collection)
  if (fid === undefined || fid === null || fid === '') {
    return `${basePath}/${encodedCollection}/items`
  }

  return `${basePath}/${encodedCollection}/items/${fid}`
}

export const createOgcapiDataProvider = ({
  supportedResources,
  apiUrl,
  collectionsPathPrefix = '',
  defaultCollectionParams,
  request,
}: {
  supportedResources: string[]
  apiUrl: string
  collectionsPathPrefix?: string
  defaultCollectionParams?: Record<string, string | number | boolean>
  request: OgcApiRequest
}): DataProvider => ({
  getList: async ({ resource, pagination, meta }) => {
    if (!supportedResources.includes(resource)) {
      throw new Error(`Unsupported OGC API resource: ${resource}`)
    }

    const requestConfig: AxiosRequestConfig = { ...(meta?.requestConfig ?? {}) }
    const params = toParamsRecord(requestConfig.params)
    const collection = String(params.collection ?? params.collection_id ?? '')

    delete params.collection
    delete params.collection_id

    if (!collection && params.f === undefined && params.format === undefined) {
      params.f = 'json'
    }

    if (pagination) {
      params.limit = pagination.pageSize ?? 10
      params.offset = ((pagination.currentPage ?? 1) - 1) * (pagination.pageSize ?? 10)
    }

    if (collection && defaultCollectionParams) {
      Object.assign(params, defaultCollectionParams)
    }

    requestConfig.params = params

    const response = await request(
      getOgcPath({
        collection,
        collectionsPathPrefix,
      }),
      requestConfig
    )

    if (response.status < 200 || response.status > 299) throw response

    return normalizeOgcListResponse(response.data)
  },
  getOne: async ({ resource, id, meta }) => {
    if (!supportedResources.includes(resource)) {
      throw new Error(`Unsupported OGC API resource: ${resource}`)
    }

    const requestConfig: AxiosRequestConfig = { ...(meta?.requestConfig ?? {}) }
    const params = toParamsRecord(requestConfig.params)
    const collection = String(params.collection ?? params.collection_id ?? '')

    delete params.collection
    delete params.collection_id

    if (collection && defaultCollectionParams) {
      Object.assign(params, defaultCollectionParams)
    }

    requestConfig.params = params

    const response = await request(
      getOgcPath({
        collection,
        fid: id === null || id === '' ? undefined : id,
        collectionsPathPrefix,
      }),
      requestConfig
    )

    if (response.status < 200 || response.status > 299) throw response

    return { data: response.data }
  },
  custom: async ({ url, method, payload, headers }) => {
    const response = await request(url, {
      method: method || 'GET',
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    })

    if (response.status < 200 || response.status > 299) throw response

    return { data: response.data }
  },
  getApiUrl: () => apiUrl,
  getMany: () => {
    throw new Error('Not implemented')
  },
  create: () => {
    throw new Error('Not implemented')
  },
  update: () => {
    throw new Error('Not implemented')
  },
  deleteOne: () => {
    throw new Error('Not implemented')
  },
})
