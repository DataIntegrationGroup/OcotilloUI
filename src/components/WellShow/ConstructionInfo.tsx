import { Box, Paper, Stack, Typography } from '@mui/material'
import { IWell } from '@/interfaces/ocotillo'
import { formatAppDate } from '@/utils'

export const ConstructionInfoAccordion = ({ well }: { well?: IWell }) => {
  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="body1" fontWeight="bold">
          Construction Info
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        <Stack spacing={1}>
          <InlineRow
            label="Datalogger Suitability"
            value={well?.is_suitable_for_datalogger?.toString() || 'N/A'}
          />
          <InlineRow
            label="Driller Name"
            value={well?.well_driller_name || 'N/A'}
          />
          <Box>
            <InlineRow
              label="Completion Date"
              value={formatAppDate(well?.well_completion_date) || 'N/A'}
            />
            {well?.well_completion_date_source && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: 'italic' }}
              >
                {well.well_completion_date_source}
              </Typography>
            )}
          </Box>
          <Box>
            <InlineRow
              label="Construction Method"
              value={well?.well_construction_method || 'N/A'}
            />
            {well?.well_construction_method_source && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: 'italic' }}
              >
                {well.well_construction_method_source}
              </Typography>
            )}
          </Box>
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
