import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosCall, fetcher } from '@/providers/ocotillo-data-provider'
import {
  type CreateConsentInput,
  type PublicationConsent,
  zPublicationConsent,
  zPublicationConsentList,
} from '@/utils/accessConsent'

/**
 * Publication consent (`/access/consent`).
 *
 * Unlike grants, this route still requires `thing_id` — there is no
 * consent-wide audit view — so the tab stays thing-scoped and does not fetch
 * until one is supplied.
 */
export const useAccessConsent = (
  thingId: string,
  options?: { includeRevoked?: boolean; enabled?: boolean }
) =>
  useQuery<PublicationConsent[]>({
    queryKey: ['access-consent', thingId, options?.includeRevoked ?? false],
    enabled: (options?.enabled ?? true) && /^\d+$/.test(thingId.trim()),
    queryFn: async () => {
      const response = await fetcher('access/consent', {
        params: {
          thing_id: Number(thingId.trim()),
          include_revoked: options?.includeRevoked ?? false,
        },
      })
      return zPublicationConsentList.parse(response.data)
    },
  })

const useConsentMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<PublicationConsent>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-consent'] })
      // A consent change moves what a destination may read, and that view is
      // computed server-side from these rows.
      queryClient.invalidateQueries({ queryKey: ['access-published-things'] })
    },
  })
}

export const useCreateConsent = () =>
  useConsentMutation(async (input: CreateConsentInput) => {
    const response = await axiosCall('access/consent', {
      method: 'POST',
      data: input,
    })
    return zPublicationConsent.parse(response.data)
  })

export const useRevokeConsent = () =>
  useConsentMutation(async (consentId: number) => {
    const response = await axiosCall(`access/consent/${consentId}/revocation`, {
      method: 'POST',
    })
    return zPublicationConsent.parse(response.data)
  })
