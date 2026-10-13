import { describe, expect, it } from 'vitest'
import {
  overallPercent,
  REFRESH_STAGE,
  SAVE_STAGE,
  UPLOAD_STAGE,
  uploadFraction,
  uploadingProgress,
} from '@/pages/ocotillo/hydrograph-correction/publishProgress'

describe('uploadFraction', () => {
  it('reads the fraction axios reports', () => {
    expect(uploadFraction({ progress: 0.25 })).toBe(0.25)
  })

  it('works it out from the byte counts when there is no fraction', () => {
    expect(uploadFraction({ loaded: 50, total: 200 })).toBe(0.25)
  })

  it('says nothing when the browser cannot size the body', () => {
    expect(uploadFraction({ loaded: 50 })).toBeNull()
    expect(uploadFraction({ loaded: 50, total: 0 })).toBeNull()
    expect(uploadFraction({})).toBeNull()
  })

  it('keeps a stray value inside 0 to 1', () => {
    expect(uploadFraction({ progress: 1.4 })).toBe(1)
    expect(uploadFraction({ progress: -0.1 })).toBe(0)
    expect(uploadFraction({ progress: Number.NaN })).toBeNull()
  })
})

describe('overallPercent', () => {
  it('counts finished blocks and the part of the current one sent', () => {
    expect(overallPercent(0, 4, 0.5)).toBeCloseTo(12.5)
    expect(overallPercent(2, 4, 0)).toBeCloseTo(50)
  })

  it('is never 100 before the operation is over', () => {
    expect(overallPercent(3, 4, 1)).toBe(99)
  })
})

describe('uploadingProgress', () => {
  const base = { wellName: 'WL-0001' }

  it('shows a single block going up as a percentage', () => {
    expect(uploadingProgress(base, 0.4)).toEqual({
      wellName: 'WL-0001',
      stage: UPLOAD_STAGE,
      percent: 40,
    })
  })

  it('stops claiming a figure once the body is sent and the server works', () => {
    expect(uploadingProgress(base, 1)).toEqual({
      wellName: 'WL-0001',
      stage: SAVE_STAGE,
      percent: null,
    })
  })

  it('shows no figure when the upload cannot be measured', () => {
    expect(uploadingProgress(base, null)).toEqual({
      wellName: 'WL-0001',
      stage: UPLOAD_STAGE,
    })
  })

  it('places a block of several within the whole', () => {
    const step = { current: 2, total: 4 }

    expect(uploadingProgress({ ...base, step }, 0.5)).toMatchObject({
      step,
      stage: UPLOAD_STAGE,
      percent: 37.5,
    })
    // Sent, now saving: holds at the end of its share and keeps climbing from
    // there when the next block starts.
    expect(uploadingProgress({ ...base, step }, 1)).toMatchObject({
      stage: SAVE_STAGE,
      percent: 50,
    })
  })

  it('never moves backwards from one block to the next', () => {
    const total = 3
    const percents = [0, 1, 2].flatMap((index) =>
      [0, 0.5, 1].map(
        (fraction) =>
          uploadingProgress(
            { wellName: 'WL-0001', step: { current: index + 1, total } },
            fraction
          ).percent as number
      )
    )

    expect([...percents].sort((a, b) => a - b)).toEqual(percents)
  })

  it('names the refresh stage the page shows afterwards', () => {
    expect(REFRESH_STAGE).toBe('Refreshing the chart')
  })
})
