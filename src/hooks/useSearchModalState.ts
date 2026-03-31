import { useEffect, useMemo, useRef, useState } from 'react'
import { useGo } from '@refinedev/core'
import { GroupType } from '@/constants'
import { useAbortableList } from './useAbortableList'
import { useDebounce } from './useDebounce'
import { useSearchHistory } from './useSearchHistory'
import { ContactResult, SearchResult, WellResult } from '@/interfaces/ocotillo'
import { DocEntry, searchDocs } from '@/utils/docsSearch'
import {
  ArcadeGame,
  dedupeResults,
  filterCommands,
  filterGames,
  getRequestedGame,
  groupSearchResults,
  parseSearchQuery,
} from '@/utils/searchModal'

type UseSearchModalStateParams = {
  open: boolean
  onClose: () => void
}

export const useSearchModalState = ({
  open,
  onClose,
}: UseSearchModalStateParams) => {
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

  const parsed = useMemo(() => parseSearchQuery(query), [query])

  const requestedGame = useMemo(
    () => getRequestedGame(parsed, normalizedQuery),
    [normalizedQuery, parsed]
  )

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
  }, [parsed.mode, query, result, searchQuery.isError, searchQuery.isFetching])

  const grouped = useMemo(() => groupSearchResults(results), [results])
  const filteredCommands = useMemo(() => filterCommands(parsed), [parsed])
  const filteredGames = useMemo(() => filterGames(parsed), [parsed])
  const docsResults = useMemo(() => {
    if (parsed.mode !== 'docs') return []

    return searchDocs(parsed.term)
  }, [parsed])

  const navigateToResult = (option: SearchResult) => {
    switch (option.group) {
      case GroupType.Wells:
      case GroupType.Springs: {
        const properties = (option as WellResult).properties
        const isWaterWell = properties.thing_type === 'water well'
        go({
          to: {
            resource: isWaterWell
              ? 'ocotillo.thing-well'
              : 'ocotillo.thing-spring',
            action: 'show',
            id: properties.id,
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

  const handleClose = () => {
    if (query.trim()) history.add(query)
    setQuery('')
    setActiveGame(null)
    setDismissedGame(null)
    onClose()
  }

  const handleCommandSelect = (command: 'games' | 'docs') => {
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

  const handleResultSelect = (option: SearchResult) => {
    navigateToResult(option)
    handleClose()
  }

  const handleRecentClick = (value: string) => {
    setQuery(value)
    inputRef.current?.focus()
  }

  const handleClearHistory = () => {
    history.clear()
    setRecentSearches([])
  }

  const handleGameClose = () => {
    setDismissedGame(activeGame)
    setActiveGame(null)
  }

  const handleEnter = () => {
    if (parsed.mode === 'command-root' && filteredCommands.length > 0) {
      handleCommandSelect(filteredCommands[0].key)
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
      handleResultSelect(results[0])
    }
  }

  return {
    activeGame,
    docsResults,
    filteredCommands,
    filteredGames,
    grouped,
    handleClearHistory,
    handleClose,
    handleCommandSelect,
    handleDocSelect,
    handleEnter,
    handleGameClose,
    handleGameSelect,
    handleRecentClick,
    handleResultSelect,
    inputRef,
    parsed,
    query,
    recentSearches,
    requestedGame,
    results,
    searchQuery,
    setQuery,
    showDefaultEmpty:
      parsed.mode === 'default' &&
      query.trim() &&
      !searchQuery.isFetching &&
      !searchQuery.isError &&
      results.length === 0,
    showDocsEmpty: parsed.mode === 'docs' && docsResults.length === 0,
    showError:
      parsed.mode === 'default' &&
      query.trim() &&
      !searchQuery.isFetching &&
      searchQuery.isError,
    showRecent: !query.trim() && recentSearches.length > 0,
  }
}
