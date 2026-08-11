import { useEffect, useMemo, useRef, useState } from 'react'
import { useList, useGo } from '@refinedev/core'
import type { IWell } from '@/interfaces/geothermal'
import { useAccessCapabilities } from '@/hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { canEnterGeothermalData } from './recordsGridLogic'
import {
  buildWellSearchParams,
  isSelectableWell,
  moveActiveIndex,
  wellSearchDetail,
  wellSearchLabel,
  WELL_SEARCH_DEBOUNCE_MS,
  WELL_SEARCH_MAX_LOADED,
  WELL_SEARCH_PAGE_SIZE,
} from './wellSearch'

interface WellPickerPageProps {
  title: string
  description: string
  /** Route to open for the chosen well; the well id is appended. */
  targetPath: string
  /** Shown when the admin gate fails. */
  deniedMessage: string
}

/**
 * Shared Sandbox entry point for per-well geothermal pages (records grid,
 * temp-depth log): find a well, then navigate into `targetPath/{well_data_id}`.
 * Admin-gated per BDMS-878.
 *
 * This was a single dropdown holding the first 500 wells. The catalogue runs to
 * thousands, so that both hid most of the data — with no indication it had —
 * and made the wells it did show reachable only by scrolling. Searching is the
 * only workflow that scales, so the term is sent to the server and the page
 * reports how much of the match set it is showing.
 */
export function WellPickerPage({
  title,
  description,
  targetPath,
  deniedMessage,
}: WellPickerPageProps) {
  const go = useGo()
  const { canManageGeothermal, isLoading: permLoading } =
    useAccessCapabilities()
  const allowed = canEnterGeothermalData(canManageGeothermal)

  const [term, setTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [pageSize, setPageSize] = useState(WELL_SEARCH_PAGE_SIZE)
  const [activeIndex, setActiveIndex] = useState(-1)
  const listRef = useRef<HTMLUListElement>(null)

  // Debounce the term, and reset alongside it: a new search starts from one
  // page again, or a narrow term inherits the page size a broad one grew to
  // and over-fetches. The highlight resets for the same reason — it indexes
  // into a result set that is about to be replaced.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(term)
      setPageSize(WELL_SEARCH_PAGE_SIZE)
      setActiveIndex(-1)
    }, WELL_SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [term])

  const { result, query } = useList<IWell>({
    resource: 'thing/geothermal-well',
    dataProviderName: 'geothermal',
    pagination: { currentPage: 1, pageSize, mode: 'server' },
    meta: { params: buildWellSearchParams({ term: debouncedTerm, pageSize }) },
    queryOptions: { enabled: allowed },
  })

  const wells = useMemo(
    () => (result?.data ?? []).filter(isSelectableWell),
    [result?.data]
  )
  const total = result?.total ?? wells.length
  const hasMore = wells.length < total && wells.length < WELL_SEARCH_MAX_LOADED

  // Follow the highlighted row when the keyboard moves it past the fold.
  useEffect(() => {
    if (activeIndex < 0) return
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const open = (well: IWell) => go({ to: `${targetPath}/${well.well_data_id}` })

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) =>
        moveActiveIndex(current, event.key === 'ArrowDown' ? 1 : -1, wells.length)
      )
      return
    }
    if (event.key === 'Enter') {
      // With nothing highlighted, a single result is unambiguous.
      const target = wells[activeIndex] ?? (wells.length === 1 ? wells[0] : null)
      if (target) {
        event.preventDefault()
        open(target)
      }
      return
    }
    if (event.key === 'Escape' && term) {
      event.preventDefault()
      setTerm('')
    }
  }

  if (permLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        Checking access…
      </div>
    )
  }
  if (!allowed) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        {deniedMessage}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <Input
        autoFocus
        type="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search by well name, API, operator, county…"
        aria-label="Search geothermal wells"
        aria-controls="geothermal-well-results"
      />

      <WellSearchStatus
        isLoading={query.isLoading}
        isFetching={query.isFetching}
        isError={query.isError}
        shown={wells.length}
        total={total}
        term={debouncedTerm}
      />

      {wells.length > 0 ? (
        <ul
          id="geothermal-well-results"
          ref={listRef}
          role="listbox"
          aria-label="Geothermal wells"
          className="flex flex-col rounded-md border divide-y max-h-[26rem] overflow-y-auto"
        >
          {wells.map((well, index) => {
            const detail = wellSearchDetail(well)
            return (
              <li key={well.well_data_id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onClick={() => open(well)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`w-full text-left px-3 py-2 ${
                    index === activeIndex ? 'bg-accent' : ''
                  }`}
                >
                  <span className="block text-sm font-medium">
                    {wellSearchLabel(well)}
                  </span>
                  {detail ? (
                    <span className="block text-xs text-muted-foreground">
                      {detail}
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}

      {hasMore ? (
        <Button
          variant="outline"
          disabled={query.isFetching}
          onClick={() =>
            setPageSize((current) =>
              Math.min(current + WELL_SEARCH_PAGE_SIZE, WELL_SEARCH_MAX_LOADED)
            )
          }
        >
          {query.isFetching ? 'Loading…' : 'Show more'}
        </Button>
      ) : null}
    </div>
  )
}

/**
 * One line saying what the list is currently showing. The old dropdown gave no
 * indication that it held only part of the catalogue, so a well that existed
 * but was not listed looked like a well that did not exist.
 */
function WellSearchStatus({
  isLoading,
  isFetching,
  isError,
  shown,
  total,
  term,
}: {
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  shown: number
  total: number
  term: string
}) {
  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Could not load geothermal wells. Check the connection and try again.
      </p>
    )
  }
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Searching…</p>
  }
  if (shown === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {term
          ? `No wells match "${term}".`
          : 'No geothermal wells are available.'}
      </p>
    )
  }

  const capped = shown >= WELL_SEARCH_MAX_LOADED && total > shown

  return (
    <p className="text-sm text-muted-foreground">
      Showing {shown} of {total} {total === 1 ? 'well' : 'wells'}
      {term ? ' matching your search' : ''}
      {capped ? ' — narrow the search to reach the rest' : ''}
      {isFetching ? ' · updating…' : ''}
    </p>
  )
}
