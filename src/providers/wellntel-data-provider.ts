// Wellntel analytics API client, ported from wellpy
// (wellpy/wellntel/client.py). Fetches acoustic depth-to-water readings with
// the same cursor-style pagination, temperature conversion, and
// wellname-to-PointID mapping as the original, and can rebuild wellpy's
// .wcsv export shape.
import { settings } from '@/settings'

export interface WellntelReading {
  pointId: string | null
  wellName: string
  timestamp: Date
  timestampRaw: string
  depth: number
  temperatureC: number | null
  temperatureRaw: number | null
}

interface WellntelApiRecord {
  wellname?: string
  timestamp?: string
  temperature?: number
  depth?: number
}

// Wellpy's POINTID_MAP. The upload contract proposes moving this mapping
// into the database (open question #5); until then it lives here, exactly
// as wellpy hardcoded it.
export const WELLNTEL_POINT_ID_MAP: Record<string, string> = {
  'Gaume Well': 'WL-0036',
  'Eileen Dodds Well': 'SA-0240',
  'Moss Farms Well': 'EB-165',
}

export const resolveWellntelPointId = (wellName: string) =>
  WELLNTEL_POINT_ID_MAP[wellName] ?? wellName

const PAGE_SIZE = 1000
const MAX_PAGES = 50

// wellpy: DT_FMT = '%Y-%m-%d %H:%M:%S'
const toWellntelDatetime = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

// wellpy: toc(t) -> fahrenheit = t / 10, celsius = (f - 32) * 5 / 9
const rawTemperatureToCelsius = (raw: number) => ((raw / 10 - 32) * 5) / 9

export const isWellntelConfigured = () => Boolean(settings.wellntel.api_key)

const fetchReadingsPage = async (startCursor: string) => {
  const url = new URL(`${settings.wellntel.api_url}/readings`)
  url.searchParams.set('count', String(PAGE_SIZE))
  url.searchParams.set('start', startCursor)
  url.searchParams.set('order', 'ascending')

  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      Authorization: `Key ${settings.wellntel.api_key}`,
    },
  })

  if (!response.ok) {
    throw new Error(
      `Wellntel API request failed with status ${response.status}.`
    )
  }

  return (await response.json()) as WellntelApiRecord[]
}

const toReading = (record: WellntelApiRecord): WellntelReading | null => {
  if (!record.timestamp || !record.wellname) return null

  const timestamp = new Date(record.timestamp)
  const depth = Number(record.depth)
  if (Number.isNaN(timestamp.getTime()) || !Number.isFinite(depth)) return null

  const temperatureRaw = Number.isFinite(Number(record.temperature))
    ? Number(record.temperature)
    : null

  return {
    pointId: resolveWellntelPointId(record.wellname),
    wellName: record.wellname,
    timestamp,
    timestampRaw: record.timestamp,
    depth,
    temperatureC:
      temperatureRaw === null
        ? null
        : Number(rawTemperatureToCelsius(temperatureRaw).toFixed(4)),
    temperatureRaw,
  }
}

// Port of wellpy's WellntelClient._get_readings: request pages of 1000 in
// ascending order, advancing the start cursor to the last record's
// timestamp until it stops moving. Duplicates from the inclusive cursor
// overlap are removed, and results can be scoped to one PointID and an end
// bound (the Wellntel API itself only supports a start).
export const fetchWellntelReadings = async ({
  start,
  end,
  pointId,
}: {
  start: Date
  end?: Date | null
  pointId?: string | null
}): Promise<WellntelReading[]> => {
  if (!isWellntelConfigured()) {
    throw new Error(
      'No Wellntel API key is configured (VITE_WELLNTEL_API_KEY).'
    )
  }

  const seen = new Set<string>()
  const readings: WellntelReading[] = []
  let cursor = toWellntelDatetime(start)
  let previousCursor: string | null = null

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const records = await fetchReadingsPage(cursor)
    if (records.length === 0) break

    for (const record of records) {
      const reading = toReading(record)
      if (!reading) continue

      const key = `${reading.wellName}|${reading.timestampRaw}`
      if (seen.has(key)) continue
      seen.add(key)
      readings.push(reading)
    }

    const nextCursor = records[records.length - 1]?.timestamp
    if (!nextCursor || nextCursor === cursor || nextCursor === previousCursor) {
      break
    }
    if (end && new Date(nextCursor).getTime() >= end.getTime()) break

    previousCursor = cursor
    cursor = nextCursor
  }

  return readings
    .filter((reading) => (pointId ? reading.pointId === pointId : true))
    .filter((reading) =>
      end ? reading.timestamp.getTime() <= end.getTime() : true
    )
    .filter((reading) => reading.timestamp.getTime() >= start.getTime())
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

export const toHydrographPoints = (readings: WellntelReading[]) =>
  readings.map((reading) => ({
    time: reading.timestamp,
    value: reading.depth,
  }))

// Port of wellpy's WellntelClient._make_output: the .wcsv export shape.
export const buildWcsvFromReadings = (readings: WellntelReading[]) => {
  const rows = [
    'timestamp,temperature_C,temperature_raw,depth',
    ...readings.map((reading) =>
      [
        reading.timestampRaw,
        reading.temperatureC ?? '',
        reading.temperatureRaw ?? '',
        reading.depth,
      ].join(',')
    ),
  ]

  return rows.join('\n')
}
