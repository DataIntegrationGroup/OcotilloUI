import { describe, expect, it, vi } from 'vitest'
import {
  chunkMeasurements,
  MAX_POINTS_PER_BLOCK,
  parseOverlapConflict,
  publishInBatches,
  type PublishTally,
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

describe('chunkMeasurements', () => {
  // One reading a minute from midnight UTC.
  const minutes = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      time: new Date(Date.UTC(2024, 0, 1, 0, index)),
      value: 10,
    }))

  it('caps each publish request at 5,000 points', () => {
    expect(MAX_POINTS_PER_BLOCK).toBe(5000)
    const batches = chunkMeasurements(minutes(12_001))
    expect(batches.map((batch) => batch.length)).toEqual([5000, 5000, 2001])
  })

  it('keeps a series that fits as one batch', () => {
    expect(chunkMeasurements(minutes(5000))).toHaveLength(1)
  })

  it('writes batches in time order without losing or repeating a point', () => {
    const series = minutes(7).reverse()
    const batches = chunkMeasurements(series, 3)
    expect(batches.flat().map((p) => p.time.getTime())).toEqual(
      minutes(7).map((p) => p.time.getTime())
    )
  })

  it('never splits readings that share a timestamp across two blocks', () => {
    const series = [
      point('2024-01-01T00:00:00Z'),
      point('2024-01-01T00:01:00Z'),
      point('2024-01-01T00:01:00Z', 11),
      point('2024-01-01T00:02:00Z'),
    ]
    expect(chunkMeasurements(series, 2).map((batch) => batch.length)).toEqual([
      3, 1,
    ])
  })

  it('has nothing to write for an empty series', () => {
    expect(chunkMeasurements([])).toEqual([])
  })
})

describe('publishInBatches', () => {
  const series = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      time: new Date(Date.UTC(2024, 0, 1, 0, index)),
      value: 10,
    }))

  const emptyTally = (): PublishTally => ({ blockIds: [], count: 0 })

  it('writes every batch as its own block and tallies them', async () => {
    let nextId = 100
    const post = vi.fn(async (batch: unknown[]) => ({
      block: { id: nextId++ },
      observation_count: batch.length,
    }))
    const onBatch = vi.fn()
    const tally = emptyTally()

    const result = await publishInBatches([series(7)], post, tally, onBatch, 3)

    expect(result).toEqual({ ok: true })
    expect(post.mock.calls.map(([batch]) => batch.length)).toEqual([3, 3, 1])
    expect(onBatch.mock.calls).toEqual([
      [0, 3],
      [1, 3],
      [2, 3],
    ])
    expect(tally).toEqual({ blockIds: [100, 101, 102], count: 7 })
  })

  it('splits each run on its own, never joining two runs into one block', async () => {
    const post = vi.fn(async (batch: unknown[]) => ({
      observation_count: batch.length,
    }))

    await publishInBatches([series(4), series(2)], post, emptyTally(), undefined, 3)

    expect(post.mock.calls.map(([batch]) => batch.length)).toEqual([3, 1, 2])
  })

  it('stops at the first failure and hands back what was not written', async () => {
    const conflict = new Error('409')
    const post = vi
      .fn()
      .mockResolvedValueOnce({ block: { id: 1 }, observation_count: 3 })
      .mockRejectedValueOnce(conflict)
    const tally = emptyTally()
    const points = series(7)

    const result = await publishInBatches([points], post, tally, undefined, 3)

    expect(post).toHaveBeenCalledTimes(2)
    expect(tally).toEqual({ blockIds: [1], count: 3 })
    expect(result).toEqual({
      ok: false,
      error: conflict,
      remaining: points.slice(3),
    })
  })
})

