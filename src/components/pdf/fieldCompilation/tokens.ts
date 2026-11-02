// ── PDF styles colour tokens ────────────────────────────────────────────────
// PDF-only palette. UI equivalents live in src/theme.ts and are not wired to this file.
// These nine values are pinned to the golden master; changing one requires
// UPDATE_GOLDEN and Rob's approval.

export { pdf as pdfTokens } from '@/palette'
export type PdfPalette = keyof typeof import('@/palette').pdf
