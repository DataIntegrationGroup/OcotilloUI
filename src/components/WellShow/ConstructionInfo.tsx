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
        <Stack spacing={1.5}>
          <Section>
            <FieldRow
              label="Datalogger Suitability"
              value={well?.is_suitable_for_datalogger?.toString() || 'N/A'}
            />
            <FieldRow
              label="Driller Name"
              value={well?.well_driller_name || 'N/A'}
            />
          </Section>

          <Section>
            <FieldGroup
              label="Completion Date"
              value={formatAppDate(well?.well_completion_date) || 'N/A'}
              metaValue={well?.well_completion_date_source || 'N/A'}
            />
            <FieldGroup
              label="Construction Method"
              value={well?.well_construction_method || 'N/A'}
              metaValue={well?.well_construction_method_source || 'N/A'}
            />
          </Section>
        </Stack>
      </Box>
    </Paper>
  )
}

const Section = ({ children }: { children: React.ReactNode }) => (
  <Box
    sx={{
      py: 0.25,
    }}
  >
    <Stack spacing={1.25}>{children}</Stack>
  </Box>
)

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

const FieldGroup = ({
  label,
  value,
  metaValue,
}: {
  label: string
  value: string
  metaValue: string
}) => (
  <Box>
    <FieldRow label={label} value={value} />
    <Box sx={{ px: 1.5, pt: 0.5 }}>
      <Typography
        variant="body2"
        color="text.secondary"
        component="div"
        sx={{ fontStyle: 'italic' }}
      >
        {metaValue}
      </Typography>
    </Box>
  </Box>
)
