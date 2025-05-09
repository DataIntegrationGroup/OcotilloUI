import { getAccessToken } from '@/providers/fief-provider'
import { lookupTableQueryConfig } from '@/pages/pages.config'
import { useQuery } from '@tanstack/react-query'
import { IWaterLevelForm } from '@/interfaces/amp'
import { settings } from '@/settings'
import { AmpApiUriBuilder, removeEmptyFields, fetchLookupTable } from '@/utils'

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
  files,
  supportedFileTypes,
}: {
  body: Partial<IWaterLevelForm>
  files: File[]
  supportedFileTypes: string[]
}) => {
  const formData = new FormData()
  const sanitizedBody = removeEmptyFields(body)
  formData.append('data', JSON.stringify(sanitizedBody))

  if (files?.length) {
    files.forEach((file) => {
      const fileType = file.type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

      if (
        supportedFileTypes.includes(fileType) ||
        supportedFileTypes.includes(fileExtension)
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
