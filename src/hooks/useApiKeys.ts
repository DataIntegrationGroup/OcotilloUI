import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosCall, fetcher } from '@/providers/ocotillo-data-provider'
import {
  type ApiKey,
  type NewApiKey,
  zApiKeyList,
  zNewApiKey,
} from '@/utils/apiKeys'

/**
 * Personal API keys (`/api_key`), for the settings page.
 *
 * The route answers with the caller's own keys and nothing else — ownership is
 * the `sub` claim on the token, never a parameter — so there is nothing to
 * filter and one query key serves the whole card.
 */
export const useApiKeys = () =>
  useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const response = await fetcher('api_key')
      return zApiKeyList.parse(response.data)
    },
  })

/**
 * Every mutation invalidates the list rather than patching the cache. A key's
 * rendered status depends on the server's clock, and `last_used_at` moves
 * without this client doing anything, so the authoritative row is the one the
 * next read returns.
 */
const useApiKeyMutation = <TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })
}

/**
 * Issue a key. The response is the only place the token ever appears — the
 * server stores a digest — so whatever calls this owns showing it once.
 */
export const useCreateApiKey = () =>
  useApiKeyMutation<{ name: string; lifetimeDays?: number }, NewApiKey>(
    async ({ name, lifetimeDays }) => {
      const response = await axiosCall('api_key', {
        method: 'POST',
        data: {
          name,
          // Omitted rather than guessed: the API owns the default and clamps
          // anything longer than its maximum.
          ...(lifetimeDays === undefined
            ? {}
            : { lifetime_days: lifetimeDays }),
        },
      })
      return zNewApiKey.parse(response.data)
    }
  )

export const useRenameApiKey = () =>
  useApiKeyMutation<{ id: number; name: string }, ApiKey>(
    async ({ id, name }) => {
      const response = await axiosCall(`api_key/${id}`, {
        method: 'PATCH',
        data: { name },
      })
      return zApiKeyList.element.parse(response.data)
    }
  )

/** Revocation answers 204, so there is no body to parse or return. */
export const useRevokeApiKey = () =>
  useApiKeyMutation<number, void>(async (id) => {
    await axiosCall(`api_key/${id}`, { method: 'DELETE' })
  })
