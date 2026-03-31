import { Box, Stack, Typography } from '@mui/material'
import { AccessTime } from '@mui/icons-material'

type RecentSearchesProps = {
  searches: string[]
  onClear: () => void
  onSelect: (query: string) => void
}

export const RecentSearches = ({
  searches,
  onClear,
  onSelect,
}: RecentSearchesProps) => (
  <Box sx={{ py: 1 }}>
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ px: 1.5, pb: 0.5 }}
    >
      <Typography
        variant="overline"
        sx={{ color: 'text.disabled', fontSize: 10, letterSpacing: 1 }}
      >
        Recent searches
      </Typography>
      <Typography
        variant="caption"
        color="primary"
        sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
        onClick={onClear}
      >
        Clear history
      </Typography>
    </Stack>
    {searches.map((query) => (
      <Box
        key={query}
        onClick={() => onSelect(query)}
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
          {query}
        </Typography>
      </Box>
    ))}
  </Box>
)
