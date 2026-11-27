import {
  Component,
  createElement,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { HydrographPngExporter } from '@/components/HydrographPngExporter'
import { PDF_DEFAULT_VALUES } from '@/config'
import type { IPdfOptions } from '@/interfaces'
import type { IHydrographDatasource, IHydrographOptions } from '@/interfaces/st2'
import { buildFieldSheetHydrographOptions } from '@/pages/ocotillo/thing/hydrographDatasource'

/**
 * Field Compilation Notes page-2 hydrograph: the one awaited chart → data-URL
 * builder for the preview, the well page's Download and the batch export.
 *
 * `build(series)` resolves to a data URL or an explicit error. Completion is
 * the chart's own `finished` signal (HydrographPngExporter); the timeout is
 * only a backstop, so "Hydrograph unavailable" on the sheet means a real
 * failure (or no data), never a race.
 */

export type HydrographPdfResult =
  | { ok: true; dataUrl: string }
  | {
      ok: false
      error: 'no-data' | 'timeout' | 'render-failed' | 'superseded' | 'unmounted'
      message?: string
    }

/** Backstop only: a painted chart reports in well under this. */
export const HYDROGRAPH_PDF_TIMEOUT_MS = 8000

/** Chart options every field-sheet hydrograph is exported with (zoom slider / ticks unchanged). */
export const FIELD_SHEET_HYDROGRAPH_OPTIONS: IHydrographOptions =
  buildFieldSheetHydrographOptions(
    PDF_DEFAULT_VALUES as IPdfOptions & Partial<IHydrographOptions>
  )

/** Data URL for the sheet, or null (page 2 then prints "Hydrograph unavailable"). */
export const hydrographImageOf = (result: HydrographPdfResult | null | undefined) =>
  result?.ok ? result.dataUrl : null

/** A chart that throws while rendering settles its job instead of crashing the page. */
class HydrographErrorBoundary extends Component<
  { onError: (message: string) => void; children?: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    this.props.onError(error instanceof Error ? error.message : String(error))
  }
  render() {
    return this.state.failed ? null : (this.props.children ?? null)
  }
}

type Job = {
  key: number
  series: IHydrographDatasource[]
  settle: (result: HydrographPdfResult) => void
}

/**
 * Owns at most one off-screen chart. Render `element` somewhere in the tree
 * (it is null when idle); `build` mounts the chart, awaits completion and
 * unmounts it. A new `build` supersedes one still in flight.
 */
export const useHydrographPdf = () => {
  const [job, setJob] = useState<Job | null>(null)
  const current = useRef<Job | null>(null)

  useEffect(
    () => () => {
      current.current?.settle({ ok: false, error: 'unmounted' })
    },
    []
  )

  const build = useCallback(
    (series: IHydrographDatasource[]): Promise<HydrographPdfResult> => {
      current.current?.settle({ ok: false, error: 'superseded' })
      if (!series.length || !series.some((s) => s.data?.length)) {
        return Promise.resolve({ ok: false, error: 'no-data' })
      }
      return new Promise<HydrographPdfResult>((resolve) => {
        let timer: ReturnType<typeof setTimeout> | undefined
        const next: Job = {
          key: Date.now() + Math.random(),
          series,
          settle: (result) => {
            if (current.current !== next) return
            current.current = null
            if (timer) clearTimeout(timer)
            setJob((active) => (active === next ? null : active))
            resolve(result)
          },
        }
        timer = setTimeout(
          () => next.settle({ ok: false, error: 'timeout' }),
          HYDROGRAPH_PDF_TIMEOUT_MS
        )
        current.current = next
        setJob(next)
      })
    },
    []
  )

  const element = job
    ? createElement(
        HydrographErrorBoundary,
        {
          key: job.key,
          onError: (message: string) =>
            job.settle({ ok: false, error: 'render-failed', message }),
        },
        createElement(HydrographPngExporter, {
          datasource: job.series,
          options: FIELD_SHEET_HYDROGRAPH_OPTIONS,
          refreshKey: job.key,
          onPngReady: (dataUrl: string) => job.settle({ ok: true, dataUrl }),
          onError: (message: string) =>
            job.settle({ ok: false, error: 'render-failed', message }),
        })
      )
    : null

  return { build, element }
}
