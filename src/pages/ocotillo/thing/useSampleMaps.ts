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

// ─── Field Compilation Notes: sample → method / staff maps ─────────────────
// Shared by the single-well preview and the batch export so both paths fill
// Last Measurements · Method / Staff from the same calls and precedence.

type SampleLike = {
  sample_method?: string | null
  sampler_name?: string | null
  contact?: { name?: string | null } | null
  field_event?: {
    field_event_participants?: Array<{ participant?: { name?: string | null } | null } | null> | null
  } | null
}

type ObservationLike = {
  observation_datetime?: string | Date | null
  sample_id?: number | null
}

/** Sample ids of the `count` newest observations (the Last Measurements rows). */
export const latestSampleIds = (
  observations: readonly ObservationLike[],
  count = 2
): number[] =>
  Array.from(
    new Set(
      [...observations]
        .filter((observation) => observation.observation_datetime)
        .sort(
          (a, b) =>
            new Date(b.observation_datetime!).getTime() -
            new Date(a.observation_datetime!).getTime()
        )
        .slice(0, count)
        .map((observation) => observation.sample_id)
        .filter((sampleId): sampleId is number => typeof sampleId === 'number')
    )
  )

/**
 * Method / staff per sample. Staff is a person's full name: the sample's own
 * contact first (well-show.tsx `water_level_measuring_staff`), then the
 * free-text `sampler_name`, then the visit's field-event participants.
 */
export const buildSampleMaps = (
  samples: ReadonlyArray<readonly [number, SampleLike]>
) => ({
  sampleMethodsBySampleId: Object.fromEntries(
    samples.map(([sampleId, sample]) => [sampleId, sample.sample_method?.trim() || '-'])
  ) as Record<number, string>,
  staffBySampleId: Object.fromEntries(
    samples.map(([sampleId, sample]) => [
      sampleId,
      sample.contact?.name?.trim() ||
        sample.sampler_name?.trim() ||
        (sample.field_event?.field_event_participants ?? [])
          .map((p) => p?.participant?.name?.trim())
          .filter(Boolean)
          .join(', '),
    ])
  ) as Record<number, string>,
})

type SampleGetOne = (params: { resource: string; id: number }) => Promise<{ data: unknown }>

/**
 * Fetch the samples behind the newest observations with the existing
 * `ocotillo.sample` getOne call and build both maps. Failed fetches are
 * skipped (those cells print blank) rather than failing the sheet.
 */
export const fetchSampleMaps = async (
  provider: { getOne: SampleGetOne },
  observations: readonly ObservationLike[]
) => {
  const sampleIds = latestSampleIds(observations)
  const settled = await Promise.allSettled(
    sampleIds.map((id) => provider.getOne({ resource: 'ocotillo.sample', id }))
  )
  const samples = settled
    .map((result, index) =>
      result.status === 'fulfilled' && result.value?.data
        ? ([sampleIds[index], result.value.data as SampleLike] as const)
        : null
    )
    .filter((entry): entry is readonly [number, SampleLike] => entry !== null)
  return buildSampleMaps(samples)
}
