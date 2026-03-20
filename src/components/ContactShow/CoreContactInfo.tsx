import { Box, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { Info } from '@mui/icons-material'
import type { IContact } from '@/interfaces/ocotillo'
import { formatAppDateTime } from '@/utils'

export const CoreContactInfo = ({ contact }: { contact?: IContact | null }) => {
  if (!contact) {
    return <LoadingCard />
  }

  const fields = [
    { label: 'Name', value: contact.name },
    { label: 'Organization', value: contact.organization },
    { label: 'Role', value: contact.role },
    { label: 'Contact Type', value: contact.contact_type },
    {
      label: 'Created At',
      value: contact.created_at
        ? formatAppDateTime(contact.created_at as unknown as string)
        : null,
    },
  ]

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Info color="primary" />
        <Typography variant="body1" fontWeight="bold">
          Core Contact Information
        </Typography>
      </Box>
      <Box sx={{ px: 2, py: 1, pb: 3 }}>
        <Stack spacing={1.5}>
          {fields.map(({ label, value }) =>
            value ? (
              <Typography key={label} variant="body1" sx={{ mb: 0 }}>
                <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                  {label}:
                </Box>
                {value}
              </Typography>
            ) : null
          )}
        </Stack>
      </Box>
    </Paper>
  )
}

const LoadingCard = () => (
  <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
    <Box sx={{ px: 2, py: 1.5 }}>
      <Skeleton variant="text" width={200} height={28} />
    </Box>
    <Box sx={{ px: 2, py: 2 }}>
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} variant="text" width="80%" height={24} sx={{ mb: 1 }} />
      ))}
    </Box>
  </Paper>
)
