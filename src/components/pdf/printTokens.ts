/**
 * Print design tokens for the field-compilation PDF.
 *
 * Source: mock-up palette measured at 300 dpi from
 * `/Users/robbalch/Downloads/Field Compilation Sheet Wireframes.pdf` —
 * see `NMBG/tasks/preview-compilation/audit/mockup/measure/MOCK-PALETTE-2026-10-23.md`.
 *
 * The mock-up is the design Liz approved (Rob, 2026-10-23). These values are
 * the literal hex codes sampled from the rendered mock-up page:
 *
 *   accent     #3f5e8c  thin rules, small accent marks (never a fill band)
 *   accentText #ffffff  white-on-dark text (logo, legacy)
 *   body       #2e3137  primary text
 *   secondary  #88909c  captions, footers, unit hints
 *   panel      #eef1f5  info grid fill, zebra rows
 *   band       #f3f3f1  zebra / secondary band (warm neutral)
 *   bandStrong #ececea  primary section-header band fill
 *   hairline   #cdcfd0  table row separators, image and note borders
 *   radius     4        cards, grids, note pads
 *
 * Type scale — the mock-up's, promoted to the whole document. Nothing in the
 * print path may render below `micro` (8) except the logo wordmark; the 5.5 pt
 * DTW header that AC2 flagged is retired by importing from here instead of
 * overriding at the call site.
 */
export const PRINT = {
  accent: '#3f5e8c',
  accentText: '#ffffff',
  body: '#2e3137',
  secondary: '#88909c',
  panel: '#eef1f5',
  band: '#f3f3f1',
  bandStrong: '#ececea',
  hairline: '#cdcfd0',
  radius: 4,
} as const

export const PRINT_TYPE = {
  title: 14,
  section: 10,
  label: 9,
  body: 8.5,
  caption: 8,
} as const
