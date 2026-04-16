import { Box, Paper, Stack, Typography } from '@mui/material'
import { IWell } from '@/interfaces/ocotillo'

export const WellPhysicalPropertiesAccordion = ({ well }: { well?: IWell }) => {
  const elevation = well?.current_location?.properties?.elevation
  const elevationUnit = well?.current_location?.properties?.elevation_unit
  const elevationMethod = well?.current_location?.properties?.elevation_method
  const verticalDatum = well?.current_location?.properties?.vertical_datum

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="body1" fontWeight="bold">
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
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
          <Typography variant="body2" component="span">
            Elevation:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="span">
            {elevation != null
              ? `${elevation.toFixed(2)}${elevationUnit ? ` ${elevationUnit}` : ''}`
              : 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
          <Typography variant="body2" component="span">
            Elevation Method:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="span">
            {elevationMethod || 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
          <Typography variant="body2" component="span">
            Vertical Datum:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="span">
            {verticalDatum || 'N/A'}
          </Typography>
        </Box>
      </Stack>
      </Box>
    </Paper>
  )
}
