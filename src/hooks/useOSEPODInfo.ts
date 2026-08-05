import { useQuery } from '@tanstack/react-query'
import type { OSEPODAttributes } from '@/utils/osePodSummary'

const OSE_POD_QUERY_URL =
  'https://services2.arcgis.com/qXZbWTdPDbTjl7Dy/arcgis/rest/services/OSE_Points_of_Diversion/FeatureServer/0/query'

// Queries the OSE Points of Diversion feature service for one POD's attributes.
const fetchPOD = async (pod_id: string): Promise<OSEPODAttributes | null> => {
  const url = new URL(OSE_POD_QUERY_URL)
  url.search = new URLSearchParams({
    // Single quotes are doubled so they cannot break out of the where clause.
    where: `db_file='${pod_id.replace(/'/g, "''")}'`,
    f: 'pjson',
    outFields: '*',
    outSR: '4326',
  }).toString()

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`OSE POD request failed with status ${res.status}`)
  }

  const data = await res.json()
  // ArcGIS reports query failures in the body with a 200 status, so check explicitly.
  if (data?.error) {
    throw new Error(data.error.message ?? 'OSE POD request failed')
  }

  return (data?.features?.[0]?.attributes as OSEPODAttributes) ?? null
}

// React Query hook used by OSEPODInfoCard; skips fetch when pod_id is missing or "N/A".
export const useOSEPODInfo = (pod_id: string) => {
  const normalizedPodId = pod_id?.trim()
  const hasValidPodId = Boolean(normalizedPodId) && normalizedPodId !== 'N/A'

  return useQuery({
    queryKey: ['osepod', normalizedPodId],
    queryFn: () => fetchPOD(normalizedPodId),
    enabled: hasValidPodId,
    staleTime: 5 * 60 * 1000, // matches the other well-show queries
    gcTime: 10 * 60 * 1000,
  })
}
