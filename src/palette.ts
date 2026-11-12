// ── Single source of truth for shared neutrals across PDF, MUI theme, and Tailwind CSS ──
// All hex values must already exist in src/theme.ts or src/index.css. No new hex values
// may be introduced here — if a colour needs to change, update src/theme.ts and/or the
// relevant oklch custom properties, then sync this file.

// ── Tailwind-compatible ramps (hex) ────────────────────────────────────────────

export const white = '#ffffff'

export const gray = {
  50:  '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
} as const

export const zinc = {
  50:  '#fafafa',
  100: '#f4f4f5',
  200: '#e4e4e7',
  300: '#d4d4d8',
  400: '#a1a1aa',
  500: '#71717a',
  600: '#52525b',
  700: '#3f3f46',
  800: '#27272a',
  900: '#18181b',
} as const

export const emerald = {
  500: '#10b981',
  700: '#047857',
} as const

// ── PDF / Theme semantic keys — references into the ramps, not new literals ────

export const pdf = {
  textPrimary:   gray[900],    // #111827
  textMuted:     gray[500],    // #6b7280
  textSecondary: gray[600],    // #4b5563
  borderTable:   gray[300],    // #d1d5db
  borderSection: gray[200],    // #e5e7eb
  bgHeader:      gray[100],    // #f3f4f6
  lineColor:     gray[500],    // #6b7280 (same as textMuted)
  white:         white,        // #ffffff
  cardSurface:   zinc[50],     // #fafafa
  accentPrimary: emerald[500], // #10b981
} as const

export type PdfPalette = keyof typeof pdf
