import {
  Dialog,
  Box,
  InputBase,
  InputAdornment,
  IconButton,
  Typography,
} from '@mui/material'
import { Clear, Search } from '@mui/icons-material'
import { useSearchModalState } from '@/hooks'
import {
  CommandResults,
  DefaultResults,
  DocsResults,
  EmptyState,
  GameResults,
  RecentSearches,
} from '@/components/Search'
import {
  SnakeGameModal,
  AsteroidsGameModal,
  RaceCarGameModal,
  TetrisGameModal,
  MinesweeperGameModal,
} from '@/components/Search/EasterEggsGames'
import { GAMES } from '@/utils'

type SearchModalProps = {
  open: boolean
  onClose: () => void
}

export const SearchModal = ({ open, onClose }: SearchModalProps) => {
  const state = useSearchModalState({ open, onClose })

  return (
    <>
      <Dialog
        open={open}
        onClose={state.handleClose}
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
            inputRef={state.inputRef}
            value={state.query}
            onChange={(event) => state.setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                state.handleClose()
                return
              }

              if (event.key === 'Enter') {
                state.handleEnter()
              }
            }}
            placeholder="Search"
            fullWidth
            sx={{ fontSize: 15 }}
            inputProps={{ 'aria-label': 'Search' }}
            endAdornment={
              state.query ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => state.setQuery('')}
                    edge="end"
                  >
                    <Clear sx={{ fontSize: 22 }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }
          />
        </Box>

        {state.parsed.mode === 'command-root' && (
          <CommandResults
            commands={state.filteredCommands}
            onSelect={state.handleCommandSelect}
          />
        )}

        {state.parsed.mode === 'games' && !state.requestedGame && (
          <GameResults
            games={state.filteredGames}
            term={state.parsed.term}
            onSelect={state.handleGameSelect}
          />
        )}

        <Box sx={{ maxHeight: 480, overflowY: 'auto' }}>
          {state.searchQuery.isFetching && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', px: 2, py: 1.5 }}
            >
              Searching...
            </Typography>
          )}

          {state.requestedGame && (
            <EmptyState
              message={`Press Enter to open ${
                GAMES.find((game) => game.key === state.requestedGame)?.label ??
                state.requestedGame
              }.`}
            />
          )}

          {state.showRecent && (
            <RecentSearches
              searches={state.recentSearches}
              onClear={state.handleClearHistory}
              onSelect={state.handleRecentClick}
            />
          )}

          {state.showDefaultEmpty && (
            <EmptyState
              message={`No results for "${state.query}". Try a well ID, site name, or contact name.`}
            />
          )}

          {state.showDocsEmpty && (
            <EmptyState message={`No docs found for "${state.parsed.term}".`} />
          )}

          {state.showError && (
            <EmptyState
              color="error"
              message="Search failed. Please try again."
            />
          )}

          {state.parsed.mode === 'unknown-command' && (
            <EmptyState
              message={`Unknown command "!${state.parsed.command}". Try !games or !docs.`}
            />
          )}

          {state.parsed.mode === 'docs' && state.docsResults.length > 0 && (
            <DocsResults
              docs={state.docsResults}
              query={state.parsed.term}
              onSelect={state.handleDocSelect}
            />
          )}

          {!state.searchQuery.isFetching &&
            !state.requestedGame &&
            state.parsed.mode === 'default' &&
            state.grouped.size > 0 && (
              <DefaultResults
                grouped={state.grouped}
                query={state.query}
                onSelect={state.handleResultSelect}
              />
            )}
        </Box>
      </Dialog>
      <SnakeGameModal
        open={state.activeGame === 'snake'}
        onClose={state.handleGameClose}
      />
      <AsteroidsGameModal
        open={state.activeGame === 'asteroids'}
        onClose={state.handleGameClose}
      />
      <RaceCarGameModal
        open={state.activeGame === 'racecar'}
        onClose={state.handleGameClose}
      />
      <TetrisGameModal
        open={state.activeGame === 'tetris'}
        onClose={state.handleGameClose}
      />
      <MinesweeperGameModal
        open={state.activeGame === 'minesweeper'}
        onClose={state.handleGameClose}
      />
    </>
  )
}

export default SearchModal
