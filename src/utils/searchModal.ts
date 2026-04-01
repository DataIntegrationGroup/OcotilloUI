import { GroupType } from '@/constants'
import { SearchResult } from '@/interfaces/ocotillo'
import { DocEntry } from '@/utils/docsSearch'

export type ArcadeGame =
  | 'snake'
  | 'asteroids'
  | 'racecar'
  | 'tetris'
  | 'minesweeper'

export type SearchMode =
  | 'default'
  | 'command-root'
  | 'games'
  | 'docs'
  | 'unknown-command'

export type ParsedSearch =
  | { mode: 'default'; term: string }
  | { mode: 'command-root'; term: string }
  | { mode: 'games'; term: string }
  | { mode: 'docs'; term: string }
  | { mode: 'unknown-command'; command: string; term: string }

export const COMMANDS = [
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

export const GAMES: {
  key: ArcadeGame
  label: string
  description: string
}[] = [
  { key: 'snake', label: 'Snake', description: 'Classic snake game' },
  { key: 'asteroids', label: 'Asteroids', description: 'Arcade space shooter' },
  { key: 'racecar', label: 'Race Car', description: 'Driving game' },
  { key: 'tetris', label: 'Tetris', description: 'Block puzzle game' },
  { key: 'minesweeper', label: 'Minesweeper', description: 'Find all mines' },
]

export const parseSearchQuery = (query: string): ParsedSearch => {
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
}

export const filterCommands = (parsed: ParsedSearch) => {
  if (parsed.mode !== 'command-root') return []

  const term = parsed.term.trim().toLowerCase()
  if (!term) return COMMANDS

  return COMMANDS.filter((command) => command.key.startsWith(term))
}

export const filterGames = (parsed: ParsedSearch) => {
  if (parsed.mode !== 'games') return []

  const term = parsed.term.trim().toLowerCase()
  if (!term) return GAMES

  return GAMES.filter(
    (game) => game.key.includes(term) || game.label.toLowerCase().includes(term)
  )
}

export const getRequestedGame = (
  parsed: ParsedSearch,
  normalizedQuery: string
): ArcadeGame | null => {
  const normalizedTerm =
    parsed.mode === 'games' ? parsed.term.trim().toLowerCase() : normalizedQuery

  if (!normalizedTerm) return null

  const exactMatch = GAMES.find((game) => game.key === normalizedTerm)
  return exactMatch?.key ?? null
}

export const buildDocExcerpt = (doc: DocEntry, query: string) => {
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

export const dedupeResults = (items: SearchResult[]): SearchResult[] => {
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

export const groupSearchResults = (results: SearchResult[]) => {
  const map = new Map<GroupType, SearchResult[]>()

  for (const result of results) {
    if (!map.has(result.group)) map.set(result.group, [])
    map.get(result.group)!.push(result)
  }

  return map
}
