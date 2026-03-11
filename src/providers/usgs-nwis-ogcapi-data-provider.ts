import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'
import { settings } from '@/settings'
import { createOgcapiDataProvider } from './create-ogcapi-data-provider'

const API_URL = settings.usgs_nwis_ogc_api_url

// Approximate 50-mile buffer around the New Mexico state bbox.
const NEW_MEXICO_BUFFERED_BBOX = '-109.97,30.58,-102.03,37.82'

const fetchFromUsgsOgc = async (url: string, config?: AxiosRequestConfig) =>
  axios({
    url: `${API_URL}/${url}`,
    method: config?.method || 'GET',
    ...config,
  })

export const usgsNwisOgcapiDataProvider = createOgcapiDataProvider({
  supportedResources: ['usgs-nwis-ogcapi'],
  apiUrl: API_URL,
  defaultCollectionParams: {
    // NOTE: Do not force bbox globally. Some NWIS collections have no geometry and
    // return 400 when bbox is provided.
    f: 'json',
  },
  request: fetchFromUsgsOgc,
})

export const USGS_NWIS_DEFAULT_BBOX = NEW_MEXICO_BUFFERED_BBOX
