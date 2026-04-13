import { settings } from '@/settings'
import { axiosCall, fetcher } from '@/providers/ocotillo-data-provider'
import { createOgcapiDataProvider } from './create-ogcapi-data-provider'

const API_URL = settings.ocotillo_api_url

export const ogcapiDataProvider = createOgcapiDataProvider({
  supportedResources: ['ogcapi', 'ocotillo.ogcapi'],
  apiUrl: API_URL,
  collectionsPathPrefix: 'ogcapi',
  request: (url, config) => {
    if (config?.method && config.method !== 'GET') {
      return axiosCall(url, config)
    }

    return fetcher(url, config)
  },
})
