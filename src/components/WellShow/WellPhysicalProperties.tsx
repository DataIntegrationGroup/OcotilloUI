import { Box, Paper, Stack, Typography } from '@mui/material'
import { IWell } from '@/interfaces/ocotillo'

export const WellPhysicalPropertiesAccordion = ({ well }: { well?: IWell }) => {
  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="body1" fontWeight="bold">
          Physical Properties
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        <Stack spacing={1.25}>
          <FieldRow
            label="Casing Diameter"
            value={`${well?.well_casing_diameter?.toFixed(2) || 'N/A'}${
              well?.well_casing_diameter ? ` ${well?.well_casing_diameter_unit}` : ''
            }`}
          />
          <FieldRow
            label="Casing Depth"
            value={`${well?.well_casing_depth?.toFixed(2) || 'N/A'}${
              well?.well_casing_depth ? ` ${well?.well_casing_depth_unit}` : ''
            }`}
          />
          <FieldRow
            label="Casing Materials"
            value={well?.well_casing_materials?.join(', ') || 'N/A'}
          />
          <FieldRow label="Pump Type" value={well?.well_pump_type || 'N/A'} />
          <FieldRow
            label="Pump Depth"
            value={`${well?.well_pump_depth?.toFixed(2) || 'N/A'}${
              well?.well_pump_depth ? ` ${well?.well_pump_depth_unit}` : ''
            }`}
          />
        </Stack>
      </Box>
    </Paper>
  )
}

const FieldRow = ({ label, value }: { label: string; value: string }) => (
  <Box
    sx={{
      position: 'relative',
      border: 1,
      borderColor: 'divider',
      borderRadius: 1.5,
      px: 1.5,
      pt: 1.75,
      pb: 1.25,
      backgroundColor: 'background.paper',
    }}
  >
    <Typography
      variant="caption"
      color="text.secondary"
      fontWeight={700}
      sx={{
        position: 'absolute',
        top: 0,
        left: 10,
        px: 0.5,
        transform: 'translateY(-50%)',
        backgroundColor: 'background.paper',
        lineHeight: 1,
      }}
    >
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        whiteSpace: 'pre-line',
        minHeight: '1.25rem',
      }}
    >
      {value}
    </Typography>
  </Box>
)
