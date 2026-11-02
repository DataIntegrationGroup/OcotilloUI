// ── PDF styles colour tokens ────────────────────────────────────────────────
// PDF-only palette. UI equivalents live in src/theme.ts and are not wired to this file.
// These nine values are pinned to the golden master; changing one requires
// UPDATE_GOLDEN and Rob's approval.

export const pdfTokens = {
  // ── Neutrals (Gray scale) ───────────────────────────────────────────────
  textPrimary:   '#111827',  // gray-900 — body text, title, headings
  textMuted:     '#6b7280',  // gray-500 — footer text, empty-state labels
  textSecondary: '#4b5563',  // gray-600 — image labels, secondary text
  borderTable:   '#d1d5db',  // gray-300 — table borders, dashed lines
  borderSection: '#e5e7eb',  // gray-200 — section cards, grid lines
  bgHeader:      '#f3f4f6',  // gray-100 — table headers, light surfaces
  lineColor:     '#6b7280',  // gray-500 — write-in fill-lines (same as textMuted)

  // ── Surfaces ────────────────────────────────────────────────────────────
  white:         '#ffffff',  // white — page background, card interiors
  cardSurface:   '#fafafa',  // zinc-50 — section card background (off-white)

  // ── Brand / Accent ──────────────────────────────────────────────────────
  accentPrimary: '#10b981',  // emerald-500 — section accent bars
} as const

// ── Type alias for type-safe usage ──────────────────────────────────────────
export type PdfToken = keyof typeof pdfTokens
