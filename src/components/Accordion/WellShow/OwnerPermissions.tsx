import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material'
import { IWell } from '@/interfaces/ocotillo'
import { formatAppDate } from '@/utils'

export const OwnerPermissionsAccordion = ({ well }: { well?: IWell }) => {
  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="body1" fontWeight="bold">
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
            <Stack spacing={0.75}>
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
              </Box>
              {(p.start_date || p.end_date) && (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'auto auto' },
                    gap: 0.75,
                    pl: { sm: 0.25 },
                  }}
                >
                  <DateMeta
                    label="Start"
                    value={formatAppDate(p.start_date) || '---'}
                  />
                  <DateMeta
                    label="End"
                    value={formatAppDate(p.end_date) || '---'}
                  />
                </Box>
              )}
            </Stack>
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

const DateMeta = ({ label, value }: { label: string; value: string }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'baseline',
      gap: 0.75,
      px: 1,
      py: 0.5,
      borderRadius: 1.5,
      bgcolor: 'action.hover',
    }}
  >
    <Typography variant="caption" color="text.secondary" fontWeight={700}>
      {label}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {value}
    </Typography>
  </Box>
)
