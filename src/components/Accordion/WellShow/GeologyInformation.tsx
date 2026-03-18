import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import { IWell } from '@/interfaces/ocotillo'

export const GeologyInformationAccordion = ({ well }: { well?: IWell }) => {
  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, pt: 2, pb: 0 }}>
        <Typography variant="h3" sx={{ fontSize: '1rem' }}>
          Geology Information
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <Typography variant="body2" component="span">
              Is open and suitable for a datalogger?
            </Typography>
            <Chip
              sx={{ fontFamily: 'monospace', flexShrink: 0 }}
              label={well?.is_suitable_for_datalogger?.toString() || 'N/A'}
              color={well?.is_suitable_for_datalogger ? 'success' : 'error'}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
            <Typography variant="body2" component="span">
              Formation Completion Code:
            </Typography>
            <Typography variant="body2" color="text.secondary" component="span">
              {well?.formation_completion_code || 'N/A'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <Typography variant="body2" component="span">
              Aquifer Systems:
            </Typography>
            <Typography variant="body2" color="text.secondary" component="span">
              {(well?.aquifers ?? [])
                ?.map((a) => a?.aquifer_system)
                ?.filter(Boolean)
                ?.join(', ') || 'N/A'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <Typography variant="body2" component="span">
              Aquifer Types:
            </Typography>
            <Typography variant="body2" color="text.secondary" component="span">
              {well?.aquifers && well.aquifers.length > 0
                ? [
                    ...new Set(well.aquifers.flatMap((a) => a.aquifer_types)),
                  ].join(', ')
                : 'N/A'}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Paper>
  )
}
