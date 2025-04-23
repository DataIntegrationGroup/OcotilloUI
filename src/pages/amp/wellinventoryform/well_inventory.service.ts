import { getAccessToken } from '@/providers/fief-provider'
import { fetchConfig, lookupTableQueryConfig } from './well_inventory.configs'
import { useQuery } from '@tanstack/react-query'
import { ILocation, IOwner, IWellInventoryForm } from '@/interfaces/amp'
import { Page } from '@/interfaces'
import { settings } from '@/settings'
import { AmpApiUriBuilder } from '@/utils/AmpApiUriBuilder'

const ampApiFetch = async (
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

const fetchLookupTable = async (table: string): Promise<any> => {
  return await ampApiFetch(
    `authorized/lookuptable/${table}`,
    `Failed to fetch ${table} options`
  )
}

const fetchProjects = async (): Promise<
  {
    Project: string
    PointIDPrefix: string[]
  }[]
> => {
  return await fetchLookupTable('project')
}

export const getProjects = () => {
  return useQuery({
    queryKey: ['ProjectNames'],
    queryFn: fetchProjects,
    ...lookupTableQueryConfig,
  })
}

const fetchMonitoringStatuses = async (): Promise<
  { Code: string; Meaning: string }[]
> => {
  return await fetchLookupTable('monitoring_status')
}

export const getMonitoringStatuses = () => {
  return useQuery({
    queryKey: ['MonitoringStatuses'],
    queryFn: fetchMonitoringStatuses,
    ...lookupTableQueryConfig,
  })
}

const fetchCoordinateDatums = async (): Promise<{ DATUMCODE: string }[]> => {
  return await fetchLookupTable('coordinate_datum')
}

export const getCoordinateDatums = () => {
  return useQuery({
    queryKey: ['CoordinateDatums'],
    queryFn: fetchCoordinateDatums,
    ...lookupTableQueryConfig,
  })
}

const fetchElevationDatums = async (): Promise<{ Code: string }[]> => {
  return await fetchLookupTable('altitude_datum')
}

export const getElevationDatums = () => {
  return useQuery({
    queryKey: ['elevationDatums'],
    queryFn: fetchElevationDatums,
    ...lookupTableQueryConfig,
  })
}

const fetchElevationMethods = async (): Promise<
  { Code: string; Meaning: string }[]
> => {
  return await fetchLookupTable('altitude_method')
}

export const getElevationMethods = () => {
  return useQuery({
    queryKey: ['elevationMethods'],
    queryFn: fetchElevationMethods,
    ...lookupTableQueryConfig,
  })
}

const fetchFormations = async (): Promise<
  { Code: string; Meaning: string }[]
> => {
  return await fetchLookupTable('formation')
}

export const getFormations = () => {
  return useQuery({
    queryKey: ['Formations'],
    queryFn: fetchFormations,
    ...lookupTableQueryConfig,
  })
}

const fetchSiteTypes = async (): Promise<
  { Code: string; Meaning: string }[]
> => {
  return await fetchLookupTable('site_type')
}

export const getSiteTypes = () => {
  return useQuery({
    queryKey: ['SiteTypes'],
    queryFn: fetchSiteTypes,
    ...lookupTableQueryConfig,
  })
}

const fetchStatuses = async (): Promise<
  { Code: string; Meaning: string }[]
> => {
  return await fetchLookupTable('status')
}

export const getStatus = () => {
  return useQuery({
    queryKey: ['Statuses'],
    queryFn: fetchStatuses,
    ...lookupTableQueryConfig,
  })
}

const fetchDepthSources = async (): Promise<
  { Code: string; Meaning: string }[]
> => {
  return await fetchLookupTable('depth-completion-source')
}

export const getDepthSources = () => {
  return useQuery({
    queryKey: ['DepthSources'],
    queryFn: fetchDepthSources,
    ...lookupTableQueryConfig,
  })
}

const fetchCompletionSources = async (): Promise<
  { Code: string; Meaning: string }[]
> => {
  return await fetchLookupTable('depth-completion-source')
}

export const getCompletionSources = () => {
  return useQuery({
    queryKey: ['CompletionSources'],
    queryFn: fetchCompletionSources,
    ...lookupTableQueryConfig,
  })
}

const fetchConstructionMethods = async (): Promise<
  { Code: string; Meaning: string }[]
> => {
  return await fetchLookupTable('construction-method')
}

export const getConstructionMethods = () => {
  return useQuery({
    queryKey: ['ConstructionMethods'],
    queryFn: fetchConstructionMethods,
    ...lookupTableQueryConfig,
  })
}

const fetchCurrentUses = async (): Promise<
  { Code: string; Meaning: string }[]
> => {
  return await fetchLookupTable('current-use')
}

export const getCurrentUses = () => {
  return useQuery({
    queryKey: ['CurrentUses'],
    queryFn: fetchCurrentUses,
    ...lookupTableQueryConfig,
  })
}

const fetchCoordinateAccuracies = async (): Promise<
  { Code: string; Meaning: string }[]
> => {
  return await fetchLookupTable('coordinate-accuracy')
}

export const getCoordinateAccuracies = () => {
  return useQuery({
    queryKey: ['CoordinateAccuracies'],
    queryFn: fetchCoordinateAccuracies,
    ...lookupTableQueryConfig,
  })
}

const fetchCoordinateMethods = async (): Promise<
  { Code: string; Meaning: string }[]
> => {
  return await fetchLookupTable('coordinate-method')
}

export const getCoordinateMethods = () => {
  return useQuery({
    queryKey: ['CoordinateMethods'],
    queryFn: fetchCoordinateMethods,
    ...lookupTableQueryConfig,
  })
}

const fetchNewPointIDPreview = async (prefix: string, siteType: string) => {
  return await ampApiFetch(
    `authorized/well_inventory/newly-generated-pointid?pointid_prefix=${encodeURIComponent(
      prefix
    )}&site_type=${encodeURIComponent(siteType)}`,
    'Failed to fetch new Point ID preview'
  )
}

export const getNewPointIDPreview = (prefix: string, siteType: string) => {
  return useQuery({
    queryKey: ['PointIDPreview', prefix, siteType],
    queryFn: () => fetchNewPointIDPreview(prefix, siteType),
    enabled: !!(prefix && siteType),
  })
}

export const createWellInventoryForm = async ({
  body,
  photos,
}: {
  body: Partial<IWellInventoryForm>
  photos: File[]
}) => {
  const formData = new FormData()
  const sanitizedBody = removeEmptyFields(body)
  formData.append('data', JSON.stringify(sanitizedBody))

  if (photos) {
    Array.from(photos).forEach((file) => {
      if (
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        file.type === 'image/heic'
      ) {
        formData.append('files', file)
      }
    })
  }

  const accessToken = await getAccessToken()
  const url = new AmpApiUriBuilder(settings.nmbgmr_amp_api_url)
    .setEndpoint('authorized/well_inventory')
    .build()

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data = isJson ? await response.json() : null

  if (!response.ok) {
    const error = new Error(
      `Failed to create new well inventory entry: ${response.status}`
    ) as Error & { status?: number; data?: any }
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export const fetchOwnerSearch = async ({
  owner_key_like = '',
  first_name_like = '',
  last_name_like = '',
  email_like = '',
  phone_like = '',
  cell_phone_like = '',
  limit = 10,
  expand = false,
  page = 1,
  size = 10,
}: {
  owner_key_like?: string
  first_name_like?: string
  last_name_like?: string
  email_like?: string
  phone_like?: string
  cell_phone_like?: string
  limit?: number
  expand?: boolean
  page?: number
  size?: number
}): Promise<
  Page<{
    locations: ILocation[]
    owner: IOwner
  }>
> => {
  const queryParams = new URLSearchParams({
    owner_key_like,
    first_name_like,
    last_name_like,
    email_like,
    phone_like,
    cell_phone_like,
    limit: limit.toString(),
    expand: expand.toString(),
    page: page.toString(),
    size: size.toString(),
  })

  return await ampApiFetch(
    `authorized/locations/owners-search?${queryParams.toString()}`,
    'Failed to fetch owners'
  )
}

const removeEmptyFields = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(removeEmptyFields)
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, value]) => value !== '' && value !== null)
        .map(([key, value]) => [key, removeEmptyFields(value)])
    )
  }
  return obj
}
