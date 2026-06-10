import { useQuery } from '@tanstack/react-query'

const fetchPOD = async (pod_id: string) => {
  const url = `https://services2.arcgis.com/qXZbWTdPDbTjl7Dy/arcgis/rest/services/OSE_Points_of_Diversion/FeatureServer/0/query?where=+db_file%3D%27${encodeURIComponent(pod_id)}%27&f=pjson&outFields=*&outSR=4326`
  const res = await fetch(url)
  const data = await res.json()
  if (data.features && data.features.length > 0) {
    const attributes = data.features[0].attributes
    const newRows = Object.keys(attributes).map((key, index) => ({
      id: index,
      name: key,
      value: attributes[key],
    }))
    return newRows
  }
  return []
}


export const useOSEPODInfo = (pod_id: string) => {
  const hasValidPodId = Boolean(pod_id?.trim()) && pod_id !== 'N/A'

  return useQuery({
    queryKey: ['osepod', pod_id],
    queryFn: () => fetchPOD(pod_id),
    enabled: hasValidPodId,
    initialData: [],
  })
}
