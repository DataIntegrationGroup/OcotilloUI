import { useCallback, useMemo } from 'react'
import { useDataProvider } from '@refinedev/core'
import {
  QueryClient,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { IWellDetails } from '@/interfaces/ocotillo'

export const WELL_DETAILS_QUERY_ROOT = 'well-details' as const

export type WellDetailsId = string | number | undefined

const WELL_DETAILS_STALE_TIME_MS = 5 * 60 * 1000
const WELL_DETAILS_GC_TIME_MS = 10 * 60 * 1000

export function wellDetailsQueryKey(id: WellDetailsId) {
  return [
    WELL_DETAILS_QUERY_ROOT,
    id === undefined || id === null || id === '' ? undefined : String(id),
  ] as const
}

export function invalidateWellDetails(
  queryClient: QueryClient,
  id: WellDetailsId
) {
  if (id === undefined || id === null || id === '') {
    return Promise.resolve()
  }

  return queryClient.refetchQueries({
    queryKey: wellDetailsQueryKey(id),
  })
}

export function useWellDetails(id: WellDetailsId) {
  const dataProvider = useDataProvider()
  const queryClient = useQueryClient()
  const ocotilloDataProvider = useMemo(
    () => dataProvider('ocotillo'),
    [dataProvider]
  )

  const query = useQuery({
    queryKey: wellDetailsQueryKey(id),
    enabled: Boolean(id),
    staleTime: WELL_DETAILS_STALE_TIME_MS,
    gcTime: WELL_DETAILS_GC_TIME_MS,
    queryFn: async () => {
      const response = await ocotilloDataProvider.custom!({
        url: `thing/water-well/${id}/details`,
        method: 'get',
      })

      return response.data as IWellDetails
    },
  })

  const invalidate = useCallback(() => {
    return invalidateWellDetails(queryClient, id)
  }, [queryClient, id])

  return {
    query,
    data: query.data,
    well: query.data?.well,
    isLoading: query.isLoading,
    isPending: query.isPending,
    invalidateWellDetails: invalidate,
  }
}
