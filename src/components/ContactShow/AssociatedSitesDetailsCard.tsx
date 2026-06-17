import { Box, Stack, Typography } from '@mui/material'
import { Place } from '@mui/icons-material'
import type { IThing } from '@/interfaces/ocotillo'
import { AssociatedSiteSummaryCard } from './AssociatedSiteSummaryCard'

export const AssociatedSitesDetailsCard = ({
  things,
}: {
  things?: IThing[] | null
}) => {
  const items = things ?? []

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Place color="primary" />
        <Typography variant="body1" fontWeight="bold">
          Associated Sites
        </Typography>
      </Box>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No associated sites.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {items.map((thing) => (
            <AssociatedSiteSummaryCard key={thing.id} thing={thing} />
          ))}
        </Stack>
      )}
    </Box>
  )
}
