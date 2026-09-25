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
