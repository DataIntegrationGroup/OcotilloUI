import { ApiUriBuilder } from '@/utils'
import { settings } from '@/settings'
import { getAccessToken } from '@/providers/authentik-provider'

export const fetchConfig = (accessToken: string, method: string = 'GET') => {
  return {
    method: method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }
}

export const apiFetch = async ({
  endpoint,
  failureMessage = 'Request failed',
  method = 'GET',
}: {
  endpoint: string
  failureMessage?: string
  method?: string
}): Promise<any> => {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    throw new Error('Authentication required')
  }

  // Normalize endpoint to always begin without leading slash
  const normalizedEndpoint = endpoint.startsWith('/')
    ? endpoint.slice(1)
    : endpoint

  const url = new ApiUriBuilder(settings.ocotillo_api_url)
    .setEndpoint(normalizedEndpoint)
    .build()

  const response = await fetch(url, fetchConfig(accessToken, method))

  if (!response.ok) {
    throw new Error(`${failureMessage}: ${response.statusText}`)
  }

  return response.json()
}
