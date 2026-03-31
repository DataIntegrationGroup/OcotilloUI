import { Box, Stack, Typography } from '@mui/material'
import { ArcadeGame, GAMES } from '@/utils/searchModal'

type GameResultsProps = {
  games: typeof GAMES
  term: string
  onSelect: (game: ArcadeGame) => void
}

export const GameResults = ({ games, term, onSelect }: GameResultsProps) => (
  <Box sx={{ py: 1 }}>
    <Stack sx={{ px: 1.5, pb: 0.5 }}>
      <Typography
        variant="overline"
        sx={{ color: 'text.disabled', fontSize: 10, letterSpacing: 1 }}
      >
        Games
      </Typography>
    </Stack>

    {games.map((game) => (
      <Box
        key={game.key}
        onClick={() => onSelect(game.key)}
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

    {games.length === 0 && (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ px: 2, py: 2, textAlign: 'center' }}
      >
        No games found for "{term}".
      </Typography>
    )}
  </Box>
)
