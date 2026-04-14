import { Paper, Box, Stack, Typography } from '@mui/material'
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
          <InlineRow
            label="Casing Diameter"
            value={`${well?.well_casing_diameter?.toFixed(2) || 'N/A'}${well?.well_casing_diameter ? ` ${well.well_casing_diameter_unit}` : ''}`}
          />
          <InlineRow
            label="Casing Depth"
            value={`${well?.well_casing_depth?.toFixed(2) || 'N/A'}${well?.well_casing_depth ? ` ${well.well_casing_depth_unit}` : ''}`}
          />
          <InlineRow
            label="Casing Materials"
            value={well?.well_casing_materials?.join(', ') || 'N/A'}
          />
          <InlineRow label="Pump Type" value={well?.well_pump_type || 'N/A'} />
          <InlineRow
            label="Pump Depth"
            value={`${well?.well_pump_depth?.toFixed(2) || 'N/A'}${well?.well_pump_depth ? ` ${well.well_pump_depth_unit}` : ''}`}
          />
          <InlineRow
            label="Elevation"
            value={
              elevation != null
                ? `${elevation.toFixed(2)}${elevationUnit ? ` ${elevationUnit}` : ''}`
                : 'N/A'
            }
          />
          <InlineRow
            label="Elevation Method"
            value={elevationMethod || 'N/A'}
          />
          <InlineRow label="Vertical Datum" value={verticalDatum || 'N/A'} />
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
