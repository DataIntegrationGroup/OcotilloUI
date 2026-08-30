import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosCall, fetcher } from '@/providers/ocotillo-data-provider'
import {
  type CreateGrantInput,
  type GrantFilters,
  grantQueryParams,
  type PermissionGrant,
  type PermissionGrantPage,
  zPermissionGrant,
  zPermissionGrantPage,
} from '@/utils/accessGrants'

/**
 * ADR5 permission grants (`/access/grant`), for the operations console.
 *
 * Every filter the route takes is optional, so the bare call is the
 * admin-wide audit view and each filter narrows it. Filters are sent only
 * when set: an empty string is not the same question as "any", and passing
 * one would match only grants whose field is literally empty.
 *
 * The route answers with a page rather than a list, so the query returns the
 * envelope: the console needs `total` to tell a complete table from a truncated
 * one.
 */
export const useAccessGrants = (filters: GrantFilters) =>
  useQuery<PermissionGrantPage>({
    queryKey: ['access-grants', grantQueryParams(filters)],
    queryFn: async () => {
      const response = await fetcher('access/grant', {
        params: grantQueryParams(filters),
      })
      return zPermissionGrantPage.parse(response.data)
    },
  })

/**
 * Both mutations invalidate every grant list rather than patching the cache.
 * A write can land outside the slice on screen — granting to a principal the
 * current filter excludes — and a grant's rendered status depends on the
 * server's clock, so the authoritative row is the one the next read returns.
 */
const useGrantMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<PermissionGrant>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-grants'] })
    },
  })
}

export const useCreateGrant = () =>
  useGrantMutation(async (input: CreateGrantInput) => {
    const response = await axiosCall('access/grant', {
      method: 'POST',
      data: input,
    })
    return zPermissionGrant.parse(response.data)
  })

export const useRevokeGrant = () =>
  useGrantMutation(async (grantId: number) => {
    const response = await axiosCall(`access/grant/${grantId}/revocation`, {
      method: 'POST',
    })
    return zPermissionGrant.parse(response.data)
  })
