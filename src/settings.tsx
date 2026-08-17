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

const ocotillo_api_url =
  isVitest || (isTest && !isCypress)
    ? 'http://127.0.0.1:4010' // mock server for Vitest
    : isCypress
      ? 'http://localhost:8000' // real CI local FastAPI backend for Cypress
      : import.meta.env.VITE_OCOTILLO_API_URL || 'http://localhost:8000'

export const settings = {
  rowHeight: 27,
  filterDebounceMs: 1000,
  urlprefix: import.meta.env.VITE_URLPREFIX || '',

  nmbgmr_amp_api_url:
    import.meta.env.VITE_NMBGMR_AMP_API_URL || 'http://localhost:8009',

  ocotillo_api_url,
  usgs_nwis_ogc_api_url:
    import.meta.env.VITE_USGS_NWIS_OGC_API_URL ||
    'https://api.waterdata.usgs.gov/ogcapi/v0',

  st2_url: 'https://st2.newmexicowaterdata.org/FROST-Server/v1.1',
  diverhub: {
    // Diver-HUB (VanEssen GroundwaterOnline) web API. The published swagger
    // declares no security scheme; if a key is provided it is sent as a
    // bearer token.
    api_url:
      import.meta.env.VITE_DIVERHUB_API_URL || 'https://diver-hub.com/api',
    api_key: import.meta.env.VITE_DIVERHUB_API_KEY || '',
  },
  wellntel: {
    // Direct Wellntel analytics API access, ported from wellpy. A
    // browser-held key is interim parity with wellpy's client-side key; the
    // upload contract proposes moving this behind an Ocotillo proxy
    // (GET /wellntel/readings), at which point api_url points there instead.
    api_url:
      import.meta.env.VITE_WELLNTEL_API_URL ||
      'https://connect.wellntel.com/analytics-api',
    api_key: import.meta.env.VITE_WELLNTEL_API_KEY || '',
  },
  // Geothermal endpoints live on the Ocotillo (water data) API — same host, no
  // separate env var.
  nmbgmr_geothermal_api_url: ocotillo_api_url,
  fief: {
    baseURL:
      import.meta.env.VITE_FIEF_BASE_URL ||
      'https://fief.newmexicowaterdata.org',
    clientId: import.meta.env.VITE_FIEF_CLIENT_ID,
  },
}
