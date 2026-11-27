import { useCallback, useEffect, useRef } from 'react'
import { useTheme, Box } from '@mui/material'
import { IHydrographDatasource, IHydrographOptions } from '@/interfaces/st2'
import {
  Hydrograph,
  HydrographHandle,
} from '@/components/Hydrographs/Hydrograph'

/**
 * Off-screen chart → PNG. A missing image always means a real failure:
 * `onError` fires when the painted chart yields no PNG.
 *
 * Why not just `onEvents={{ finished }}`: echarts-for-react calls `setOption`
 * before `bindEvents` (node_modules/echarts-for-react/lib/core.js), and
 * Hydrograph's option sets `animation: false`, so a static chart dispatches its
 * only `finished` inside `setOption` — before any `onEvents` handler exists,
 * and nothing renders again to re-emit it. So the export happens in
 * `onChartReady`, which echarts-for-react calls after `setOption` (the canvas
 * is already painted) — on the next animation frame. `finished` is then bound
 * on the instance to cover later renders (resize, data zoom); both paths are
 * idempotent via `settled`.
 *
 * Drive it through `useHydrographPdf` (components/pdf/fieldCompilation/
 * hydrographPdf.ts) rather than mounting it directly.
 */
export const HydrographPngExporter = ({
  datasource,
  options,
  refreshKey,
  onPngReady,
  onError,
}: {
  datasource: IHydrographDatasource[]
  options?: IHydrographOptions
  refreshKey?: any // bump to force re-render/export
  onPngReady: (pngDataUrl: string) => void
  onError?: (message: string) => void
}) => {
  const theme = useTheme()
  const hydrographRef = useRef<HydrographHandle>(null)
  const settled = useRef(false)
  const frame = useRef<number | null>(null)

  /** Export once: first paint wins, later `finished` events are no-ops. */
  const handleFinished = useCallback(() => {
    if (settled.current) return
    settled.current = true
    try {
      const png = hydrographRef.current?.toPngDataUrl({
        pixelRatio: 3,
        backgroundColor: theme.palette.background.paper,
      })
      if (png) onPngReady(png)
      else onError?.('chart painted but produced no image')
    } catch (error) {
      onError?.(error instanceof Error ? error.message : String(error))
    }
  }, [onPngReady, onError, theme])

  /**
   * `setOption` has run, so the first paint is on the canvas. Export next
   * frame; keep `finished` for any later render of this instance.
   */
  const handleChartReady = useCallback(
    (instance: any) => {
      instance?.on?.('finished', handleFinished)
      if (frame.current != null) cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => {
        frame.current = null
        handleFinished()
      })
    },
    [handleFinished]
  )

  useEffect(
    () => () => {
      if (frame.current != null) cancelAnimationFrame(frame.current)
    },
    []
  )

  return (
    // Off-screen render (still in DOM so canvas works)
    <Box
      sx={{
        position: 'absolute',
        left: -10000,
        top: 0,
        width: 900, // export resolution basis
        height: 400,
        pointerEvents: 'none',
        opacity: 0,
        overflow: 'hidden',
      }}
    >
      <Hydrograph
        ref={hydrographRef}
        datasource={datasource}
        refresh={typeof refreshKey === 'number' ? refreshKey : 0}
        options={options}
        onChartReady={handleChartReady}
        sx={{ width: 900, height: 400 }}
      />
    </Box>
  )
}
