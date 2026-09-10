import type { DataProvider } from '@refinedev/core'
import {
  CHEMISTRY_REPORT_PAGE_SIZE,
  type ContinuousWaterLevelSummary,
  chemistryReportYearParams,
  inclusiveEndYearParams,
  sortChemistryResults,
  summarizeContinuousWaterLevels,
  type TransducerReadingLike,
  toWaterLevelReadings,
  type WaterLevelObservation,
  type WaterLevelReading,
} from '@/utils/chemistryReport'
import type { ChemistryResult } from './useChemistryReportData'

/**
 * The data behind one chemistry report, fetched the same way whichever page
 * asks for it. The exporter and the well details page used to pull it
 * separately and disagreed -- only one of them carried the prior water level
 * reading, so the same well and year printed a different water level change
 * depending on where the report was generated.
 */

type ListProvider = Pick<DataProvider, 'getList'>
type ThingId = string | number

export const CHEMISTRY_RESOURCE = 'chemistry/results'
export const WATER_LEVEL_RESOURCE = 'observation/groundwater-level'
export const TRANSDUCER_RESOURCE = 'observation/transducer-groundwater-level'

const NEWEST_FIRST = [{ field: 'observation_datetime', order: 'desc' as const }]
const OLDEST_FIRST = [{ field: 'observation_datetime', order: 'asc' as const }]

/** Every chemistry result for the year, paged until the total is reached. */
export const fetchChemistryYear = async (
  provider: ListProvider,
  thingId: ThingId,
  year: number
): Promise<ChemistryResult[]> => {
  const params = { thing_id: thingId, ...chemistryReportYearParams(year) }
  const collected: ChemistryResult[] = []
  let currentPage = 1

  while (true) {
    const page = await provider.getList({
      resource: CHEMISTRY_RESOURCE,
      pagination: { currentPage, pageSize: CHEMISTRY_REPORT_PAGE_SIZE },
      meta: { params },
    })

    collected.push(...(page.data as ChemistryResult[]))

    if (page.data.length === 0 || collected.length >= page.total) break
    currentPage += 1
  }

  return sortChemistryResults(collected)
}

/**
 * The year's manual water level readings, plus the newest reading from before
 * the year so the report can say which direction the water table moved. A
 * single year in isolation has nothing to compare against.
 */
export const fetchReportWaterLevels = async (
  provider: ListProvider,
  thingId: ThingId,
  year: number,
  { elevationFt }: { elevationFt?: number | null } = {}
): Promise<WaterLevelReading[]> => {
  const [inYear, prior] = await Promise.all([
    provider.getList({
      resource: WATER_LEVEL_RESOURCE,
      pagination: { currentPage: 1, pageSize: CHEMISTRY_REPORT_PAGE_SIZE },
      sorters: NEWEST_FIRST,
      meta: { params: { thing_id: thingId, ...inclusiveEndYearParams(year) } },
    }),
    provider.getList({
      resource: WATER_LEVEL_RESOURCE,
      pagination: { currentPage: 1, pageSize: 1 },
      sorters: NEWEST_FIRST,
      meta: {
        params: {
          thing_id: thingId,
          end_time: inclusiveEndYearParams(year - 1).end_time,
        },
      },
    }),
  ])

  const readings = toWaterLevelReadings(
    inYear.data as WaterLevelObservation[],
    { elevationFt }
  )
  const priorReadings = toWaterLevelReadings(
    prior.data as WaterLevelObservation[],
    { elevationFt }
  ).map((reading) => ({ ...reading, isPrior: true }))

  return [...readings, ...priorReadings]
}

/**
 * A summary of the well's logger record, or null when it has none.
 *
 * Built from single readings -- the first and last by time, the shallowest
 * and deepest by value -- plus the page totals, so an hourly record is
 * described without downloading it.
 */
export const fetchContinuousWaterLevels = async (
  provider: ListProvider,
  thingId: ThingId,
  year: number
): Promise<ContinuousWaterLevelSummary | null> => {
  const pick = (
    params: Record<string, string>,
    sorters: { field: string; order: 'asc' | 'desc' }[]
  ) =>
    provider.getList({
      resource: TRANSDUCER_RESOURCE,
      pagination: { currentPage: 1, pageSize: 1 },
      sorters,
      meta: { params: { thing_id: thingId, ...params } },
    })

  const firstEver = await pick({}, OLDEST_FIRST)
  if (!firstEver.total) return null

  const window = inclusiveEndYearParams(year)
  const [lastEver, firstInYear, lastInYear, shallowest, deepest] =
    await Promise.all([
      pick({}, NEWEST_FIRST),
      pick(window, OLDEST_FIRST),
      pick(window, NEWEST_FIRST),
      // The logger reports depth to water, so the smallest value is the
      // highest the water stood.
      pick(window, [{ field: 'value', order: 'asc' }]),
      pick(window, [{ field: 'value', order: 'desc' }]),
    ])

  const first = (page: { data: unknown[] }) =>
    page.data[0] as TransducerReadingLike | undefined

  return summarizeContinuousWaterLevels({
    recordsOnFile: firstEver.total,
    recordsInYear: firstInYear.total,
    firstEver: first(firstEver),
    lastEver: first(lastEver),
    firstInYear: first(firstInYear),
    lastInYear: first(lastInYear),
    shallowestInYear: first(shallowest),
    deepestInYear: first(deepest),
  })
}
