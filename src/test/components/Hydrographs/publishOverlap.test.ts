import { describe, expect, it } from 'vitest'
import {
  parseOverlapConflict,
  splitAroundPublishedBlocks,
  type PublishedBlockSpan,
} from '@/components/Hydrographs/publishOverlap'

const point = (iso: string, value = 10) => ({ time: new Date(iso), value })

const block = (id: number, start: string, end: string): PublishedBlockSpan => ({
  id,
  startTime: new Date(start),
  endTime: new Date(end),
})

// Shape returned by POST /observation/transducer-groundwater-level/block.
const conflictBody = (overlapping: unknown[]) => ({
  detail: [
    {
      loc: ['body', 'measurements'],
      msg: 'Time span overlaps existing block(s) 7.',
      type: 'value_error',
      input: { overlapping_blocks: overlapping },
    },
  ],
})

describe('parseOverlapConflict', () => {
  it('reads block ids and spans from the 409 detail', () => {
    const blocks = parseOverlapConflict(
      conflictBody([
        {
          id: 9,
          start_datetime: '2025-03-10T00:00:00Z',
          end_datetime: '2025-03-12T00:00:00Z',
          review_status: 'not reviewed',
          release_status: 'provisional',
        },
        {
          id: 7,
          start_datetime: '2025-03-01T00:00:00Z',
          end_datetime: '2025-03-05T00:00:00Z',
          review_status: 'not reviewed',
          release_status: 'provisional',
        },
      ])
    )

    expect(blocks.map((b) => b.id)).toEqual([7, 9])
    expect(blocks[0].startTime.toISOString()).toBe('2025-03-01T00:00:00.000Z')
    expect(blocks[0].endTime.toISOString()).toBe('2025-03-05T00:00:00.000Z')
  })

  it('returns nothing for bodies it cannot read', () => {
    expect(parseOverlapConflict(null)).toEqual([])
    expect(parseOverlapConflict({ detail: 'conflict' })).toEqual([])
    expect(
      parseOverlapConflict(conflictBody([{ id: 'x' }, { id: 3 }]))
    ).toEqual([])
  })
})

describe('splitAroundPublishedBlocks', () => {
  it('keeps everything as one run when nothing is published', () => {
    const measurements = [
      point('2025-03-01T00:00:00Z'),
      point('2025-03-02T00:00:00Z'),
    ]
    expect(splitAroundPublishedBlocks(measurements, [])).toEqual({
      runs: [measurements],
      skippedCount: 0,
    })
  })

  it('drops points inside a published block, boundaries included', () => {
    const measurements = [
      point('2025-03-01T00:00:00Z'),
      point('2025-03-02T00:00:00Z'),
      point('2025-03-03T00:00:00Z'),
      point('2025-03-04T00:00:00Z'),
    ]
    const { runs, skippedCount } = splitAroundPublishedBlocks(measurements, [
      block(1, '2025-03-02T00:00:00Z', '2025-03-10T00:00:00Z'),
    ])

    expect(skippedCount).toBe(3)
    expect(runs).toEqual([[measurements[0]]])
  })

  it('splits the remainder on either side of a published block', () => {
    const measurements = [
      point('2025-03-01T00:00:00Z'),
      point('2025-03-02T00:00:00Z'),
      point('2025-03-05T00:00:00Z'),
      point('2025-03-08T00:00:00Z'),
      point('2025-03-09T00:00:00Z'),
    ]
    const { runs, skippedCount } = splitAroundPublishedBlocks(measurements, [
      block(1, '2025-03-04T00:00:00Z', '2025-03-06T00:00:00Z'),
    ])

    expect(skippedCount).toBe(1)
    expect(runs).toEqual([
      [measurements[0], measurements[1]],
      [measurements[3], measurements[4]],
    ])
  })

  it('splits around a block that holds none of the incoming points', () => {
    // A run spanning the block would itself overlap it and be rejected.
    const measurements = [
      point('2025-03-01T00:00:00Z'),
      point('2025-03-07T00:00:00Z'),
    ]
    const { runs, skippedCount } = splitAroundPublishedBlocks(measurements, [
      block(1, '2025-03-03T00:00:00Z', '2025-03-04T00:00:00Z'),
    ])

    expect(skippedCount).toBe(0)
    expect(runs).toEqual([[measurements[0]], [measurements[1]]])
  })

  it('returns no runs when every point is already published', () => {
    const measurements = [
      point('2025-03-02T00:00:00Z'),
      point('2025-03-03T00:00:00Z'),
    ]
    expect(
      splitAroundPublishedBlocks(measurements, [
        block(1, '2025-03-01T00:00:00Z', '2025-03-05T00:00:00Z'),
      ])
    ).toEqual({ runs: [], skippedCount: 2 })
  })
})
