import { useRef } from 'react'

/**
 * Hook to fetch sample mapping data (method and staff) for a set of observations.
 * Uses a simple cache to avoid redundant requests.
 */
export const useSampleMaps = (dataProvider: any) => {
  const cache = useRef<Record<number, any>>({})

  /**
   * Retrieves the sample method and sampler name for each observation in the list.
   * @param observations List of observations with optional sample_id
   * @returns An object containing maps of sampleId to method and staff.
   */
  const getSampleMaps = async (observations: any[]) => {
    const sampleMethodsBySampleId: Record<number, string> = {}
    const staffBySampleId: Record<number, string> = {}

    // Get unique non-null sample IDs to fetch data for.
    const uniqueSampleIds = [...new Set(observations.map((o) => o.sample_id).filter(Boolean))]

    for (const id of uniqueSampleIds) {
      if (cache.current[id]) {
        const cached = cache.current[id]
        sampleMethodsBySampleId[id] = cached.method
        staffBySampleId[id] = cached.staff
        continue
      }

      try {
        const response = await dataProvider('ocotillo').getOne({ id })
        if (response?.data) {
          const { sample_method, sampler_name } = response.data
          cache.current[id] = { method: sample_method, staff: sampler_name }
          sampleMethodsBySampleId[id] = sample_method
          staffBySampleId[id] = sampler_name
        }
      } catch (error) {
        // On error/rejection, do not cache the result so we can retry in future calls.
        // This matches the requirement to clear cache on rejection.
      }
    }

    return { sampleMethodsBySampleId, staffBySampleId }
  }

  return { getSampleMaps }
}
