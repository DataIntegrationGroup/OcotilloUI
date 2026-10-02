import type { HydrographPoint } from './hydrographCorrection'

// An already-published transducer block the new series collides with, as
// named in the publish endpoint's 409 body.
export interface PublishedBlockSpan {
  id: number
  startTime: Date
  endTime: Date
}

// How the user chose to resolve an overlap with already-published data.
export type PublishOverlapMode = 'overwrite' | 'ignore'

interface RawOverlappingBlock {
  id?: unknown
  start_datetime?: unknown
  end_datetime?: unknown
}

const toBlockSpan = (raw: RawOverlappingBlock): PublishedBlockSpan | null => {
  if (typeof raw.id !== 'number') return null
  if (
    typeof raw.start_datetime !== 'string' ||
    typeof raw.end_datetime !== 'string'
  ) {
    return null
  }
  const startTime = new Date(raw.start_datetime)
  const endTime = new Date(raw.end_datetime)
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    return null
  }
  return { id: raw.id, startTime, endTime }
}

/**
 * Reads the overlapping blocks out of a publish 409 body.
 *
 * The API reports them Pydantic-style, under
 * `detail[].input.overlapping_blocks`, each with its span. Entries without a
 * usable id and span are dropped; the caller treats an empty result as "overlap
 * detected, details unavailable".
 */
export const parseOverlapConflict = (body: unknown): PublishedBlockSpan[] => {
  if (!body || typeof body !== 'object') return []
  const detail = (body as { detail?: unknown }).detail
  if (!Array.isArray(detail)) return []

  const blocks: PublishedBlockSpan[] = []
  for (const entry of detail) {
    const raw = (entry as { input?: { overlapping_blocks?: unknown } } | null)
      ?.input?.overlapping_blocks
    if (!Array.isArray(raw)) continue
    for (const item of raw) {
      const span = toBlockSpan((item ?? {}) as RawOverlappingBlock)
      if (span) blocks.push(span)
    }
  }
  return blocks.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
}

const isInsideBlock = (time: number, block: PublishedBlockSpan) =>
  time >= block.startTime.getTime() && time <= block.endTime.getTime()

/**
 * Drops the incoming points that fall inside an already-published block and
 * splits what is left into runs that can each be published as its own block.
 *
 * Block spans are closed on both ends, matching the server's overlap check,
 * so a point exactly on a block boundary counts as already published. Two kept
 * points belong to the same run only when no published block lies between
 * them: a run spanning a block would itself overlap it and be rejected.
 */
export const splitAroundPublishedBlocks = (
  measurements: readonly HydrographPoint[],
  blocks: readonly PublishedBlockSpan[]
): { runs: HydrographPoint[][]; skippedCount: number } => {
  const runs: HydrographPoint[][] = []
  let skippedCount = 0
  let currentRun: HydrographPoint[] = []
  let currentKey: number | null = null

  for (const measurement of measurements) {
    const time = measurement.time.getTime()
    if (blocks.some((block) => isInsideBlock(time, block))) {
      skippedCount += 1
      continue
    }
    // Published blocks for one series never overlap one another, so the
    // number of blocks already ended identifies the gap this point sits in.
    const key = blocks.filter((block) => block.endTime.getTime() < time).length
    if (currentKey !== key && currentRun.length > 0) {
      runs.push(currentRun)
      currentRun = []
    }
    currentKey = key
    currentRun.push(measurement)
  }
  if (currentRun.length > 0) runs.push(currentRun)

  return { runs, skippedCount }
}

/**
 * Largest number of points sent in one publish request. A single block of
 * ~47,000 points ran for minutes and then failed with a network error
 * (BDMS-1406), so larger series are written as several consecutive blocks.
 */
export const MAX_POINTS_PER_BLOCK = 5000

/**
 * Splits a series into consecutive batches of at most `maxPoints`, in time
 * order, for publishing one block each. Readings that share a timestamp stay
 * in the same batch: block spans are closed, so two blocks meeting at one
 * instant would overlap and the second would be rejected. A batch can run
 * over `maxPoints` only by the duplicates at its end.
 */
export const chunkMeasurements = (
  measurements: readonly HydrographPoint[],
  maxPoints: number = MAX_POINTS_PER_BLOCK
): HydrographPoint[][] => {
  const sorted = [...measurements].sort(
    (a, b) => a.time.getTime() - b.time.getTime()
  )
  const batches: HydrographPoint[][] = []
  let start = 0
  while (start < sorted.length) {
    let end = Math.min(start + Math.max(1, maxPoints), sorted.length)
    while (
      end < sorted.length &&
      sorted[end].time.getTime() === sorted[end - 1].time.getTime()
    ) {
      end += 1
    }
    batches.push(sorted.slice(start, end))
    start = end
  }
  return batches
}

/** What a publish has written so far, across all of its batches. */
export interface PublishTally {
  blockIds: number[]
  count: number
}

/** What one publish request reports back. */
export interface PublishedBlockResult {
  block?: { id?: number }
  observation_count?: number
}

export type BatchPublishResult =
  | { ok: true }
  | { ok: false; error: unknown; remaining: HydrographPoint[] }

/**
 * Writes the runs as consecutive batches of at most `maxPoints`, one `post`
 * each, in order, adding every success to `tally`. The first failure stops the
 * rest: what was written stays written, and the points not yet written come
 * back with the error so the caller can carry on from there.
 */
export const publishInBatches = async (
  runs: readonly (readonly HydrographPoint[])[],
  post: (batch: HydrographPoint[]) => Promise<PublishedBlockResult>,
  tally: PublishTally,
  onBatch?: (index: number, total: number) => void,
  maxPoints: number = MAX_POINTS_PER_BLOCK
): Promise<BatchPublishResult> => {
  const batches = runs.flatMap((run) => chunkMeasurements(run, maxPoints))
  for (const [index, batch] of batches.entries()) {
    onBatch?.(index, batches.length)
    try {
      const data = await post(batch)
      if (data.block?.id != null) tally.blockIds.push(data.block.id)
      tally.count += data.observation_count ?? batch.length
    } catch (error) {
      return { ok: false, error, remaining: batches.slice(index).flat() }
    }
  }
  return { ok: true }
}

