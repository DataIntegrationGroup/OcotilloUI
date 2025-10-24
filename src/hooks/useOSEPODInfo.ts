import { useQuery } from '@tanstack/react-query'

const fetchPOD = async (pod_id: string) => {
  const url = `https://services2.arcgis.com/qXZbWTdPDbTjl7Dy/arcgis/rest/services/OSE_PODs/FeatureServer/0/query?where=+db_file%3D%27${pod_id}%27&f=pjson&outFields=*&outSR=4326`
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
  return useQuery({
    queryKey: ['osepod', pod_id],
    queryFn: () => fetchPOD(pod_id),
  })
}