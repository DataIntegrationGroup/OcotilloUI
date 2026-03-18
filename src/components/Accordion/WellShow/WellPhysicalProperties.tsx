import { Box, Paper, Stack, Typography } from '@mui/material'
import { IWell } from '@/interfaces/ocotillo'

export const WellPhysicalPropertiesAccordion = ({ well }: { well?: IWell }) => {
  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, pt: 2, pb: 0 }}>
        <Typography variant="h3" sx={{ fontSize: '1rem' }}>
          Physical Properties
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
          <Typography variant="body2" component="span">
            Casing Diameter:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="span">
            {well?.well_casing_diameter?.toFixed(2) || 'N/A'}
            {well?.well_casing_diameter
              ? ` ${well?.well_casing_diameter_unit}`
              : null}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
          <Typography variant="body2" component="span">
            Casing Depth:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="span">
            {well?.well_casing_depth?.toFixed(2) || 'N/A'}
            {well?.well_casing_depth
              ? ` ${well?.well_casing_depth_unit}`
              : null}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
          <Typography variant="body2" component="span">
            Casing Materials:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="span">
            {well?.well_casing_materials?.join(', ') || 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
          <Typography variant="body2" component="span">
            Pump Type:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="span">
            {well?.well_pump_type || 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
          <Typography variant="body2" component="span">
            Pump Depth:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="span">
            {well?.well_pump_depth?.toFixed(2) || 'N/A'}
            {well?.well_pump_depth ? ` ${well?.well_pump_depth_unit}` : null}
          </Typography>
        </Box>
      </Stack>
      </Box>
    </Paper>
  )
}
