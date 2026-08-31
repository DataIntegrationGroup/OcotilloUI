import { useMemo } from 'react'
import { useDataProvider } from '@refinedev/core'
import { useQueries } from '@tanstack/react-query'
import type {
  IObservation,
  ISample,
  IThing,
  IWell,
} from '@/interfaces/ocotillo'

const STALE_TIME_MS = 5 * 60 * 1000
const GC_TIME_MS = 10 * 60 * 1000

/** A site as the associated-sites grid needs it: one flat, sortable row. */
export type AssociatedSiteRow = {
  id: IThing['id']
  name: string
  thingType: string | null
  showPath: string
  lastCheckedDate: string | null
  lastCheckedBy: string | null
  depthToWater: number | null
  wellDepth: number | null
  wellDepthUnit: string | null
  holeDepth: number | null
  holeDepthUnit: string | null
  elevation: number | null
  elevationUnit: string
  latitude: number | null
  longitude: number | null
  isLoading: boolean
}

export const getSiteShowPath = (thing: Pick<IThing, 'id' | 'thing_type'>) => {
  const type = (thing.thing_type || '').toLowerCase()
  if (type === 'spring') return `/ocotillo/spring/show/${thing.id}`
  return `/ocotillo/well/show/${thing.id}`
}

export const latestObservation = (observations: IObservation[]) =>
  observations
    .filter((observation) => observation.observation_datetime)
    .sort(
      (a, b) =>
        new Date(b.observation_datetime!).getTime() -
        new Date(a.observation_datetime!).getTime()
    )[0]

/**
 * Flattens a site and whatever has loaded for it into one grid row.
 *
 * Kept pure and separate from the fetching so the fallback chains — which
 * source wins for the last-checked date, and how a sampler is named — can be
 * tested without standing up a data provider.
 */
export function buildAssociatedSiteRow({
  thing,
  well,
  observations,
  sample,
  isLoading = false,
}: {
  thing: IThing
  well?: IWell
  observations?: IObservation[]
  sample?: ISample
  isLoading?: boolean
}): AssociatedSiteRow {
  const observation = latestObservation(observations ?? [])

  // The well record is the better source once it loads, but a site without one
  // still has its location on the thing.
  const source = well ?? thing
  const coordinates = source?.current_location?.geometry?.coordinates as
    | [number, number, number?]
    | undefined
  const locationProps = source?.current_location?.properties

  return {
    id: thing.id,
    name: thing.name || `Site ${thing.id}`,
    thingType: thing.thing_type ?? null,
    showPath: getSiteShowPath(thing),
    lastCheckedDate:
      sample?.field_event?.event_date ??
      sample?.sample_date ??
      observation?.observation_datetime ??
      null,
    lastCheckedBy:
      sample?.contact?.name && sample?.contact?.organization
        ? `${sample.contact.name} (${sample.contact.organization})`
        : (sample?.contact?.name ?? sample?.sampler_name ?? null),
    depthToWater: observation?.depth_to_water_bgs ?? null,
    wellDepth: well?.well_depth ?? null,
    wellDepthUnit: well?.well_depth_unit ?? 'ft',
    holeDepth: well?.hole_depth ?? null,
    holeDepthUnit: well?.hole_depth_unit ?? 'ft',
    elevation: locationProps?.elevation ?? null,
    elevationUnit: locationProps?.elevation_unit ?? 'ft',
    latitude: coordinates?.[1] ?? null,
    longitude: coordinates?.[0] ?? null,
    isLoading,
  }
}

/**
 * Builds the associated-sites rows for a contact.
 *
 * `contact.things` carries only the bare thing, so each site's depths, latest
 * reading, and who took it have to be fetched. The card this replaced ran
 * those queries inside a per-site component; a grid cannot, so they run here
 * with `useQueries` and land in the row model — which is also what lets the
 * enriched columns sort.
 *
 * The sample naming who took the reading is only identified by the latest
 * observation, so it is fetched in a second pass once those resolve.
 */
export function useAssociatedSiteRows(
  things: IThing[] | null | undefined
): AssociatedSiteRow[] {
  const dataProvider = useDataProvider()
  const ocotillo = useMemo(() => dataProvider('ocotillo'), [dataProvider])

  const items = useMemo(() => things ?? [], [things])

  const wellQueries = useQueries({
    queries: items.map((thing) => ({
      queryKey: ['associated-site', 'well', String(thing.id)],
      staleTime: STALE_TIME_MS,
      gcTime: GC_TIME_MS,
      queryFn: async () => {
        const response = await ocotillo.getOne({
          resource: 'ocotillo.thing-well',
          id: thing.id,
        })
        return response.data as IWell
      },
    })),
  })

  const observationQueries = useQueries({
    queries: items.map((thing) => ({
      queryKey: ['associated-site', 'observations', String(thing.id)],
      staleTime: STALE_TIME_MS,
      gcTime: GC_TIME_MS,
      queryFn: async () => {
        const response = await ocotillo.getList({
          resource: 'observation/groundwater-level',
          pagination: { currentPage: 1, pageSize: 5, mode: 'server' as const },
          sorters: [{ field: 'observation_datetime', order: 'desc' as const }],
          meta: { params: { thing_id: thing.id } },
        })
        return (response.data ?? []) as IObservation[]
      },
    })),
  })

  const sampleIds = observationQueries.map(
    (query) => latestObservation(query.data ?? [])?.sample_id ?? null
  )

  const sampleQueries = useQueries({
    queries: items.map((thing, index) => {
      const sampleId = sampleIds[index]
      return {
        queryKey: ['associated-site', 'sample', String(sampleId ?? 'none')],
        enabled: sampleId != null,
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        queryFn: async () => {
          const response = await ocotillo.getOne({
            resource: 'ocotillo.sample',
            id: sampleId!,
          })
          return response.data as ISample
        },
      }
    }),
  })

  return useMemo(
    () =>
      items.map((thing, index) =>
        buildAssociatedSiteRow({
          thing,
          well: wellQueries[index]?.data,
          observations: observationQueries[index]?.data,
          sample: sampleQueries[index]?.data,
          isLoading:
            wellQueries[index]?.isLoading === true ||
            observationQueries[index]?.isLoading === true,
        })
      ),
    [items, wellQueries, observationQueries, sampleQueries]
  )
}
