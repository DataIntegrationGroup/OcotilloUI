import { describe, it, expect } from 'vitest'
import { getTheme } from '@/theme'

/*
 * F1 — make the palette test falsifiable again.
 *
 * The previous version compared getTheme(mode) against a baseline fixture captured
 * AFTER the E1 refactor (aa162977), so it could never fail: any future drift was
 * absorbed by re-capturing the same file. This replaces that with pinned literals of
 * the currently shipped values.
 *
 * Values as shipped in aa162977. The 2026-11-02 palette refactor moved these from the
 * slate/stone ramp to gray/zinc; that change was reviewed and approved, so it is pinned
 * here as the new floor. Any future refactor that moves one of these fails this test.
 *
 * Read out of src/theme.ts at pin time:
 *   light divider    = zinc[300]  #d4d4d8        dark divider    = zinc[700]  #3f3f46
 *   light primary    = gray[900]  #111827        dark primary    = zinc[100]  #f4f4f5
 *   light secondary  = gray[500]  #6b7280        dark secondary  = zinc[400]  #a1a1aa
 *   bg.default light = zinc[50]   #fafafa        bg.default dark = zinc[900]  #18181b
 *   bg.paper light   = white      #ffffff        bg.paper dark   = zinc[700]  #3f3f46
 */
const PINNED = {
  light: { 'palette.divider': '#d4d4d8', 'palette.text.primary': '#111827',
           'palette.text.secondary': '#6b7280', 'palette.background.default': '#fafafa',
           'palette.background.paper': '#ffffff' },
  dark:  { 'palette.divider': '#3f3f46', 'palette.text.primary': '#f4f4f5',
           'palette.text.secondary': '#a1a1aa', 'palette.background.default': '#18181b',
           'palette.background.paper': '#3f3f46' },
} as const

function collectPinned(mode: 'light' | 'dark') {
  const theme = getTheme(mode) as unknown as Record<string, Record<string, unknown>>
  const palette = (theme.palette ?? {}) as Record<string, unknown>
  const text = (palette.text ?? {}) as Record<string, string>
  const bg = (palette.background ?? {}) as Record<string, string>

  const source: Record<keyof typeof PINNED[typeof mode], string> = {
    'palette.divider': palette.divider as string,
    'palette.text.primary': text.primary as string,
    'palette.text.secondary': text.secondary as string,
    'palette.background.default': bg.default as string,
    'palette.background.paper': bg.paper as string,
  }

  const pinned: Record<keyof typeof PINNED[typeof mode], string> = PINNED[mode]
  const diffs: { path: keyof typeof PINNED[typeof mode]; expected: string; actual: string }[] = []
  for (const [path, expected] of Object.entries(pinned) as [keyof typeof pinned, string][]) {
    const actual = source[path]
    if (actual !== expected) {
      diffs.push({ path, expected, actual })
    }
  }
  return diffs
}

describe('theme palette snapshot equality (F1 — falsifiable)', () => {
  it('light mode palette colours match the pinned floor', () => {
    expect(collectPinned('light'), `Light palette drift: ${JSON.stringify(collectPinned('light'))}`).toEqual([])
  })

  it('dark mode palette colours match the pinned floor', () => {
    expect(collectPinned('dark'), `Dark palette drift: ${JSON.stringify(collectPinned('dark'))}`).toEqual([])
  })
})
