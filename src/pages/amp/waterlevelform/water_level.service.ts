import { getAccessToken } from '@/providers/fief-provider'
import { lookupTableQueryConfig } from '@/pages/pages.config'
import { useQuery } from '@tanstack/react-query'
import { IWaterLevelForm } from '@/interfaces/amp'
import { settings } from '@/settings'
import { AmpApiUriBuilder, removeEmptyFields, fetchLookupTable } from '@/utils'
import { Page } from '@/interfaces'

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

export type Coordinates3D = [number, number, number]

export interface Geometry {
  type: 'Point'
  coordinates: Coordinates3D
}

export interface Site {
  PointID: string
  PublicRelease: boolean
  Confidential: boolean
  AlternateSiteID: string
  elevation_method: string
  Elevation: number
  SiteNames: string
  SiteID: string
  Easting: number
  Northing: number
  State: string
  County: string
  geometry: Geometry
  utm_datum: string
  utm_zone: number
  altitude_datum: string
  lonlat_datum: string
  site_type: string
  LocationNotes: string | null
  AltitudeAccuracy: number
  SiteDate: string | null
}

export const fetchCoordinates = async (
  pointid: string
): Promise<{ x: number; y: number }> => {
  const accessToken = await getAccessToken()
  const url = new AmpApiUriBuilder(settings.nmbgmr_amp_api_url)
    .setEndpoint('authorized/tabular/locations')
    .addParam('pointid', pointid)
    .build()

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const data: { items: Site[] } = await response.json()

  if (!data.items || data.items.length === 0) {
    throw new Error(`No site data found for PointID: ${pointid}`)
  }

  const matchingSite = data.items.find((site) => site.PointID === pointid)

  if (!matchingSite.geometry?.coordinates) {
    throw new Error(`Coordinates not found for PointID: ${pointid}`)
  }

  return {
    x: matchingSite.geometry.coordinates[0],
    y: matchingSite.geometry.coordinates[1],
  }
}

export const getCoordinatesFromPointId = (
  pointid: string,
  enabled: boolean
) => {
  return useQuery({
    queryKey: ['CoordinatesFromPointId', pointid],
    queryFn: () => fetchCoordinates(pointid),
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // keep results fresh for 5 minutes
  })
}

export interface WaterLevel {
  PointID: string
  DepthToWaterBGS: number
  DepthToWaterBGSUnits: string
  DateMeasured: string
  TimeMeasured: string
  LevelStatus: string
  DataQuality: string
  MeasuringAgency: string
  DataSource: string
  MeasurementMethod: string
  MeasuredBy: string
  SiteNotes: false
  PublicRelease: boolean
}

export const fetchWaterLevels = async (
  pointid: string
): Promise<Page<WaterLevel>> => {
  const accessToken = await getAccessToken()
  const url = new AmpApiUriBuilder(settings.nmbgmr_amp_api_url)
    .setEndpoint('waterlevels')
    .addParam('pointid', pointid)
    .addParam('omit_null_measurements', 'true')
    .addParam('sort_datetime', 'desc')
    .addParam('size', '1000')
    .build()

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const data = await response.json()

  if (!data.items || data.items.length === 0) {
    throw new Error(`No site data found for PointID: ${pointid}`)
  }

  return data
}

export const getWaterLevelsFromPointId = (
  pointid: string,
  enabled: boolean
) => {
  return useQuery({
    queryKey: ['WaterLevelsFromPointId', pointid],
    queryFn: () => fetchWaterLevels(pointid),
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // keep results fresh for 5 minutes
  })
}
