import { Box, Paper, Stack, Typography } from '@mui/material'
import { Place } from '@mui/icons-material'
import { Link } from '@refinedev/core'
import type { IContact, IThing } from '@/interfaces/ocotillo'

export const AssociatedSites = ({ contact }: { contact?: IContact | null }) => {
  const things = contact?.things ?? []

  const getShowPath = (thing: IThing) => {
    const type = (thing.thing_type || '').toLowerCase()
    if (type === 'water well' || type === 'geothermal well') {
      return `/ocotillo/well/show/${thing.id}`
    }
    if (type === 'spring') {
      return `/ocotillo/spring/show/${thing.id}`
    }
    return `/ocotillo/well/show/${thing.id}`
  }

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Place color="primary" />
        <Typography variant="body1" fontWeight="bold">
          Associated Sitess
        </Typography>
      </Box>
      <Box sx={{ px: 2, py: 1, pb: 3 }}>
        {things.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No associated sites.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {things.map((thing: IThing) => (
              <Link
                key={thing.id}
                to={getShowPath(thing)}
                style={{
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: 'primary.main',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {thing.name || `Site ${thing.id}`}
                </Typography>
              </Link>
            ))}
          </Stack>
        )}
      </Box>
    </Paper>
  )
}
