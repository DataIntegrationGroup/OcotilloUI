import { Box, Paper, Stack, Typography } from '@mui/material'
import { Phone } from '@mui/icons-material'
import type { IContact, IPhone } from '@/interfaces/ocotillo'
import { formatPhone } from '@/utils'

export const ContactPhones = ({ contact }: { contact?: IContact | null }) => {
  const phones = contact?.phones ?? []

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Phone color="primary" />
        <Typography variant="body1" fontWeight="bold">
          Phones
        </Typography>
      </Box>
      <Box sx={{ px: 2, py: 1, pb: 3 }}>
        {phones.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No phone numbers on file.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {phones.map((phone: IPhone, idx: number) => (
              <Box key={phone.id ?? idx}>
                <Typography variant="body1">
                  <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                    {phone.phone_type || 'Phone'}:
                  </Box>
                  <Typography
                    component="a"
                    href={phone.phone_number ? `tel:${phone.phone_number}` : undefined}
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {formatPhone(phone.phone_number)}
                  </Typography>
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Paper>
  )
}
