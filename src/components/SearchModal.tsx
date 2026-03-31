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
import { DocEntry, searchDocs } from '@/utils/docsSearch'
import { highlight } from '@/utils'
import {
  SnakeGameModal,
  AsteroidsGameModal,
  RaceCarGameModal,
  TetrisGameModal,
  MinesweeperGameModal,
} from '@/components/Search/EasterEggsGames'

type ArcadeGame = 'snake' | 'asteroids' | 'racecar' | 'tetris' | 'minesweeper'

type SearchMode =
  | 'default'
  | 'command-root'
  | 'games'
  | 'docs'
  | 'unknown-command'

type ParsedSearch =
  | { mode: 'default'; term: string }
  | { mode: 'command-root'; term: string }
  | { mode: 'games'; term: string }
  | { mode: 'docs'; term: string }
  | { mode: 'unknown-command'; command: string; term: string }

const COMMANDS = [
  {
    key: 'games',
    label: '!games',
    description: 'Browse and launch games',
  },
  {
    key: 'docs',
    label: '!docs',
    description: 'Search docs by title or content',
  },
] as const

const GAMES: { key: ArcadeGame; label: string; description: string }[] = [
  { key: 'snake', label: 'Snake', description: 'Classic snake game' },
  { key: 'asteroids', label: 'Asteroids', description: 'Arcade space shooter' },
  { key: 'racecar', label: 'Race Car', description: 'Driving game' },
  { key: 'tetris', label: 'Tetris', description: 'Block puzzle game' },
  { key: 'minesweeper', label: 'Minesweeper', description: 'Find all mines' },
]

const buildDocExcerpt = (doc: DocEntry, query: string) => {
  const trimmedQuery = query.trim().toLowerCase()
  if (!trimmedQuery) return doc.path

  const normalizedContent = doc.content.toLowerCase()
  const matchIndex = normalizedContent.indexOf(trimmedQuery)
  if (matchIndex === -1) return doc.path

  const start = Math.max(0, matchIndex - 40)
  const end = Math.min(doc.content.length, matchIndex + trimmedQuery.length + 80)
  const excerpt = doc.content.slice(start, end).replace(/\s+/g, ' ').trim()

  return `${doc.path}  ·  ${excerpt}${end < doc.content.length ? '...' : ''}`
}

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
        <Chip
          size="small"
          label={`+${things.length - 4} more`}
          variant="outlined"
          sx={{ fontSize: 11 }}
        />
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
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ lineHeight: 1.4, display: 'block' }}
          >
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

const DocResultRow = ({
  option,
  query,
  onClick,
}: {
  option: DocEntry
  query: string
  onClick: () => void
}) => (
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
    <Description
      sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0, mt: '2px' }}
    />
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.4 }}>
        {highlight(option.title, query)}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ lineHeight: 1.4, display: 'block' }}
      >
        {highlight(buildDocExcerpt(option, query), query)}
      </Typography>
    </Box>
  </Box>
)

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
  const [activeGame, setActiveGame] = useState<ArcadeGame | null>(null)
  const [dismissedGame, setDismissedGame] = useState<ArcadeGame | null>(null)
  const debounced = useDebounce(query, 400)

  const normalizedQuery = query.trim().toLowerCase()
  const normalizedDebounced = debounced.trim().toLowerCase()

  const parsed: ParsedSearch = useMemo(() => {
    const trimmed = query.trim()

    if (!trimmed.startsWith('!')) {
      return { mode: 'default', term: trimmed }
    }

    const withoutBang = trimmed.slice(1).trimStart()

    if (!withoutBang.trim()) {
      return { mode: 'command-root', term: '' }
    }

    const [command, ...rest] = withoutBang.split(/\s+/)
    const commandTerm = rest.join(' ').trim()
    const normalizedCommand = command.toLowerCase()

    if (normalizedCommand === 'games') {
      return { mode: 'games', term: commandTerm }
    }

    if (normalizedCommand === 'docs') {
      return { mode: 'docs', term: commandTerm }
    }

    const partialMatches = COMMANDS.filter((item) =>
      item.key.startsWith(normalizedCommand)
    )

    if (partialMatches.length > 0 && !commandTerm) {
      return { mode: 'command-root', term: normalizedCommand }
    }

    return {
      mode: 'unknown-command',
      command,
      term: commandTerm,
    }
  }, [query])

  const requestedGame: ArcadeGame | null = useMemo(() => {
    const normalizedTerm =
      parsed.mode === 'games'
        ? parsed.term.trim().toLowerCase()
        : normalizedQuery

    if (!normalizedTerm) return null

    const exactMatch = GAMES.find((game) => game.key === normalizedTerm)
    return exactMatch?.key ?? null
  }, [normalizedQuery, parsed])

  // Reload history each time modal opens
  useEffect(() => {
    if (open) {
      setQuery('')
      setRecentSearches(history.get())
      setDismissedGame(null)
      setActiveGame(null)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!requestedGame) {
      setDismissedGame(null)
      return
    }

    if (
      open &&
      activeGame !== requestedGame &&
      dismissedGame !== requestedGame
    ) {
      setActiveGame(requestedGame)
    }
  }, [activeGame, dismissedGame, open, requestedGame])

  const { query: searchQuery, result } = useAbortableList({
    resource: 'search',
    dataProviderName: 'ocotillo',
    pagination: { pageSize: 100 },
    queryOptions: {
      enabled:
        open && parsed.mode === 'default' && normalizedDebounced.length >= 1,
      staleTime: 120_000,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
    meta: { params: { q: debounced } },
  })

  const results: SearchResult[] = useMemo(() => {
    if (parsed.mode !== 'default') return []
    if (!query.trim()) return []
    if (searchQuery.isFetching) return []
    if (searchQuery.isError) return []

    const normalized =
      result?.data?.map((r: any) => ({
        label: r.label,
        description: r.description,
        group: r.group as GroupType,
        properties: r.properties,
      })) ?? []

    return dedupeResults(normalized)
  }, [parsed.mode, result, query, searchQuery.isFetching, searchQuery.isError])

  // Group results by type for section headers
  const grouped = useMemo(() => {
    const map = new Map<GroupType, SearchResult[]>()
    for (const r of results) {
      if (!map.has(r.group)) map.set(r.group, [])
      map.get(r.group)!.push(r)
    }
    return map
  }, [results])

  const filteredCommands = useMemo(() => {
    if (parsed.mode !== 'command-root') return []

    const term = parsed.term.trim().toLowerCase()
    if (!term) return COMMANDS

    return COMMANDS.filter((command) => command.key.startsWith(term))
  }, [parsed])

  const filteredGames = useMemo(() => {
    if (parsed.mode !== 'games') return []

    const term = parsed.term.trim().toLowerCase()
    if (!term) return GAMES

    return GAMES.filter(
      (game) =>
        game.key.includes(term) || game.label.toLowerCase().includes(term)
    )
  }, [parsed])

  const docsResults = useMemo(() => {
    if (parsed.mode !== 'docs') return []

    return searchDocs(parsed.term)
  }, [parsed])

  const navigateToResult = (option: SearchResult) => {
    switch (option.group) {
      case GroupType.Wells:
      case GroupType.Springs: {
        const p = (option as WellResult).properties
        const isWaterWell = p.thing_type === 'water well'
        go({
          to: {
            resource: isWaterWell
              ? 'ocotillo.thing-well'
              : 'ocotillo.thing-spring',
            action: 'show',
            id: p.id,
          },
        })
        break
      }
      case GroupType.Contacts:
        go({
          to: {
            resource: 'ocotillo.contact',
            action: 'show',
            id: (option as ContactResult).properties.id,
          },
        })
        break
      case GroupType.Assets:
        go({
          to: {
            resource: 'ocotillo.asset',
            action: 'show',
            id: (option as any).properties.id,
          },
        })
        break
    }
  }

  const handleCommandClick = (command: 'games' | 'docs') => {
    setQuery(`!${command} `)
    inputRef.current?.focus()
  }

  const handleDocSelect = (doc: DocEntry) => {
    go({ to: doc.route, type: 'push' })
    handleClose()
  }

  const handleGameSelect = (game: ArcadeGame) => {
    setActiveGame(game)
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
    setActiveGame(null)
    setDismissedGame(null)
    onClose()
  }

  const handleGameClose = () => {
    setDismissedGame(activeGame)
    setActiveGame(null)
  }

  const showRecent = !query.trim() && recentSearches.length > 0

  const showDefaultEmpty =
    parsed.mode === 'default' &&
    query.trim() &&
    !searchQuery.isFetching &&
    !searchQuery.isError &&
    results.length === 0

  const showDocsEmpty =
    parsed.mode === 'docs' && docsResults.length === 0

  const showError =
    parsed.mode === 'default' &&
    query.trim() &&
    !searchQuery.isFetching &&
    searchQuery.isError

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        sx={{
          '& .MuiDialog-container': { alignItems: 'flex-start', pt: 2 },
          '& .MuiDialog-paper': {
            borderRadius: 2,
            overflow: 'hidden',
            mx: { xs: 0.5, sm: 'auto' },
          },
        }}
        slotProps={{
          backdrop: {
            sx: { backdropFilter: 'blur(2px)', bgcolor: 'rgba(0,0,0,0.8)' },
          },
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
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleClose()
                return
              }

              if (e.key === 'Enter') {
                if (parsed.mode === 'command-root' && filteredCommands.length > 0) {
                  handleCommandClick(filteredCommands[0].key)
                  return
                }

                if (parsed.mode === 'games' && filteredGames.length > 0) {
                  handleGameSelect(filteredGames[0].key)
                  return
                }

                if (parsed.mode === 'docs' && docsResults.length > 0) {
                  handleDocSelect(docsResults[0])
                  return
                }

                if (parsed.mode === 'default' && results.length > 0) {
                  handleSelect(results[0])
                }
              }
            }}
            placeholder='Search or type "!" for commands'
            fullWidth
            sx={{ fontSize: 15 }}
            inputProps={{ 'aria-label': 'Search' }}
            endAdornment={
              query ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setQuery('')}
                    edge="end"
                  >
                    <Clear sx={{ fontSize: 22 }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }
          />
        </Box>

        {/* Results area */}
        {parsed.mode === 'command-root' && (
          <Box sx={{ py: 1 }}>
            <Stack sx={{ px: 1.5, pb: 0.5 }}>
              <Typography
                variant="overline"
                sx={{ color: 'text.disabled', fontSize: 10, letterSpacing: 1 }}
              >
                Commands
              </Typography>
            </Stack>

            {filteredCommands.map((command: any) => (
              <Box
                key={command.key}
                onClick={() => handleCommandClick(command.key)}
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
                <Description
                  sx={{
                    fontSize: 18,
                    color: 'text.secondary',
                    flexShrink: 0,
                    mt: '2px',
                  }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {command.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {command.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {parsed.mode === 'games' && !requestedGame && (
          <Box sx={{ py: 1 }}>
            <Stack sx={{ px: 1.5, pb: 0.5 }}>
              <Typography
                variant="overline"
                sx={{ color: 'text.disabled', fontSize: 10, letterSpacing: 1 }}
              >
                Games
              </Typography>
            </Stack>

            {filteredGames.map((game) => (
              <Box
                key={game.key}
                onClick={() => handleGameSelect(game.key)}
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
                <Typography variant="body2" sx={{ minWidth: 0, flex: 1 }}>
                  <Box component="span" fontWeight={600}>
                    {game.label}
                  </Box>
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    {game.description}
                  </Typography>
                </Typography>
              </Box>
            ))}

            {filteredGames.length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ px: 2, py: 2, textAlign: 'center' }}
              >
                No games found for "{parsed.term}".
              </Typography>
            )}
          </Box>
        )}

        <Box sx={{ maxHeight: 480, overflowY: 'auto' }}>
          {/* Loading indicator */}
          {searchQuery.isFetching && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', px: 2, py: 1.5 }}
            >
              Searching...
            </Typography>
          )}

          {requestedGame && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ px: 2, py: 2, textAlign: 'center' }}
            >
              Press Enter to open{' '}
              {GAMES.find((g) => g.key === requestedGame)?.label ??
                requestedGame}
              .
            </Typography>
          )}

          {/* Recent searches */}
          {showRecent && (
            <Box sx={{ py: 1 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ px: 1.5, pb: 0.5 }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    color: 'text.disabled',
                    fontSize: 10,
                    letterSpacing: 1,
                  }}
                >
                  Recent searches
                </Typography>
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                  }}
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
                  <AccessTime
                    sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {q}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Empty state */}
          {showDefaultEmpty && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ px: 2, py: 2, textAlign: 'center' }}
            >
              No results for "{query}". Try a well ID, site name, or contact
              name.
            </Typography>
          )}

          {showDocsEmpty && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ px: 2, py: 2, textAlign: 'center' }}
            >
              No docs found for "{parsed.term}".
            </Typography>
          )}

          {/* Error state */}
          {showError && (
            <Typography
              variant="body2"
              color="error"
              sx={{ px: 2, py: 2, textAlign: 'center' }}
            >
              Search failed. Please try again.
            </Typography>
          )}

          {parsed.mode === 'unknown-command' && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ px: 2, py: 2, textAlign: 'center' }}
            >
              Unknown command "!{parsed.command}". Try !games or !docs.
            </Typography>
          )}

          {parsed.mode === 'docs' && docsResults.length > 0 && (
            <Box sx={{ py: 0.5 }}>
              {docsResults.map((doc) => (
                <DocResultRow
                  key={doc.id}
                  option={doc}
                  query={parsed.term}
                  onClick={() => handleDocSelect(doc)}
                />
              ))}
            </Box>
          )}

          {/* Grouped results */}
          {!searchQuery.isFetching &&
            !requestedGame &&
            parsed.mode === 'default' &&
            grouped.size > 0 && (
            <Box sx={{ py: 0.5 }}>
              {Array.from(grouped.entries()).map(
                ([group, items], groupIndex) => (
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
                )
              )}
            </Box>
          )}
        </Box>
      </Dialog>
      <SnakeGameModal open={activeGame === 'snake'} onClose={handleGameClose} />
      <AsteroidsGameModal
        open={activeGame === 'asteroids'}
        onClose={handleGameClose}
      />
      <RaceCarGameModal
        open={activeGame === 'racecar'}
        onClose={handleGameClose}
      />
      <TetrisGameModal
        open={activeGame === 'tetris'}
        onClose={handleGameClose}
      />
      <MinesweeperGameModal
        open={activeGame === 'minesweeper'}
        onClose={handleGameClose}
      />
    </>
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
