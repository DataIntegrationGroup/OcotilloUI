import type { DataProvider } from '@refinedev/core'
import { getAccessToken } from './authentik-provider'
import { settings } from '@/settings'

const API_URL = `${settings.nmbgmr_amp_api_url}/latest`

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

const getPhotos = async (id) => {
  const response = await fetcher(`wells/photos?pointid=${id}`)
  if (response.status < 200 || response.status > 299) throw response

  const data = await response.data

  let photos = await Promise.all(
    data.map(async (photo) => {
      try {
        const resp = await fetcher(`wells/photo/${photo.OLEPath}`)

        return {
          key: photo.OLEPath,
          src: URL.createObjectURL(await resp.data),
          caption: photo.OLEPath,
        }
      } catch (e) {
        console.error('getPhoto error:', e)
        return {
          key: photo.OLEPath,
          src: '',
          caption: photo.OLEPath,
        }
      }
    })
  )

  return { data: photos }
}

export const ampDataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters, meta }) => {
    const params = new URLSearchParams()

    // strip off water. from resource name
    resource = resource.replace(/^water\./, '')

    if (meta?.params !== undefined) {
      Object.entries(meta['params']).forEach(([key, value]) => {
        if (value === null || value === undefined) return
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

    let url: string
    if (
      [
        'formations',
        'level_status',
        'measurement_method',
        'data_quality',
        'measuring_agency',
        'data_source',
      ].includes(resource)
    ) {
      url = `authorized/lookuptable/${resource}`
    } else if (['waterlevels/manual'].includes(resource)) {
      url = `${resource}`
    } else {
      url = `authorized/tabular/${resource}`
    }

    const response = await fetcher(`${url}?${params.toString()}`)

    if (response.status < 200 || response.status > 299) throw response

    let data
    let total
    if ('items' in response.data) {
      data = response.data.items
      total = response.data.total
    } else {
      data = response.data
      total = data.length
    }

    return {
      data,
      total,
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
    if (resource == 'photos') {
      return await getPhotos(id)
    }

    let url
    if (resource == 'dashboard') {
      url = `authorized/tabular/dashboard`
    } else {
      url = `authorized/tabular/${resource}/${id}`
    }

    const response = await fetcher(url)

    if (response.status < 200 || response.status > 299) throw response

    const data = await response.data
    return { data }
  },
  create: async ({ resource, variables }) => {
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
  update: async ({ resource, id, variables }) => {
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
