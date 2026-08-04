import { cypressCheck } from './utils/CypressCheck'

const getNodeEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env) return process.env[key]
  return undefined
}

const isCypress = cypressCheck()
const isVitest =
  getNodeEnv('VITEST') === 'true' || import.meta.env.VITEST === 'true'
const isTest =
  getNodeEnv('NODE_ENV') === 'test' ||
  import.meta.env.MODE === 'test' ||
  import.meta.env.NODE_ENV === 'test'

export const settings = {
  rowHeight: 27,
  filterDebounceMs: 1000,
  urlprefix: import.meta.env.VITE_URLPREFIX || '',

  nmbgmr_amp_api_url:
    import.meta.env.VITE_NMBGMR_AMP_API_URL || 'http://localhost:8009',

  ocotillo_api_url:
    isVitest || (isTest && !isCypress)
      ? 'http://127.0.0.1:4010' // mock server for Vitest
      : isCypress
        ? 'http://localhost:8000' // real CI local FastAPI backend for Cypress
        : import.meta.env.VITE_OCOTILLO_API_URL || 'http://localhost:8000',
  usgs_nwis_ogc_api_url:
    import.meta.env.VITE_USGS_NWIS_OGC_API_URL ||
    'https://api.waterdata.usgs.gov/ogcapi/v0',

  st2_url: 'https://st2.newmexicowaterdata.org/FROST-Server/v1.1',
  nmbgmr_geothermal_api_url:
    import.meta.env.VITE_NMBGMR_GEOTHERMAL_API_URL || 'http://localhost:8000',
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN || '',
  fief: {
    baseURL:
      import.meta.env.VITE_FIEF_BASE_URL ||
      'https://fief.newmexicowaterdata.org',
    clientId: import.meta.env.VITE_FIEF_CLIENT_ID,
  },
}
