import { useQuery } from '@tanstack/react-query'

const fetchSiteInfo = async (pod_id: string) => {

  return []

  // usgs site info parser not yet implemented
  const url = ``
  const res = await fetch(url)
  const data = await res.text()

  return []
}


export const useUSGSSiteInfo = (site_no: string) => {
  return useQuery({
    queryKey: ['site_no', site_no],
    queryFn: () => fetchSiteInfo(site_no),
  })
}