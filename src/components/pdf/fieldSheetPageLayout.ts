/**
 * Photo column budget for field sheet page 1 (BDMS-1504).
 *
 * Rob, 2026-10-22: the photo column is capped at five. Rather than a fixed
 * photo+ruled *count* (which wrongly assumed a photo row and a ruled row are the
 * same height), the right column is now filled by a measured height budget. The
 * column spans y≈40..739 ≈ 700 pt (measure_column.py); photos take the largest
 * frame the sheet ships (140 pt), ruled panels fill whatever height is left, and
 * a short tail panel at the column foot absorbs the final remainder so the column
 * fills to the bottom with no big gap.
 */
export const PHOTO_SLOT_CAP = 5

/**
 * Ruled lines inside one full-width fill slot. Six lines is the most that keeps
 * six slots inside a LETTER page's content box; the height was measured by
 * rendering the 0-photo fixture and counting pages.
 */
export const FIELD_SHEET_RULED_LINES = 6

/** Ruled lines beside a photograph: bounded by the 140pt image frame. */
export const FIELD_SHEET_NOTE_LINES = 8

// Height budget for the right column, measured 2026-10-22 with measure_column.py
// (72 dpi, body ink, footer excluded) against the 0-photo render: the column
// spans y≈40..739 ≈ 700 pt.
const COLUMN_BUDGET = 700
// One full ruled panel: 6 lines × 16 + 2 border + 8 marginBottom = 106 pt.
const RULED_PANEL = 106
// One photo row above its frame: caption marginTop 2 + caption line 8 + row
// marginBottom 8 = 19 pt.
const ROW_OVERHEAD = 19
// The frame the sheet ships today; photos never get taller than this.
const MAX_FRAME = 140

export type FieldSheetSlotPlan = {
  photos: number
  ruled: number
  frameHeight: number   // photo frame height in pt; 0 when photos === 0
  tailLines: number     // lines in one extra short panel at the column foot; 0 = none
}

export const fieldSheetSlotPlan = (photoCount: number): FieldSheetSlotPlan => {
  const count = Number.isFinite(photoCount)
    ? Math.max(0, Math.floor(photoCount))
    : 0
  const photos = Math.min(count, PHOTO_SLOT_CAP)

  // Off mode: no frame, fill the column with six ruled panels.
  if (photos === 0) {
    return { photos: 0, ruled: 6, frameHeight: 0, tailLines: 0 }
  }

  const space = COLUMN_BUDGET - photos * (MAX_FRAME + ROW_OVERHEAD)
  let frameHeight: number
  let ruled: number
  let slack: number

  if (space < 0) {
    // Photos alone overrun the column: shrink frames to fit, drop ruled panels,
    // and let the leftover slack become a tail panel.
    frameHeight = Math.floor(COLUMN_BUDGET / photos - ROW_OVERHEAD)
    ruled = 0
    slack = COLUMN_BUDGET - photos * (frameHeight + ROW_OVERHEAD)
  } else {
    frameHeight = MAX_FRAME
    ruled = Math.min(6, Math.floor(space / RULED_PANEL))
    slack = space - ruled * RULED_PANEL
  }

  // A tail panel costs 2 border + 8 marginBottom on top of its lines (like a
  // full panel), so count only lines that clear that overhead.
  const tailLines = slack >= 58 ? Math.max(3, Math.floor((slack - 10) / 16)) : 0

  return { photos, ruled, frameHeight, tailLines }
}
