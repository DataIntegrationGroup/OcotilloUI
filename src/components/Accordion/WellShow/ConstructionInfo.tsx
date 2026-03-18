import { Box, Paper, Stack, Typography } from '@mui/material'
import { IWell } from '@/interfaces/ocotillo'

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
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
          <Typography variant="body2" component="span">
            Completion Date:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="span">
            {well?.well_completion_date || 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
          <Typography variant="body2" component="span">
            Driller Name:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="span">
            {well?.well_driller_name || 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
          <Typography variant="body2" component="span">
            Construction Method:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="span">
            {well?.well_construction_method || 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
          <Typography variant="body2" component="span">
            Completion Date Source:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="span">
            {well?.well_completion_date_source || 'N/A'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" component="span">
            Construction Method Source:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
            {well?.well_construction_method_source || 'N/A'}
          </Typography>
        </Box>
      </Stack>
      </Box>
    </Paper>
  )
}
