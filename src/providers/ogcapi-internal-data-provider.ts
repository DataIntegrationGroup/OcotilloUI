import { axiosCall, fetcher } from '@/providers/ocotillo-data-provider'
import { settings } from '@/settings'
import { createOgcapiDataProvider } from './create-ogcapi-data-provider'

const API_URL = settings.ocotillo_api_url

/**
 * The internal OGC API mount. Same shape as `/ogcapi`, different catalogue:
 * it carries the collections that are not published to the public service.
 *
 * Reaching it needs the `OGC.Internal` group — see `canViewOgcInternal` in
 * `src/utils/accessControl.ts`, which gates the only page that asks for it.
 */
export const ogcapiInternalDataProvider = createOgcapiDataProvider({
  supportedResources: ['ogcapi-internal', 'ocotillo.ogcapi-internal'],
  apiUrl: API_URL,
  collectionsPathPrefix: 'ogcapi-internal',
  request: (url, config) => {
    if (config?.method && config.method !== 'GET') {
      return axiosCall(url, config)
    }

    return fetcher(url, config)
  },
})
