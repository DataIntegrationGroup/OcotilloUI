/**
 * Photo column budget for field sheet page 1 (BDMS-1504).
 *
 * Rob, 2026-10-19: the photo column is capped at three, and every unused photo
 * slot becomes ruled note space rather than whitespace. The counts below are the
 * ones BDMS-1504 AC3 names, measured against a LETTER page:
 *
 *   five-photo well → 3 photos + 2 ruled slots
 *   one-photo well  → 1 photo  + 4 ruled slots
 *   no-photo well   → 0 photos + 6 ruled slots
 *
 * A photo row is taller than a ruled row (140pt frame + caption against 8 x 16pt
 * lines), which is why the ruled count is not `6 - photos`.
 */
export const PHOTO_SLOT_CAP = 3

/**
 * Ruled lines inside one full-width fill slot. Six lines is the most that keeps
 * six slots inside a LETTER page's content box; the height was measured by
 * rendering the 0-photo fixture and counting pages.
 */
export const FIELD_SHEET_RULED_LINES = 6

/** Ruled lines beside a photograph: bounded by the 140pt image frame. */
export const FIELD_SHEET_NOTE_LINES = 8

export type FieldSheetSlotPlan = {
  photos: number
  ruled: number
}

export const fieldSheetSlotPlan = (photoCount: number): FieldSheetSlotPlan => {
  const count = Number.isFinite(photoCount)
    ? Math.max(0, Math.floor(photoCount))
    : 0
  const photos = Math.min(count, PHOTO_SLOT_CAP)
  const ruled = photos === 0 ? 6 : Math.max(2, 5 - photos)

  return { photos, ruled }
}
