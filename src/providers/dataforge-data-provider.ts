import type { DataProvider } from '@refinedev/core'
import { getAccessToken } from './fief-provider'
import { settings } from '@/settings'

const API_URL = `${settings.dataforge_api_url}`

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import createAuthRefreshInterceptor from 'axios-auth-refresh'

export const axiosInstance: AxiosInstance = axios.create()

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken()
    config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

const refreshAuthLogic = async (failedRequest) => {
  const token = getAccessToken(true)
  failedRequest.response.config.headers['Authorization'] = 'Bearer ' + token
  return Promise.resolve()
}

createAuthRefreshInterceptor(axiosInstance, refreshAuthLogic)

export const fetcher = async (url: string, config?: AxiosRequestConfig) => {
  config = config || {}
  config['method'] = 'GET'
  return axiosCall(url, config)
}

export const axiosCall = async (url: string, options: AxiosRequestConfig) => {
  const config = { url: `${API_URL}/${url}`, ...options }
  return axiosInstance(config)
}

const cleanResourceName = (resource: string) => {
  resource = resource.replace(/^dataforge\./, '')
  if (resource.startsWith('thing-')) {
    resource = resource.replace(/^thing-/, 'thing/')
  }

  // if (resource === 'wellthing') {
  //   resource = 'thing/well'
  // }
  return resource
}
export const dataForgeDataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters, meta }) => {
    const params = new URLSearchParams()
    resource = cleanResourceName(resource)

    if (meta?.enabled === false) {
      return {
        data: [],
        total: 0,
      }
    }

    if (meta?.params !== undefined) {
      Object.entries(meta['params']).forEach(([key, value]) => {
        if (value === null || value === undefined) return
        if (typeof value === 'object') {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, String(v)))
          } else {
            params.append(key, JSON.stringify(value))
          }
          return
        }

        params.append(key, String(value))
      })
    }

    if (pagination) {
      params.append('page', pagination.current.toString())
      params.append('size', pagination.pageSize.toString())
    }

    if (sorters && sorters.length > 0) {
      params.append('sort', sorters.map((sorter) => sorter.field).join(','))
      params.append('order', sorters.map((sorter) => sorter.order).join(','))
    }

    if (filters && filters.length > 0) {
      filters.forEach((filter) => {
        params.append('filter', JSON.stringify(filter))
      })
    }

    let url: string = resource

    // const response = await fetcher(`${url}?${params.toString()}`)
    const response = await axiosCall(url, {
      params: params,
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (response.status < 200 || response.status > 299) throw response

    let data = await response.data

    return {
      data: data.items,
      total: data.total,
    }
  },
  getMany: async ({ resource, ids, meta }) => {
    const params = new URLSearchParams()

    if (ids) {
      ids.forEach((id) => params.append('id', id.toString()))
    }

    const response = await fetcher(`${resource}?${params.toString()}`)

    if (response.status < 200 || response.status > 299) throw response

    return await response.data
  },
  getOne: async ({ resource, id, meta }) => {
    resource = cleanResourceName(resource)
    /**
     * for 'things' use a query parameter structure ?thing_id=123
     * same for well things, spring things, etc.
     */
    if (
      resource === 'thing' ||
      resource === 'thing/well' ||
      resource === 'thing/spring'
    ) {
      const params = new URLSearchParams()
      params.append('thing_id', id.toString())
      let url: string = `thing?${params.toString()}`
      const response = await fetcher(url, meta.requestConfig)

      if (response.status < 200 || response.status > 299) throw response

      const responseData = await response.data

      // Handle the response structure with items array for things
      const record = responseData?.items?.[0] || responseData
      return { data: record }
    }

    /**
     * for other resources, use path parameter structure /location/123
     */

    let url =
      id === undefined || id === null ? `${resource}` : `${resource}/${id}`

    const response = await fetcher(url, meta.requestConfig)

    if (response.status < 200 || response.status > 299) throw response

    const data = await response.data
    return { data }
  },
  create: async ({ resource, variables }) => {
    resource = cleanResourceName(resource)

    const response = await axiosCall(`${resource}`, {
      method: 'POST',
      data: JSON.stringify(variables),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.status < 200 || response.status > 299) throw response

    const data = await response.data

    return { data }
  },
  custom: async ({ url, method, payload, headers }) => {
    const config: AxiosRequestConfig = {
      url: `${API_URL}/${url}`,
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }

    if (payload) {
      config.data = payload
    }

    const response = await axiosInstance(config)

    if (response.status < 200 || response.status > 299) throw response

    return { data: response.data }
  },
  update: async ({ resource, id, variables }) => {
    resource = cleanResourceName(resource)

    /**
     * for 'things' use path parameter structure for PATCH /thing/123
     * same for well things, spring things, etc.
     */
    if (
      resource === 'thing' ||
      resource === 'thing/well' ||
      resource === 'thing/spring'
    ) {
      const response = await axiosCall(`thing/${id}`, {
        method: 'PATCH',
        data: JSON.stringify(variables),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.status < 200 || response.status > 299) throw response

      const data = await response.data

      return { data }
    }

    /**
     * for other resources, use path parameter structure PATCH /location/123
     */
    const response = await axiosCall(`${resource}/${id}`, {
      method: 'PATCH',
      data: JSON.stringify(variables),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.status < 200 || response.status > 299) throw response

    const data = await response.data

    return { data }
  },
  getApiUrl: () => API_URL,
  deleteOne: () => {
    throw new Error('Not implemented')
  },
}
