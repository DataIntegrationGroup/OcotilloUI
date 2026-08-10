import type { IWell } from '@/interfaces/geothermal'

/**
 * How long to wait after the last keystroke before querying. Short enough to
 * feel live, long enough that typing a well name is one request rather than
 * one per character.
 */
export const WELL_SEARCH_DEBOUNCE_MS = 300

/** Results requested per page, and how many more each "Show more" adds. */
export const WELL_SEARCH_PAGE_SIZE = 50

/**
 * Ceiling on how many results the picker will hold at once.
 *
 * The catalogue runs to thousands of wells, so scrolling to a well is not a
 * workflow — searching for it is. The cap keeps a broad query from pulling the
 * whole catalogue into the DOM, and the UI says when it has been hit instead
 * of truncating silently, which is what the old 500-row dropdown did.
 */
export const WELL_SEARCH_MAX_LOADED = 500

/** Primary line: whatever identifies the well to a person. */
export const wellSearchLabel = (well: IWell): string =>
  well.name?.trim() || well.api?.trim() || well.well_number?.trim() || well.well_data_id

/**
 * Secondary line. Only the parts this well actually has, so rows do not carry
 * a row of empty separators.
 */
export const wellSearchDetail = (well: IWell): string =>
  [well.api, well.well_type, well.status, well.county, well.operator]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' · ')

/**
 * Query parameters for the geothermal well search.
 *
 * `q` is a free-text term matched server-side across the well's identifying
 * and descriptive fields — see docs/geothermal-well-search-contract.md. It is
 * omitted when blank so an empty box lists the first page rather than
 * searching for nothing.
 */
export const buildWellSearchParams = ({
  term,
  pageSize,
}: {
  term: string
  pageSize: number
}): Record<string, string | number> => {
  const trimmed = term.trim()
  return trimmed ? { q: trimmed, size: pageSize } : { size: pageSize }
}

/**
 * Next highlighted row for an arrow-key press, wrapping at both ends so
 * holding a key cycles rather than sticking. Returns -1 when there is nothing
 * to highlight.
 */
export const moveActiveIndex = (
  current: number,
  delta: number,
  count: number
): number => {
  if (count <= 0) return -1
  if (current < 0) return delta > 0 ? 0 : count - 1
  return (current + delta + count) % count
}

/**
 * Radix and routing both need a non-empty id, and a well without one cannot be
 * opened, so those rows are dropped rather than rendered as dead entries.
 */
export const isSelectableWell = (well: IWell): boolean =>
  well.well_data_id != null && well.well_data_id !== ''
