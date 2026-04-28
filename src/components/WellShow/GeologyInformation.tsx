import { Paper, Box, Stack, Typography } from '@mui/material'
import { IWell } from '@/interfaces/ocotillo'

export const GeologyInformationAccordion = ({ well }: { well?: IWell }) => {
  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="body1" fontWeight="bold">
          Geology Information
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        <Stack spacing={1}>
          <InlineRow
            label="Formation Completion Code"
            value={well?.formation_completion_code || 'N/A'}
          />
          <InlineRow
            label="Aquifer Systems"
            value={
              (well?.aquifers ?? [])
                .map((a) => a?.aquifer_system)
                .filter(Boolean)
                .join(', ') || 'N/A'
            }
          />
          <InlineRow
            label="Aquifer Types"
            value={
              well?.aquifers && well.aquifers.length > 0
                ? [...new Set(well.aquifers.flatMap((a) => a.aquifer_types))].join(', ')
                : 'N/A'
            }
          />
        </Stack>
      </Box>
    </Paper>
  )
}

const InlineRow = ({ label, value }: { label: string; value: string }) => (
  <Typography variant="body2">
    {label}:{' '}
    <Typography variant="body2" color="text.secondary" component="span">
      {value}
    </Typography>
  </Typography>
)
