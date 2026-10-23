import { describe, expect, it } from 'vitest'
import {
  FIELD_SHEET_NOTE_LINES,
  FIELD_SHEET_RULED_LINES,
  fieldSheetSlotPlan,
  PHOTO_SLOT_CAP,
} from '@/components/pdf/fieldSheetPageLayout'

describe('fieldSheetSlotPlan', () => {
  it('off mode leaves no frame and fills the column with six ruled panels', () => {
    expect(fieldSheetSlotPlan(0)).toEqual({ photos: 0, ruled: 6, frameHeight: 0, tailLines: 0 })
  })

  it('one photo leaves five ruled panels, full frame, no tail', () => {
    expect(fieldSheetSlotPlan(1)).toEqual({ photos: 1, ruled: 5, frameHeight: 140, tailLines: 0 })
  })

  it('two photos leave three ruled panels and a three-line tail', () => {
    expect(fieldSheetSlotPlan(2)).toEqual({ photos: 2, ruled: 3, frameHeight: 140, tailLines: 3 })
  })

  it('three photos leave two ruled panels, no tail', () => {
    expect(fieldSheetSlotPlan(3)).toEqual({ photos: 3, ruled: 2, frameHeight: 140, tailLines: 0 })
  })

  it('four photos leave no ruled panels and a three-line tail', () => {
    expect(fieldSheetSlotPlan(4)).toEqual({ photos: 4, ruled: 0, frameHeight: 140, tailLines: 3 })
  })

  it('five photos shrink the frame to 121pt, no ruled panels, no tail', () => {
    expect(fieldSheetSlotPlan(5)).toEqual({ photos: 5, ruled: 0, frameHeight: 121, tailLines: 0 })
  })

  it('never frames more than the cap and treats 9 like 5', () => {
    expect(fieldSheetSlotPlan(9)).toEqual(fieldSheetSlotPlan(5))
    expect(fieldSheetSlotPlan(12).photos).toBe(PHOTO_SLOT_CAP)
  })

  it('treats a negative or non-finite count as off mode', () => {
    expect(fieldSheetSlotPlan(-2)).toEqual({ photos: 0, ruled: 6, frameHeight: 0, tailLines: 0 })
    expect(fieldSheetSlotPlan(Number.NaN)).toEqual({ photos: 0, ruled: 6, frameHeight: 0, tailLines: 0 })
  })

  it('keeps the ruled/note line constants untouched', () => {
    expect(FIELD_SHEET_RULED_LINES).toBe(6)
    expect(FIELD_SHEET_NOTE_LINES).toBe(8)
  })
})
