import type { ReviewStatus } from '@/generated/types.gen'

/**
 * One published transducer block as the review panel shows it.
 *
 * The API has no block list endpoint; every reading the list returns carries
 * the block that covers it, so the blocks are recovered by grouping readings.
 * A block with no readings is therefore invisible here -- but a block left
 * with none is deleted by the API's own reconciliation, so there is nothing
 * to review in one.
 */
export interface HydrographStoredBlock {
  id: number
  start: Date
  end: Date
  reviewStatus: ReviewStatus
  readingCount: number
  sourceFile: string | null
}

interface StoredReadingRow {
  block: {
    id: number
    start_datetime: string
    end_datetime: string
    review_status: ReviewStatus
    source_file?: string | null
  }
}

/** Distinct blocks behind a set of stored readings, oldest first. */
export const summarizeStoredBlocks = (
  rows: readonly StoredReadingRow[]
): HydrographStoredBlock[] => {
  const byId = new Map<number, HydrographStoredBlock>()

  for (const { block } of rows) {
    const existing = byId.get(block.id)
    if (existing) {
      existing.readingCount += 1
      continue
    }
    byId.set(block.id, {
      id: block.id,
      start: new Date(block.start_datetime),
      end: new Date(block.end_datetime),
      reviewStatus: block.review_status,
      readingCount: 1,
      sourceFile: block.source_file ?? null,
    })
  }

  return [...byId.values()].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  )
}

/**
 * The data maturity a block's readings take from its review status. Mirrors
 * the API's mapping so the panel can say what an action will do before it is
 * taken: approved readings are approved, everything else is provisional.
 */
export const maturityForReviewStatus = (status: ReviewStatus) =>
  status === 'approved' ? 'approved' : 'provisional'

/**
 * Index of the time in `sortedTimes` closest to `target`, or -1 when empty.
 *
 * The stored series is drawn without symbols, and ECharts reports a click on
 * a symbol-less line with no `dataIndex` -- only the series. So the workbench
 * converts the click's pixel to a time and opens the nearest stored reading.
 */
export const nearestIndexByTime = (
  sortedTimes: readonly number[],
  target: number
): number => {
  if (sortedTimes.length === 0 || !Number.isFinite(target)) return -1

  let low = 0
  let high = sortedTimes.length - 1
  while (low < high) {
    const mid = (low + high) >> 1
    if (sortedTimes[mid] < target) low = mid + 1
    else high = mid
  }
  // `low` is the first time >= target; its predecessor may be nearer.
  if (low > 0 && target - sortedTimes[low - 1] <= sortedTimes[low] - target) {
    return low - 1
  }
  return low
}
