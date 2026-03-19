import { Box, Paper, Stack, Typography } from '@mui/material'
import { Place } from '@mui/icons-material'
import type { IThing } from '@/interfaces/ocotillo'
import { AssociatedSiteSummaryCard } from './AssociatedSiteSummaryCard'

export const AssociatedSitesDetailsCard = ({
  things,
}: {
  things?: IThing[] | null
}) => {
  const items = things ?? []

  if (items.length === 0) {
    return (
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Place color="primary" />
          <Typography variant="body1" fontWeight="bold">
            Associated Sites
          </Typography>
        </Box>
        <Box sx={{ px: 2, py: 1, pb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            No associated sites.
          </Typography>
        </Box>
      </Paper>
    )
  }

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Place color="primary" />
        <Typography variant="body1" fontWeight="bold">
          Associated Sites
        </Typography>
      </Box>
      <Box sx={{ px: 2, py: 1.5, pb: 2 }}>
        <Stack spacing={2}>
          {items.map((thing) => (
            <AssociatedSiteSummaryCard key={thing.id} thing={thing} />
          ))}
        </Stack>
      </Box>
    </Paper>
  )
}
