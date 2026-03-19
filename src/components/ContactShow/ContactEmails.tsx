import { Box, Paper, Stack, Typography } from '@mui/material'
import { Email } from '@mui/icons-material'
import type { IContact, IEmail } from '@/interfaces/ocotillo'

export const ContactEmails = ({ contact }: { contact?: IContact | null }) => {
  const emails = contact?.emails ?? []

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Email color="primary" />
        <Typography variant="body1" fontWeight="bold">
          Emails
        </Typography>
      </Box>
      <Box sx={{ px: 2, py: 1, pb: 3 }}>
        {emails.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No email addresses on file.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {emails.map((email: IEmail, idx: number) => (
              <Box key={email.id ?? idx}>
                <Typography variant="body1">
                  <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                    {email.email_type || 'Email'}:
                  </Box>
                  <Typography
                    component="a"
                    href={email.email ? `mailto:${email.email}` : undefined}
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {email.email || 'N/A'}
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
