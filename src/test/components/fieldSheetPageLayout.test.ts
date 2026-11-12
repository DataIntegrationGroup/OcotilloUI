import { describe, expect, it } from 'vitest'
import {
  FIELD_SHEET_NOTE_LINES,
  FIELD_SHEET_RULED_LINES,
  fieldSheetSlotPlan,
  PHOTO_SLOT_CAP,
} from '@/components/pdf/fieldSheetPageLayout'

describe('fieldSheetSlotPlan', () => {
  it('prints three photos and two ruled slots for a five-photo well', () => {
    expect(fieldSheetSlotPlan(5)).toEqual({ photos: 3, ruled: 2 })
  })

  it('prints one photo and four ruled slots for a one-photo well', () => {
    expect(fieldSheetSlotPlan(1)).toEqual({ photos: 1, ruled: 4 })
  })

  it('fills a photo-less well with six ruled slots', () => {
    expect(fieldSheetSlotPlan(0)).toEqual({ photos: 0, ruled: 6 })
  })

  it('never prints more than three photos', () => {
    expect(fieldSheetSlotPlan(12).photos).toBe(PHOTO_SLOT_CAP)
  })

  it('treats a negative or non-finite count as no photos', () => {
    expect(fieldSheetSlotPlan(-2)).toEqual({ photos: 0, ruled: 6 })
    expect(fieldSheetSlotPlan(Number.NaN)).toEqual({ photos: 0, ruled: 6 })
  })

  it('keeps the fill slots short enough to stay on one page', () => {
    expect(FIELD_SHEET_RULED_LINES).toBe(6)
    expect(FIELD_SHEET_NOTE_LINES).toBe(8)
  })
})
