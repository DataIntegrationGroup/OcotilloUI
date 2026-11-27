import { useMemo } from 'react'
import { useDataProvider } from '@refinedev/core'
import { useQuery } from '@tanstack/react-query'
import type {
  IFieldEvent,
  IObservation,
  IWell,
  IWellDetails,
} from '@/interfaces/ocotillo'
import type { IHydrographDatasource } from '@/interfaces/st2'
import type { WaterLevelObservationRow } from '@/components/card/RecentWaterLevelObservations'
import { buildHydrographDatasource } from '@/pages/ocotillo/thing/hydrographDatasource'
import { useWellDetails } from './useWellDetails'

/**
 * Field Compilation Notes — the one data adapter behind the PDF preview, the
 * well page's Download and the batch export. All three feed the sheet from
 * `buildWellCompilationModel`, so rows, level statuses, chart series and the
 * year span cannot drift between them.
 *
 *  - Printed history (Last Measurements, page-2 readings): the newest field
 *    events from `thing/water-well/{id}/details` — the shipped, verified
 *    download path (well-show.tsx).
 *  - Chart series and year span: the full `observation/groundwater-level`
 *    history, every page.
 */

/**
 * Row cap: field events feeding the printed history. 25 is the details
 * endpoint's `field_event_limit` default. PENDING CLIENT RULING: 25 field
 * events (download path, taken as the default) vs 10 observations (the old
 * preview path) — and whether the printed history is capped at 10 rows.
 */
export const FCN_HISTORY_FIELD_EVENT_LIMIT = 25

/** Observation-shaped row the sheet prints (one per field-event observation). */
export type CompilationRow = Partial<WaterLevelObservationRow>

type StatusSource = {
  groundwater_level_reason?: string | null
  level_status?: string | null
}

/**
 * Level status (lexicon category `level_status`): `groundwater_level_reason`,
 * falling back to `level_status`, trimmed. Null/blank prints as an empty cell —
 * never synthesized text.
 */
export const levelStatusOf = (o: StatusSource | null | undefined): string =>
  (o?.groundwater_level_reason ?? o?.level_status ?? '').trim()

const newestFirst = <T extends { observation_datetime?: string | Date | null }>(
  rows: readonly T[]
): T[] =>
  rows
    .filter((row) => row.observation_datetime != null)
    .sort(
      (a, b) =>
        new Date(b.observation_datetime!).getTime() -
        new Date(a.observation_datetime!).getTime()
    )

/**
 * Field events → observation-shaped rows, newest first. Moved from
 * well-show.tsx (recentObservations); `level_status` now carries the
 * normalized status so every renderer prints the same string.
 */
export const buildCompilationRows = (
  fieldEvents: readonly (IFieldEvent | null | undefined)[] | null | undefined
): CompilationRow[] =>
  newestFirst(
    (fieldEvents ?? [])
      .slice(0, FCN_HISTORY_FIELD_EVENT_LIMIT)
      .flatMap((event) =>
        (event?.field_activities ?? []).flatMap((activity) =>
          (activity.samples ?? []).flatMap((sample) =>
            (sample.observations ?? []).map(
              (observation): CompilationRow => {
                const status = levelStatusOf(observation as StatusSource)
                return {
                  ...observation,
                  depth_to_water_bgs: observation.depth_to_water_bgs ?? undefined,
                  measuring_point_height:
                    observation.measuring_point_height ?? undefined,
                  value: observation.value ?? undefined,
                  level_status: status || null,
                  water_level_method: sample.sample_method ?? undefined,
                  water_level_status:
                    observation.groundwater_level_reason ?? undefined,
                  water_level_measuring_staff: sample.contact?.name ?? undefined,
                  water_level_notes:
                    sample.notes ?? activity.notes ?? event?.notes ?? undefined,
                  water_level_data_quality:
                    observation.nma_data_quality ?? undefined,
                } as CompilationRow
              }
            )
          )
        )
      )
  )

/** "YYYY–YYYY" over every dated observation (full history, not the printed window). */
export const yearSpanOf = (
  observations: readonly { observation_datetime?: string | Date | null }[]
): string => {
  const years = observations
    .filter((o) => o.observation_datetime != null)
    .map((o) => new Date(o.observation_datetime!).getFullYear())
    .filter((y) => !Number.isNaN(y))
  return years.length ? `${Math.min(...years)}–${Math.max(...years)}` : ''
}

export type WellCompilationModel = {
  rows: CompilationRow[]
  chartSeries: IHydrographDatasource[]
  yearSpan: string
}

/** The adapter: the only place rows, chart series and year span are derived. */
export const buildWellCompilationModel = ({
  well,
  fieldEvents,
  history,
}: {
  well: Pick<IWell, 'id' | 'name'> | null | undefined
  fieldEvents: readonly (IFieldEvent | null | undefined)[] | null | undefined
  history: readonly Partial<IObservation>[] | null | undefined
}): WellCompilationModel => {
  const fullHistory = history ?? []
  return {
    rows: buildCompilationRows(fieldEvents),
    chartSeries: buildHydrographDatasource(well, fullHistory),
    yearSpan: yearSpanOf(fullHistory),
  }
}

// ─── Fetching ──────────────────────────────────────────────────────────────

const HISTORY_PAGE_SIZE = 1000

type ListProvider = {
  getList: (params: any) => Promise<{ data: unknown[]; total?: number }>
}

/** Every page of `observation/groundwater-level` for one well. */
export const fetchObservationHistory = async (
  provider: ListProvider,
  thingId: string | number
): Promise<Partial<IObservation>[]> => {
  const page = (currentPage: number) =>
    provider.getList({
      resource: 'observation/groundwater-level',
      pagination: { currentPage, pageSize: HISTORY_PAGE_SIZE },
      meta: { params: { thing_id: thingId } },
    })
  const first = await page(1)
  const totalPages = Math.max(
    1,
    Math.ceil((first.total ?? first.data.length) / HISTORY_PAGE_SIZE)
  )
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) => page(i + 2))
  )
  return [first, ...rest].flatMap((p) => p.data as Partial<IObservation>[])
}

/** react-query options for the history, shared so preview and Download hit one cache entry. */
export const observationHistoryQuery = (
  provider: ListProvider,
  thingId: string | number | undefined
) => ({
  queryKey: ['fcn-observation-history', thingId == null ? '' : String(thingId)] as const,
  queryFn: () => fetchObservationHistory(provider, thingId as string | number),
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
})

type DetailsProvider = ListProvider & {
  custom?: (params: { url: string; method: 'get' }) => Promise<{ data: unknown }>
}

/** Batch export: details + full history for one well, then the adapter. */
export const fetchWellCompilationData = async (
  provider: DetailsProvider,
  wellId: number
): Promise<{ details: IWellDetails; model: WellCompilationModel }> => {
  if (!provider.custom) {
    throw new Error('Ocotillo data provider custom method is not available')
  }
  const [detailsResult, history] = await Promise.all([
    provider.custom({ url: `thing/water-well/${wellId}/details`, method: 'get' }),
    fetchObservationHistory(provider, wellId).catch((error) => {
      console.warn(`Failed to load observation history for well ${wellId}`, error)
      return [] as Partial<IObservation>[]
    }),
  ])
  const details = detailsResult.data as IWellDetails
  return {
    details,
    model: buildWellCompilationModel({
      well: details.well,
      fieldEvents: details.field_events,
      history,
    }),
  }
}

/** Preview: the same adapter fed by the cached details query and the history query. */
export const useWellCompilationData = (
  thingId: string | number | undefined,
  well?: Pick<IWell, 'id' | 'name'> | null
) => {
  const dataProvider = useDataProvider()
  const details = useWellDetails(thingId)
  const history = useQuery({
    ...observationHistoryQuery(dataProvider('ocotillo') as ListProvider, thingId),
    enabled: Boolean(thingId),
  })

  const model = useMemo(
    () =>
      buildWellCompilationModel({
        well: well ?? details.well,
        fieldEvents: details.data?.field_events,
        history: history.data,
      }),
    [well, details.well, details.data?.field_events, history.data]
  )

  return {
    ...model,
    details: details.data,
    isLoading: details.isLoading || history.isLoading,
  }
}
