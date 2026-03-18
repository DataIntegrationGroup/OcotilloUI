import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material'
import { IWell } from '@/interfaces/ocotillo'

export const OwnerPermissionsAccordion = ({ well }: { well?: IWell }) => {
  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, pt: 2, pb: 0 }}>
        <Typography variant="h3" sx={{ fontSize: '1rem' }}>
          Owner Permissions
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        {(!well?.permissions || well.permissions.length === 0) ? (
          <Typography variant="body2" color="text.secondary">N/A</Typography>
        ) : (
        <Stack spacing={2}>
        {well.permissions.map((p, i) => (
          <Box key={i}>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography variant="body2" component="span">
                {p.permission_type}:
              </Typography>
              <Chip
                size="small"
                label={
                  p.permission_allowed === true
                    ? 'Allowed'
                    : p.permission_allowed === false
                      ? 'Not Allowed'
                      : 'Unknown'
                }
                color={
                  p.permission_allowed === true
                    ? 'success'
                    : p.permission_allowed === false
                      ? 'error'
                      : 'default'
                }
                sx={{ fontFamily: 'monospace', flexShrink: 0 }}
              />
              {(p.start_date || p.end_date) && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  component="span"
                >
                  From {p.start_date ?? 'Unknown'} to{' '}
                  {p.end_date ?? 'Unknown'}
                </Typography>
              )}
            </Box>
            {i < well.permissions.length - 1 && (
              <Divider sx={{ mt: 2 }} />
            )}
          </Box>
        ))}
        </Stack>
        )}
      </Box>
    </Paper>
  )
}
