import { Box, Paper, Stack, Typography } from '@mui/material'
import { Home } from '@mui/icons-material'
import type { IContact, IAddress } from '@/interfaces/ocotillo'
import { formatContactAddress } from '@/utils'

export const ContactAddresses = ({ contact }: { contact?: IContact | null }) => {
  const addresses = contact?.addresses ?? []

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Home color="primary" />
        <Typography variant="body1" fontWeight="bold">
          Addresses
        </Typography>
      </Box>
      <Box sx={{ px: 2, py: 1, pb: 3 }}>
        {addresses.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No addresses on file.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {addresses.map((addr: IAddress, idx: number) => (
              <Box key={addr.id ?? idx}>
                <Typography variant="body1">
                  <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                    {addr.address_type || 'Address'}:
                  </Box>
                  {formatContactAddress(addr)}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Paper>
  )
}
