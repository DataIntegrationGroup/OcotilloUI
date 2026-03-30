import { Box, Paper, Stack, Typography } from '@mui/material'
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
        <Stack spacing={1.25}>
          <FieldRow
            label="Formation Completion Code"
            value={well?.formation_completion_code || 'N/A'}
          />
          <FieldRow
            label="Aquifer Systems"
            value={
              (well?.aquifers ?? [])
                ?.map((a) => a?.aquifer_system)
                ?.filter(Boolean)
                ?.join(', ') || 'N/A'
            }
          />
          <FieldRow
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
