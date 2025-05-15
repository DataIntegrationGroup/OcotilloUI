import { AmpApiUriBuilder } from '@/utils'
import { settings } from '@/settings'
import { getAccessToken } from '@/providers/fief-provider'

export const fetchConfig = (accessToken: string, method: string = 'GET') => {
  return {
    method: method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }
}

export const ampApiFetch = async (
  endpoint: string,
  failure_message: string,
  method: string = 'GET',
  version: string = 'v0'
): Promise<any> => {
  const accessToken = await getAccessToken()
  const url = new AmpApiUriBuilder(settings.nmbgmr_amp_api_url)
    .setVersion(version)
    .setEndpoint(endpoint)
    .build()

  const response = await fetch(url, fetchConfig(accessToken, method))
  if (!response.ok) {
    throw new Error(`${failure_message}: ${response.statusText}`)
  }

  return response.json()
}
