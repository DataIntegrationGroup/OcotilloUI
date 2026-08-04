import { useContext } from 'react'
import type { Theme } from '@glideapps/glide-data-grid'
import { ColorModeContext } from '@/contexts'

// Explicit color themes so the overlay editor's text input is always visible.
// Only colors are set — font properties are left to GDG defaults.
export const GDG_THEME_LIGHT: Partial<Theme> = {
  textDark: '#0f172a',
  textMedium: '#475569',
  textLight: '#94a3b8',
  textHeader: '#64748b',
  textHeaderSelected: '#0f172a',
  textBubble: '#0f172a',
  bgCell: '#ffffff',
  bgCellMedium: '#f8fafc',
  bgHeader: '#f1f5f9',
  bgHeaderHasFocus: '#e2e8f0',
  bgHeaderHovered: '#e2e8f0',
  bgBubble: '#f1f5f9',
  bgBubbleSelected: '#dbeafe',
  bgSearchResult: '#fef9c3',
  accentColor: '#2563eb',
  accentFg: '#ffffff',
  accentLight: '#dbeafe',
  borderColor: '#e2e8f0',
  drilldownBorder: '#e2e8f0',
  linkColor: '#2563eb',
  bgIconHeader: '#f1f5f9',
  fgIconHeader: '#64748b',
}

export const GDG_THEME_DARK: Partial<Theme> = {
  textDark: '#f1f5f9',
  textMedium: '#94a3b8',
  textLight: '#64748b',
  textHeader: '#94a3b8',
  textHeaderSelected: '#f1f5f9',
  textBubble: '#f1f5f9',
  bgCell: '#18181b',
  bgCellMedium: '#27272a',
  bgHeader: '#27272a',
  bgHeaderHasFocus: '#3f3f46',
  bgHeaderHovered: '#3f3f46',
  bgBubble: '#27272a',
  bgBubbleSelected: '#1e3a5f',
  bgSearchResult: '#713f12',
  accentColor: '#3b82f6',
  accentFg: '#ffffff',
  accentLight: '#1e3a5f',
  borderColor: '#3f3f46',
  drilldownBorder: '#3f3f46',
  linkColor: '#60a5fa',
  bgIconHeader: '#27272a',
  fgIconHeader: '#94a3b8',
}

/** Pick the Glide Data Grid theme matching the app's current color mode. */
export function useGdgTheme(): Partial<Theme> {
  const { mode } = useContext(ColorModeContext)
  return mode === 'dark' ? GDG_THEME_DARK : GDG_THEME_LIGHT
}
