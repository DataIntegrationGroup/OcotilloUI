import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosCall, fetcher } from '@/providers/ocotillo-data-provider'
import {
  type CreateDestinationInput,
  type Destination,
  type PublishedThing,
  zDestination,
  zDestinationList,
  zPublishedThingList,
} from '@/utils/accessDestinations'

/**
 * Destinations (`/access/destination`).
 *
 * Listing is viewer-level while registering is admin-only, so the consent tab
 * can resolve destination names even for a reader who could not create one.
 */
export const useAccessDestinations = (options?: { enabled?: boolean }) =>
  useQuery<Destination[]>({
    queryKey: ['access-destinations'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const response = await fetcher('access/destination')
      return zDestinationList.parse(response.data)
    },
  })

export const useCreateDestination = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateDestinationInput) => {
      const response = await axiosCall('access/destination', {
        method: 'POST',
        data: input,
      })
      return zDestination.parse(response.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-destinations'] })
    },
  })
}

/**
 * What one destination may actually read, computed from consent rows at
 * request time. A retired destination and one nobody has consented to both
 * return an empty list — default deny, with no separate "unpublished" state —
 * so the console cannot tell those apart and does not pretend to.
 */
export const usePublishedThings = (
  slug: string | undefined,
  options?: { dataType?: string; enabled?: boolean }
) =>
  useQuery<PublishedThing[]>({
    queryKey: ['access-published-things', slug, options?.dataType ?? null],
    enabled: (options?.enabled ?? true) && Boolean(slug),
    queryFn: async () => {
      const response = await fetcher(
        `access/destination/${encodeURIComponent(slug as string)}/thing`,
        options?.dataType ? { params: { data_type: options.dataType } } : {}
      )
      return zPublishedThingList.parse(response.data)
    },
  })
