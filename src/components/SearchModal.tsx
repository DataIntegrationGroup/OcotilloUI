import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Chip,
  Dialog,
  Divider,
  IconButton,
  InputAdornment,
  InputBase,
  Stack,
  Typography,
} from '@mui/material'
import {
  AccessTime,
  Clear,
  Description,
  Opacity,
  Person,
  Search,
} from '@mui/icons-material'
import { useGo } from '@refinedev/core'
import { useDebounce, useAbortableList, useSearchHistory } from '@/hooks'
import { GroupType } from '@/constants'
import { SearchResult, WellResult, ContactResult } from '@/interfaces/ocotillo'
import { highlight } from '@/utils'

// ---- type icon mapping ------------------------------------------------

const TypeIcon = ({ group }: { group: GroupType }) => {
  const sx = { fontSize: 18, color: 'text.secondary', flexShrink: 0, mt: '2px' }
  switch (group) {
    case GroupType.Wells:
    case GroupType.Springs:
      return <Opacity sx={sx} />
    case GroupType.Contacts:
      return <Person sx={sx} />
    case GroupType.Assets:
      return <Description sx={sx} />
    default:
      return null
  }
}

// ---- subtitle builder for each result type ----------------------------

const buildSubtitle = (option: SearchResult): string | null => {
  if (option.group === GroupType.Wells || option.group === GroupType.Springs) {
    const p = (option as WellResult).properties
    const parts: string[] = []
    if (p.owner_name) parts.push(`Owner: ${p.owner_name}`)
    if (p.county) parts.push(p.county)
    if (p.site_name) parts.push(p.site_name)
    if (p.thing_type) parts.push(p.thing_type)
    if (p.well_depth) parts.push(`${p.well_depth.toFixed(0)} ft`)
    if (p.hole_depth) parts.push(`hole ${p.hole_depth.toFixed(0)} ft`)
    if (p.well_purposes?.length) parts.push(...p.well_purposes)
    return parts.length ? parts.join('  ·  ') : null
  }

  if (option.group === GroupType.Contacts) {
    const p = (option as ContactResult).properties
    const parts: string[] = []
    if (p.phone?.length) parts.push(p.phone[0])
    if (p.address?.length) parts.push(p.address[0])
    return parts.length ? parts.join('  ·  ') : null
  }

  return null
}

// ---- related things chips (contacts & assets) -------------------------

const RelatedThings = ({
  things,
  query,
}: {
  things: { id: number; label: string; thing_type: string }[]
  query: string
}) => {
  if (!things?.length) return null
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
      {things.slice(0, 4).map((t) => (
        <Chip
          key={t.id}
          size="small"
          icon={<Opacity sx={{ fontSize: '12px !important' }} />}
          label={highlight(t.label, query)}
          variant="outlined"
          sx={{ fontSize: 11 }}
        />
      ))}
      {things.length > 4 && (
        <Chip size="small" label={`+${things.length - 4} more`} variant="outlined" sx={{ fontSize: 11 }} />
      )}
    </Box>
  )
}

// ---- single result row ------------------------------------------------

const ResultRow = ({
  option,
  query,
  onClick,
}: {
  option: SearchResult
  query: string
  onClick: () => void
}) => {
  const subtitle = buildSubtitle(option)
  const relatedThings =
    option.group === GroupType.Contacts
      ? (option as ContactResult).properties.things
      : option.group === GroupType.Assets
        ? (option as any).properties?.things
        : null

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        px: 1.5,
        py: 1,
        borderRadius: 1,
        cursor: 'pointer',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <TypeIcon group={option.group} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.4 }}>
          {highlight(option.label, query)}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4, display: 'block' }}>
            {subtitle}
          </Typography>
        )}
        {relatedThings && (
          <RelatedThings things={relatedThings} query={query} />
        )}
      </Box>
    </Box>
  )
}

// ---- main modal -------------------------------------------------------

type SearchModalProps = {
  open: boolean
  onClose: () => void
}

export const SearchModal = ({ open, onClose }: SearchModalProps) => {
  const go = useGo()
  const history = useSearchHistory()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [query, setQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const debounced = useDebounce(query, 400)

  // Reload history each time modal opens
  useEffect(() => {
    if (open) {
      setQuery('')
      setRecentSearches(history.get())
      // Small delay so Dialog is mounted before we focus
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const { data, isFetching, isError } = useAbortableList({
    resource: 'search',
    dataProviderName: 'ocotillo',
    pagination: { pageSize: 100 },
    queryOptions: {
      enabled: open && debounced.length >= 1,
      staleTime: 120_000,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
    meta: { params: { q: debounced } },
  })

  const results: SearchResult[] = useMemo(() => {
    if (!query.trim()) return []
    if (isFetching) return []
    if (isError) return []
    const normalized =
      data?.data?.map((r: any) => ({
        label: r.label,
        description: r.description,
        group: r.group as GroupType,
        properties: r.properties,
      })) ?? []
    return dedupeResults(normalized)
  }, [data, query, isFetching, isError])

  // Group results by type for section headers
  const grouped = useMemo(() => {
    const map = new Map<GroupType, SearchResult[]>()
    for (const r of results) {
      if (!map.has(r.group)) map.set(r.group, [])
      map.get(r.group)!.push(r)
    }
    return map
  }, [results])

  const navigateToResult = (option: SearchResult) => {
    switch (option.group) {
      case GroupType.Wells:
      case GroupType.Springs: {
        const p = (option as WellResult).properties
        const isWaterWell = p.thing_type === 'water well'
        go({
          to: {
            resource: isWaterWell ? 'ocotillo.thing-well' : 'ocotillo.thing-spring',
            action: 'show',
            id: p.id,
          },
        })
        break
      }
      case GroupType.Contacts:
        go({
          to: { resource: 'ocotillo.contact', action: 'show', id: (option as ContactResult).properties.id },
        })
        break
      case GroupType.Assets:
        go({
          to: { resource: 'ocotillo.asset', action: 'show', id: (option as any).properties.id },
        })
        break
    }
  }

  const handleSelect = (option: SearchResult) => {
    navigateToResult(option)
    handleClose()
  }

  const handleRecentClick = (q: string) => {
    setQuery(q)
    inputRef.current?.focus()
  }

  const handleClearHistory = () => {
    history.clear()
    setRecentSearches([])
  }

  const handleClose = () => {
    if (query.trim()) history.add(query)
    setQuery('')
    onClose()
  }

  const showRecent = !query.trim() && recentSearches.length > 0
  const showEmpty = query.trim() && !isFetching && !isError && results.length === 0
  const showError = query.trim() && !isFetching && isError

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      sx={{
        '& .MuiDialog-container': { alignItems: 'flex-start', pt: 2 },
        '& .MuiDialog-paper': { borderRadius: 2, overflow: 'hidden', mx: { xs: 0.5, sm: 'auto' } },
      }}
      slotProps={{
        backdrop: { sx: { backdropFilter: 'blur(2px)', bgcolor: 'rgba(0,0,0,0.8)' } },
      }}
    >
      {/* Search input row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1.5,
          py: 1,
          gap: 0.5,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Search sx={{ color: 'text.primary', fontSize: 28, flexShrink: 0 }} />
        <InputBase
          inputRef={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') handleClose() }}
          placeholder="Search"
          fullWidth
          sx={{ fontSize: 15 }}
          inputProps={{ 'aria-label': 'Search' }}
          endAdornment={
            query ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setQuery('')} edge="end">
                  <Clear sx={{ fontSize: 22 }} />
                </IconButton>
              </InputAdornment>
            ) : null
          }
        />
      </Box>

      {/* Results area */}
      <Box sx={{ maxHeight: 480, overflowY: 'auto' }}>

        {/* Loading indicator */}
        {isFetching && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, py: 1.5 }}>
            Searching...
          </Typography>
        )}

        {/* Recent searches */}
        {showRecent && (
          <Box sx={{ py: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1.5, pb: 0.5 }}>
              <Typography variant="overline" sx={{ color: 'text.disabled', fontSize: 10, letterSpacing: 1 }}>
                Recent searches
              </Typography>
              <Typography
                variant="caption"
                color="primary"
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                onClick={handleClearHistory}
              >
                Clear history
              </Typography>
            </Stack>
            {recentSearches.map((q) => (
              <Box
                key={q}
                onClick={() => handleRecentClick(q)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.5,
                  py: 0.75,
                  cursor: 'pointer',
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <AccessTime sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
                <Typography variant="body2" color="text.secondary">
                  {q}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Empty state */}
        {showEmpty && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2, textAlign: 'center' }}>
            No results for "{query}". Try a well ID, site name, or contact name.
          </Typography>
        )}

        {/* Error state */}
        {showError && (
          <Typography variant="body2" color="error" sx={{ px: 2, py: 2, textAlign: 'center' }}>
            Search failed. Please try again.
          </Typography>
        )}

        {/* Grouped results */}
        {!isFetching && grouped.size > 0 && (
          <Box sx={{ py: 0.5 }}>
            {Array.from(grouped.entries()).map(([group, items], groupIndex) => (
              <Box key={group}>
                {groupIndex > 0 && <Divider sx={{ my: 0.5 }} />}
                {items.map((option, i) => (
                  <ResultRow
                    key={`${option.group}-${(option as any).properties?.id ?? i}`}
                    option={option}
                    query={query}
                    onClick={() => handleSelect(option)}
                  />
                ))}
              </Box>
            ))}
          </Box>
        )}

      </Box>
    </Dialog>
  )
}

// ---- deduplication (same logic as SearchBar) --------------------------

const dedupeResults = (items: SearchResult[]): SearchResult[] => {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (item.group === GroupType.Messages) return true
    const id = (item as any).properties?.id
    if (!id) return true
    const key = `${item.group}-${id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export default SearchModal
