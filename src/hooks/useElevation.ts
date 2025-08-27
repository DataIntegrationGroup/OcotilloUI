import { useQuery } from '@tanstack/react-query'

interface ElevationResponse {
  location: {
    x: number
    y: number
    spatialReference: {
      wkid: number
      latestWkid: number
    }
  }
  locationId: number
  value: number
  rasterId: number
  resolution: number
}

const fetchElevation = async (x: number, y: number): Promise<ElevationResponse> => {
  const url = `https://epqs.nationalmap.gov/v1/json?x=${x}&y=${y}&units=Feet&wkid=4326&includeDate=False`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch elevation: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export const useElevation = (longitude: number | undefined, latitude: number | undefined, enabled: boolean) => {
  return useQuery({
    queryKey: ['elevation', longitude, latitude],
    queryFn: () => fetchElevation(longitude!, latitude!),
    enabled: enabled && !!longitude && !!latitude,
    staleTime: 5 * 60 * 1000, // keep results fresh for 5 minutes
  })
}
