import { useCallback, useState } from 'react'

// PrusaSlicer-style progressive disclosure: one control switches the whole
// corrector between a narrow, opinionated workflow and the full toolset.
// Simple mode is scoped to pressure-transducer (Diver Office) corrections;
// acoustic-logger tooling (reflections) and the detection tuning knobs only
// appear at higher modes.
export type HydrographUiMode = 'simple' | 'intermediate' | 'advanced'

export const HYDROGRAPH_UI_MODES: readonly HydrographUiMode[] = [
  'simple',
  'intermediate',
  'advanced',
]

export const HYDROGRAPH_UI_MODE_LABELS: Record<HydrographUiMode, string> = {
  simple: 'Simple',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export const HYDROGRAPH_UI_MODE_DESCRIPTIONS: Record<HydrographUiMode, string> =
  {
    simple:
      'Pressure transducer corrections only (Diver Office): convert water head, remove offsets and zeros, shift, and snap to a manual measurement.',
    intermediate:
      'Adds the other logger sources, spurious reflection removal, correction thresholds, and the data table.',
    advanced:
      'Everything: reflection detection methods, temperature assist, and interpolation across removals.',
  }

const MODE_RANK: Record<HydrographUiMode, number> = {
  simple: 0,
  intermediate: 1,
  advanced: 2,
}

export const DEFAULT_HYDROGRAPH_UI_MODE: HydrographUiMode = 'simple'

/** True when `mode` exposes at least as much as `minimum`. */
export const isAtLeastMode = (
  mode: HydrographUiMode,
  minimum: HydrographUiMode
) => MODE_RANK[mode] >= MODE_RANK[minimum]

export const isHydrographUiMode = (
  value: unknown
): value is HydrographUiMode =>
  typeof value === 'string' &&
  (HYDROGRAPH_UI_MODES as readonly string[]).includes(value)

export const HYDROGRAPH_UI_MODE_STORAGE_KEY = 'ocotillo.hydrographCorrection.uiMode'

export const readStoredHydrographUiMode = (): HydrographUiMode => {
  try {
    const stored = window.localStorage.getItem(HYDROGRAPH_UI_MODE_STORAGE_KEY)
    return isHydrographUiMode(stored) ? stored : DEFAULT_HYDROGRAPH_UI_MODE
  } catch {
    // Private-mode / disabled storage: fall back to the default.
    return DEFAULT_HYDROGRAPH_UI_MODE
  }
}

/**
 * Mode state for the corrector, persisted like the app color mode so a user
 * who works in Advanced does not get dropped back to Simple on every visit.
 */
export const useHydrographUiMode = () => {
  const [mode, setModeState] = useState<HydrographUiMode>(
    readStoredHydrographUiMode
  )

  const setMode = useCallback((next: HydrographUiMode) => {
    setModeState(next)
    try {
      window.localStorage.setItem(HYDROGRAPH_UI_MODE_STORAGE_KEY, next)
    } catch {
      // Persistence is best-effort; the session still switches modes.
    }
  }, [])

  return { mode, setMode }
}
