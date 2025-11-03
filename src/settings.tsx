import { cypressCheck } from './utils/CypressCheck'

export const settings = {
  rowHeight: 27,
  filterDebounceMs: 1000,
  urlprefix: import.meta.env.VITE_URLPREFIX || '',

  nmbgmr_amp_api_url:
    import.meta.env.VITE_NMBGMR_AMP_API_URL || 'http://localhost:8009',

  ocotillo_api_url:
    cypressCheck() || process.env.NODE_ENV === 'test'
      ? 'http://localhost:8000'
      : import.meta.env.VITE_OCOTILLO_API_URL || 'http://localhost:8000',

  st2_url: 'https://st2.newmexicowaterdata.org/FROST-Server/v1.1',
  nmbgmr_geothermal_api_url:
    import.meta.env.VITE_NMBGMR_GEOTHERMAL_API_URL || 'http://localhost:8008',
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN || '',
  fief: {
    baseURL:
      import.meta.env.VITE_FIEF_BASE_URL ||
      'https://fief.newmexicowaterdata.org',
    clientId: import.meta.env.VITE_FIEF_CLIENT_ID,
  },
}
