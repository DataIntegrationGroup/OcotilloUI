import type { IHydrographDatasource, IHydrographOptions } from '@/interfaces/st2'

type HydrographWell = { id?: number | string | null; name?: string | null } | null | undefined

type HydrographObservation = {
  observation_datetime?: string | Date | null
  value?: number | null
  depth_to_water_bgs?: number | null
}

/**
 * Field-sheet hydrograph series (page 2). Pure: shared by the PDF preview and
 * the well page's Download so both draw the same chart. Rows need a datetime
 * and a numeric `value`; points plot `depth_to_water_bgs`, oldest first.
 */
export const buildHydrographDatasource = (
  well: HydrographWell,
  observations: readonly HydrographObservation[] | null | undefined
): IHydrographDatasource[] => {
  if (!observations?.length) return []

  const data = observations
    .filter((o) => o.observation_datetime && typeof o.value === 'number')
    .map((o) => ({
      phenomenonTime: o.observation_datetime,
      result: Number(o.depth_to_water_bgs),
    }))
    .sort(
      (a, b) =>
        new Date(a.phenomenonTime as string | Date).getTime() -
        new Date(b.phenomenonTime as string | Date).getTime()
    )

  if (!data.length) return []

  return [
    {
      id: Number(well?.id ?? 0),
      name: well?.name ?? 'Depth to Water',
      style: 'scatter',
      data,
    },
  ] as IHydrographDatasource[]
}

type ChartDefaults = Pick<
  IHydrographOptions,
  'useNormalization' | 'useElevation' | 'useCompact' | 'dataZoom' | 'showToolbox' | 'invertYAxis'
>

/** Chart options the field-sheet hydrograph PNG is exported with. */
export const buildFieldSheetHydrographOptions = (
  defaults: Partial<ChartDefaults>
): IHydrographOptions =>
  ({
    useNormalization: defaults.useNormalization,
    useElevation: defaults.useElevation,
    useCompact: defaults.useCompact,
    dataZoom: defaults.dataZoom,
    showToolbox: defaults.showToolbox,
    invertYAxis: defaults.invertYAxis,
    // Extends the x-axis range to create blank space on the right side of the chart.
    // This does NOT change the groundwater measurements; it only shifts the
    // plotted data left so hydrologists have room to annotate the printed hydrograph.
    rightPaddingPercent: 30,
  }) as IHydrographOptions
