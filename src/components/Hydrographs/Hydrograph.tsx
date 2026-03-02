import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import ReactECharts from 'echarts-for-react'
import type {
  IHydrographDatasource,
  IHydrographOptions,
} from '@/interfaces/st2'
import { Box, useTheme } from '@mui/material'
import { transform } from '@/utils'

export const ST2Hydrograph: React.FC<{
  datasource: IHydrographDatasource[]
  refresh: number
  options?: IHydrographOptions
}> = ({ datasource, refresh, options }) => {
  return (
    <Hydrograph datasource={datasource} refresh={refresh} options={options} />
  )
}

interface HydrographProps {
  datasource: IHydrographDatasource[]
  refresh?: number
  options?: IHydrographOptions
  onEvents?: any
  sx?: object
}

export type HydrographHandle = {
  toPngDataUrl: (opts?: { pixelRatio?: number }) => string
}

export const Hydrograph = forwardRef<HydrographHandle, HydrographProps>(
  ({ datasource, refresh, options, onEvents, sx }, ref) => {
    const theme = useTheme()
    const chartRef = useRef<ReactECharts>(null)

    const chartData = useMemo(() => {
      if (!datasource?.length)
        return { series: [], dataset: [], seriesNames: [] }

      const xtag = 'phenomenonTime'
      const ytag = 'result'

      const dataset = datasource.map((s, index) => {
        const ref = s.data[0]?.[ytag] ?? 0
        let offset = 0

        if (index > 0) {
          const prev = datasource[index - 1]
          const pref = prev.data[0]?.[ytag] ?? 0
          const diffs = prev.data.map((obs) => obs[ytag] - pref)
          offset = Math.max(...diffs) * 1.1
        }

        return {
          id: s.id.toString(),
          source: s.data.map((obs) => [
            new Date(obs[xtag]),
            Number(
              transform({
                value: obs[ytag],
                reference: ref,
                offset,
                options,
              }).toFixed(2)
            ),
          ]),
        }
      })

      const series = datasource.map((s) => ({
        type: s.style || 'line',
        symbol: 'circle',
        name: s.name,
        datasetId: s.id.toString(),
        clip: false,
      }))

      const seriesNames = datasource.map((d) => d.name)

      return { dataset, series, seriesNames }
    }, [datasource])

    const yaxisTitle = useMemo(() => {
      if (options?.useNormalization)
        return 'Normalized Depth To Water Below Ground Surface (ft)'
      if (options?.useElevation)
        return 'Groundwater Elevation Above Sea Level (ft)'
      if (options?.useCompact)
        return 'Compact Depth To Water Below Ground Surface (ft)'
      return 'Depth To Water Below Ground Surface (ft)'
    }, [options])

    const dataZoomRange = useMemo(() => {
      switch (options?.dataZoom) {
        case 'latest':
          return { start: 80, end: 100 }
        case 'earliest':
          return { start: 0, end: 20 }
        default:
          return { start: -1, end: 100 }
      }
    }, [options])

    const chartOption = useMemo(
      () => ({
        animation: false,
        dataset: chartData.dataset,
        series: chartData.series,
        toolbox: options?.showToolbox
          ? {
              feature: {
                dataZoom: [{ show: true }, { type: 'inside' }],
                restore: {},
                saveAsImage: {},
                dataView: { show: true },
                brush: { type: ['lineX', 'clear'] },
              },
            }
          : undefined,
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross', animation: false },
          backgroundColor: theme.palette.background.paper,
        },
        dataZoom: [
          { show: true, realtime: true, ...dataZoomRange },
          { type: 'inside', realtime: true, ...dataZoomRange },
        ],
        xAxis: {
          type: 'time',
          splitLine: { show: true },
          axisLabel: { color: theme.palette.text.secondary },
        },
        yAxis: {
          inverse: options?.invertYAxis ?? true,
          name: yaxisTitle,
          nameLocation: 'center',
          nameGap: 50,
          scale: true,
          axisLabel: { color: theme.palette.text.secondary },
        },
        brush: { outOfBrush: { colorAlpha: 0.25 } },
        color: ['#0277BD', '#F57C00', '#2E7D32'],
      }),
      [chartData, dataZoomRange, yaxisTitle, options, theme]
    )

    useImperativeHandle(ref, () => ({
      toPngDataUrl: ({ pixelRatio = 3 } = {}) => {
        const inst = chartRef.current?.getEchartsInstance?.()
        if (!inst) return ''
        return inst.getDataURL({
          type: 'png',
          pixelRatio, // 2–4 is usually good for print
          backgroundColor: theme.palette.background.paper,
          excludeComponents: ['toolbox'], // optional
        })
      },
    }))

    return (
      <Box component="div" sx={{ height: 400, ...sx }}>
        <ReactECharts
          ref={chartRef}
          key={refresh}
          option={chartOption}
          style={{ width: '100%', height: '100%' }}
          onEvents={onEvents}
        />
      </Box>
    )
  }
)

Hydrograph.displayName = 'Hydrograph'
