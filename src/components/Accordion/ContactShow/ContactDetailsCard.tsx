import { Box, Paper, Stack, Typography } from '@mui/material'
import type { IContact, IPhone, IEmail, IAddress } from '@/interfaces/ocotillo'
import { formatPhone, formatContactAddress, formatAppDateTime } from '@/utils'

type ContactDetailsCardProps = {
  contact?: IContact | null
}

export const ContactDetailsCard = ({ contact }: ContactDetailsCardProps) => {
  const phones = contact?.phones ?? []
  const emails = contact?.emails ?? []
  const addresses = contact?.addresses ?? []

  const hasContactInfo = phones.length > 0 || emails.length > 0
  const hasAddresses = addresses.length > 0
  const hasMetadata = contact?.created_at || contact?.release_status

  const isEmpty = !contact?.name && !hasContactInfo && !hasAddresses && !hasMetadata

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="body1" fontWeight="bold">
          Contact Details
        </Typography>
      </Box>
      <Box sx={{ px: 2, py: 1, pb: 3 }}>
        {isEmpty ? (
          <Typography variant="body2" color="text.secondary">
            No contact details on file.
          </Typography>
        ) : (
          <Stack spacing={0}>
            {contact?.name && (
              <Typography variant="body1" fontWeight={600}>
                {contact.name}
              </Typography>
            )}
            {hasContactInfo && (
              <Stack spacing={0}>
                {phones.map((phone: IPhone, idx: number) => (
                  <Box key={phone.id ?? idx}>
                    <Typography
                      component="a"
                      href={phone.phone_number ? `tel:${phone.phone_number}` : undefined}
                      variant="body2"
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      {formatPhone(phone.phone_number)}
                    </Typography>
                  </Box>
                ))}
                {emails.map((email: IEmail, idx: number) => (
                  <Box key={email.id ?? idx}>
                    <Typography
                      component="a"
                      href={email.email ? `mailto:${email.email}` : undefined}
                      variant="body2"
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      {email.email || 'N/A'}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}

            {hasAddresses && (
              <Stack spacing={1.5} sx={{ mt: hasContactInfo ? 2 : 0 }}>
                {addresses.map((addr: IAddress, idx: number) => (
                  <Box key={addr.id ?? idx}>
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{ fontWeight: 600, color: 'text.secondary', display: 'block' }}
                    >
                      {addr.address_type || 'Address'}:
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'block' }}>
                      {formatContactAddress(addr)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}

            {hasMetadata && (
              <Stack spacing={0.5} sx={{ mt: 2 }}>
                {contact?.created_at && (
                  <Typography variant="caption" color="text.secondary">
                    Created: {formatAppDateTime(contact.created_at as string)}
                  </Typography>
                )}
                {contact?.release_status && (
                  <Typography variant="caption" color="text.secondary">
                    {contact.release_status}
                  </Typography>
                )}
              </Stack>
            )}
          </Stack>
        )}
      </Box>
    </Paper>
  )
}
