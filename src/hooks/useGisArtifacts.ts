import { useQuery } from '@tanstack/react-query'
import { fetcher } from '@/providers/ocotillo-data-provider'
import { type GisCatalog, zGisCatalog } from '@/utils/gisArtifacts'

/**
 * Fetches the desktop-GIS artifact catalogue.
 *
 * `?f=json` is passed explicitly: `/gis` is content-negotiated and serves an
 * HTML landing page by default, so relying on the Accept header risks parsing
 * HTML as JSON.
 *
 * The catalogue is generated per request from live config, so it is not cached
 * hard — a deploy that moves environments must not keep serving stale hrefs.
 */
export const useGisArtifacts = (options?: { enabled?: boolean }) =>
  useQuery<GisCatalog>({
    queryKey: ['gis-artifact-catalog'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const response = await fetcher('gis?f=json')
      return zGisCatalog.parse(response.data)
    },
  })
