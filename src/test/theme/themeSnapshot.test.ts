import { describe, it, expect } from 'vitest'
import { getTheme } from '@/theme'
import baseline from './__fixtures__/theme-baseline.json' with { type: 'json' }

/*
 * Compare only the palette colour values that are shared across PDF and MUI theme.
 * The full MUI theme object contains function references (sxConfig, breakpoints) that
 * vary across captures due to MUI internal restructuring — we ignore those.
 *
 * baseline.light / baseline.dark are already plain objects from JSON.stringify.
 */
function comparePaletteValues(mode: 'light' | 'dark') {
  const current = getTheme(mode) as unknown as Record<string, unknown>
  const base    = baseline[mode] as Record<string, unknown>

  const palette = (current.palette ?? {}) as Record<string, unknown>
  const text    = (palette.text ?? {}) as Record<string, string>
  const divider = palette.divider as string
  const bg      = (palette.background ?? {}) as Record<string, string>

  const bPalette  = (base.palette ?? {}) as Record<string, unknown>
  const bText     = (bPalette.text ?? {}) as Record<string, string>
  const bDivider  = bPalette.divider as string
  const bBg       = (bPalette.background ?? {}) as Record<string, string>

  const checks: { path: string; actual: unknown; expected: unknown }[] = [
    { path: 'palette.text.primary', actual: text.primary, expected: bText.primary },
    { path: 'palette.divider',      actual: divider,      expected: bDivider },
    { path: 'palette.background.default',  actual: bg.default,  expected: bBg.default },
    { path: 'palette.background.paper',    actual: bg.paper,    expected: bBg.paper },
    { path: 'palette.background.wrapper',  actual: bg.wrapper,  expected: bBg.wrapper },
  ]

  for (const c of checks) {
    if (c.actual !== c.expected) return c
  }
  return null
}

describe('theme palette snapshot equality', () => {
  it('light mode palette colours match the pre-edit baseline', () => {
    const diff = comparePaletteValues('light')
    expect(diff, `Light palette drift at ${diff?.path}: expected ${diff?.expected}, got ${diff?.actual}`).toBeNull()
  })

  it('dark mode palette colours match the pre-edit baseline', () => {
    const diff = comparePaletteValues('dark')
    expect(diff, `Dark palette drift at ${diff?.path}: expected ${diff?.expected}, got ${diff?.actual}`).toBeNull()
  })
})
