import type { DataProvider } from '@refinedev/core'
import { settings } from '@/settings'

const API_URL = process.env.NODE_ENV === 'test' 
  ? 'http://localhost:8000'  // test against local or CI API
  : `${settings.ocotillo_api_url}`

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import createAuthRefreshInterceptor from 'axios-auth-refresh'
import { getAccessToken } from '@/providers/authentik-provider'
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
  const token = await getAccessToken(true)
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
  resource = resource.replace(/^ocotillo\./, '')
  if (resource.startsWith('thing-')) {
    resource = resource.replace(/^thing-/, 'thing/')
  }

  // if (resource === 'wellthing') {
  //   resource = 'thing/well'
  // }
  return resource
}
export const ocotilloDataProvider: DataProvider = {
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
  getMany: async ({ resource, ids }) => {
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
     * for 'things' use path parameter structure /thing/123
     * same for well things, spring things, etc.
     */
    if (
      resource === 'thing' ||
      resource === 'thing/well' ||
      resource === 'thing/spring'
    ) {
      let url: string = `thing/${id}`
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
    //console.log('asdfs', resource)
    resource = cleanResourceName(resource)

    try {
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
    } catch (error) {
      // Transform Pydantic validation errors to Refine format
      if ((error.response?.status === 422 || error.response?.status === 409) && error.response?.data?.detail) {
        const pydanticErrors = error.response.data.detail
        const refinedErrors: Record<string, string[]> = {}
        
        //@TODO: this does not handle cross field validation errors
        // i.e. screen top and bottom must be together, top greater than bottom etc.
        pydanticErrors.forEach((issue: any) => {
          const fieldPath = issue.loc.join('.') 
          const cleanFieldPath = fieldPath.startsWith('body.') 
            ? fieldPath.substring(5) 
            : fieldPath
          if (cleanFieldPath) {
            if (!refinedErrors[cleanFieldPath]) {
              refinedErrors[cleanFieldPath] = []
            }
            refinedErrors[cleanFieldPath].push(issue.msg)
          }
        })
        
        const transformedError = new Error('Validation Error')
        ;(transformedError as any).status = error.response.status
        ;(transformedError as any).errors = refinedErrors
        ;(transformedError as any).fieldErrors = refinedErrors
        
        throw transformedError
      }
      
      throw error
    }
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

    try {
      /**
       * custom patch endpoint for water well things
       * spring things, well-screen things, id-link things use default resource name patch endpoint
       * TODO: Rename thing/well resources to thing/water-well to reduce custom code
       */
      // for water wells:
      if (
        resource === 'thing/well'
      ) {
        let endpoint = `thing/water-well/${id}`
        
        const response = await axiosCall(endpoint, {
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
    } catch (error) {
      // Transform Pydantic validation errors to Refine format
      if ((error.response?.status === 422 || error.response?.status === 409) && error.response?.data?.detail) {
        const pydanticErrors = error.response.data.detail
        const refinedErrors: Record<string, string[]> = {}
        
        pydanticErrors.forEach((issue: any) => {
          const fieldPath = issue.loc.join('.') 
          const cleanFieldPath = fieldPath.startsWith('body.') 
            ? fieldPath.substring(5) 
            : fieldPath
          if (cleanFieldPath) {
            if (!refinedErrors[cleanFieldPath]) {
              refinedErrors[cleanFieldPath] = []
            }
            refinedErrors[cleanFieldPath].push(issue.msg)
          }
        })
        
        const transformedError = new Error('Validation Error')
        ;(transformedError as any).status = error.response.status
        ;(transformedError as any).errors = refinedErrors
        ;(transformedError as any).fieldErrors = refinedErrors
        
        throw transformedError
      }
      
      throw error
    }
  },
  getApiUrl: () => API_URL,
  deleteOne: () => {
    throw new Error('Not implemented')
  },
}
