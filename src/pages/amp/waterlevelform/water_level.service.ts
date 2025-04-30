import { getAccessToken } from '@/providers/fief-provider'
import { fetchConfig, lookupTableQueryConfig } from './water_level.configs'
import { useQuery } from '@tanstack/react-query'
import { IWaterLevelForm } from '@/interfaces/amp'
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

const fetchEquipmentTypes = async (): Promise<
  { Code: string; Meaning: string }[]
> => {
  return [
    { Code: 'S', Meaning: 'SONIC' },
    { Code: 'T', Meaning: 'STEEL TAPE' },
    { Code: 'E', Meaning: 'E-Probe' },
  ]
}

export const getEquipmentTypes = () => {
  return useQuery({
    queryKey: ['EquipmentTypes'],
    queryFn: fetchEquipmentTypes,
    ...lookupTableQueryConfig,
  })
}

const fetchLevelStatuses = async (): Promise<
  { Code: string; Meaning: string }[]
> => {
  return await fetchLookupTable('level_status')
}

export const getLevelStatuses = () => {
  return useQuery({
    queryKey: ['LevelStatuses'],
    queryFn: fetchLevelStatuses,
    ...lookupTableQueryConfig,
  })
}

const fetchDataSources = async (): Promise<
  { Code: string; Meaning: string }[]
> => {
  return await fetchLookupTable('data_source')
}

export const getDataSources = () => {
  return useQuery({
    queryKey: ['DataSources'],
    queryFn: fetchDataSources,
    ...lookupTableQueryConfig,
  })
}

const fetchDataQualities = async (): Promise<
  { Code: string; Meaning: string }[]
> => {
  return await fetchLookupTable('data_quality')
}

export const getDataQualities = () => {
  return useQuery({
    queryKey: ['DataQualities'],
    queryFn: fetchDataQualities,
    ...lookupTableQueryConfig,
  })
}

const fetchMeasurementMethods = async (): Promise<
  { Code: string; Meaning: string }[]
> => {
  return await fetchLookupTable('measurement_method')
}

export const getMeasurementMethods = () => {
  return useQuery({
    queryKey: ['MeasurementMethods'],
    queryFn: fetchMeasurementMethods,
    ...lookupTableQueryConfig,
  })
}

const fetchMeasuringAgencies = async (): Promise<
  { Agency: string; Description: string }[]
> => {
  return await fetchLookupTable('measuring_agency')
}

export const getMeasuringAgencies = () => {
  return useQuery({
    queryKey: ['MeasuringAgencies'],
    queryFn: fetchMeasuringAgencies,
    ...lookupTableQueryConfig,
  })
}

export const createWaterLevelForm = async ({
  body,
  photos,
}: {
  body: Partial<IWaterLevelForm>
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
