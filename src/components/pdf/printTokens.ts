/**
 * Print design tokens for the field-compilation PDF.
 *
 * The owner page (`FieldSheetPageTwo.tsx`) is the reference design — Rob's call
 * on 2026-10-22: it follows the wireframe closely and uses the page better than
 * the wireframe did. Rather than let each sheet invent its own palette, the
 * owner page's vocabulary lives here and every sheet imports it.
 *
 * Values are the literal ones the owner page already printed with, measured
 * back out of the rendered PDF (`tools/pdf_tokens.py`) on 2026-10-22:
 *
 *   accent   #1a5276  table header bands, field labels, titles, 3 pt rules
 *   body     #333     table body text
 *   secondary #555    captions, footers, unit hints
 *   panel    #f5f8fc  info grid fill, zebra rows
 *   band     #f8f8f8  reserved/empty block fill
 *   hairline #ddd     table row separators, image and note borders
 *   radius   4        cards, grids, note pads
 *
 * Type scale — the owner page's, promoted to the whole document. Nothing in the
 * print path may render below `micro` (8) except the logo wordmark; the 5.5 pt
 * DTW header that AC2 flagged is retired by importing from here instead of
 * overriding at the call site.
 */
export const PRINT = {
  accent: '#1a5276',
  accentText: '#ffffff',
  body: '#333',
  secondary: '#555',
  panel: '#f5f8fc',
  band: '#f8f8f8',
  hairline: '#ddd',
  radius: 4,
} as const

export const PRINT_TYPE = {
  title: 14,
  section: 10,
  label: 9,
  body: 8.5,
  caption: 8,
} as const
