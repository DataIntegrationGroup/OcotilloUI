import type { PublishProgress } from './PublishStatusNotice'

export const UPLOAD_STAGE = 'Uploading'
export const SAVE_STAGE = 'Saving on the server'
export const REFRESH_STAGE = 'Refreshing the chart'
export const DELETE_STAGE = 'Deleting readings on the server'

/** The fields of an axios upload progress event this reads. */
export interface UploadEvent {
  loaded?: number
  total?: number
  progress?: number
}

/**
 * How much of a request body has gone up, 0 to 1, or `null` when the browser
 * cannot say (no length for the body). Never guessed: a bar that claims a
 * figure it does not have is worse than one that says nothing.
 */
export const uploadFraction = (event: UploadEvent): number | null => {
  const fraction =
    event.progress ?? (event.total ? (event.loaded ?? 0) / event.total : null)
  if (fraction == null || !Number.isFinite(fraction)) return null
  return Math.min(1, Math.max(0, fraction))
}

/**
 * How far along `total` equal blocks are, 0 to 100, with the current one
 * (`index`, from 0) `fraction` done. Held under 100: the last block being sent
 * is not the operation being finished.
 */
export const overallPercent = (
  index: number,
  total: number,
  fraction: number
): number => Math.min(99, ((index + fraction) / total) * 100)

/**
 * What to show while one block's request goes up. Only the sending is
 * measurable; once the body is all sent the server works unseen, so a single
 * block goes back to a bar with no figure, and one of several holds its place
 * in the overall total.
 */
export const uploadingProgress = (
  base: { wellName: string; step?: { current: number; total: number } },
  fraction: number | null
): PublishProgress => {
  const { step } = base
  const index = step ? step.current - 1 : 0

  if (fraction == null) return { ...base, stage: UPLOAD_STAGE }
  if (fraction >= 1) {
    return {
      ...base,
      stage: SAVE_STAGE,
      percent: step ? overallPercent(index, step.total, 1) : null,
    }
  }

  return {
    ...base,
    stage: UPLOAD_STAGE,
    percent: step
      ? overallPercent(index, step.total, fraction)
      : fraction * 100,
  }
}
