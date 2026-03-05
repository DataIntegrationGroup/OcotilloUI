import type { DataProvider } from '@refinedev/core'
import type { AxiosRequestConfig } from 'axios'
import { settings } from '@/settings'
import { axiosCall, fetcher } from '@/providers/ocotillo-data-provider'

const API_URL = settings.ocotillo_api_url

type ParamsRecord = Record<string, string | number | boolean | null | undefined>

const toParamsRecord = (params: unknown): ParamsRecord => {
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    return {}
  }

  return { ...(params as ParamsRecord) }
}

const getOgcPath = (collection?: string, fid?: string | number) => {
  if (!collection) return 'ogcapi/collections'
  const encodedCollection = encodeURIComponent(collection)
  if (fid === undefined || fid === null) {
    return `ogcapi/collections/${encodedCollection}/items`
  }

  return `ogcapi/collections/${encodedCollection}/items/${fid}`
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

export const ogcapiDataProvider: DataProvider = {
  getList: async ({ resource, pagination, meta }) => {
    if (resource !== 'ogcapi' && resource !== 'ocotillo.ogcapi') {
      throw new Error(`Unsupported OGC API resource: ${resource}`)
    }

    const requestConfig: AxiosRequestConfig = { ...(meta?.requestConfig ?? {}) }
    const params = toParamsRecord(requestConfig.params)
    const collection = String(params.collection ?? params.collection_id ?? '')

    delete params.collection
    delete params.collection_id

    if (pagination) {
      params.limit = pagination.pageSize
      params.offset = (pagination.current - 1) * pagination.pageSize
    }

    requestConfig.params = params

    const response = await fetcher(getOgcPath(collection), requestConfig)

    if (response.status < 200 || response.status > 299) throw response

    return normalizeOgcListResponse(response.data)
  },
  getOne: async ({ resource, id, meta }) => {
    if (resource !== 'ogcapi' && resource !== 'ocotillo.ogcapi') {
      throw new Error(`Unsupported OGC API resource: ${resource}`)
    }

    const requestConfig: AxiosRequestConfig = { ...(meta?.requestConfig ?? {}) }
    const params = toParamsRecord(requestConfig.params)
    const collection = String(params.collection ?? params.collection_id ?? '')

    delete params.collection
    delete params.collection_id

    requestConfig.params = params

    const response = await fetcher(
      getOgcPath(collection, id === null ? undefined : id),
      requestConfig
    )

    if (response.status < 200 || response.status > 299) throw response

    return { data: response.data }
  },
  custom: async ({ url, method, payload, headers }) => {
    const response = await axiosCall(url, {
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
  getApiUrl: () => API_URL,
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
}
