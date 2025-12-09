import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { ExpandMore, Info } from '@mui/icons-material'
import Grid from '@mui/material/Grid2'
import { IWell } from '@/interfaces/ocotillo/IThing'

export const AdditionalWellInformationAccordion = ({
  well,
}: {
  well?: IWell
}) => {
  return (
    <Accordion defaultExpanded elevation={2}>
      <AccordionSummary
        expandIcon={<ExpandMore />}
        // Match the visual height of summaries that contain a CreateButton
        sx={{
          minHeight: 36,
          '& .MuiAccordionSummary-content': {
            margin: 0,
            paddingY: 2.75,
          },
          '&.Mui-expanded': {
            minHeight: 36,
          },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: '100%' }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Info color="primary" />
            <Typography variant="body1" fontWeight="bold">
              Additional Well Information
            </Typography>
          </Stack>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h3">Owner Permissions</Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            {(!well?.permissions || well.permissions.length === 0) && (
              <Typography variant="body1">N/A</Typography>
            )}
            <Stack spacing={2}>
              {well?.permissions?.map((p, i) => (
                <Box key={i}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="subtitle1" sx={{ minWidth: 200 }}>
                      {p.permission_type}
                    </Typography>
                    <Chip
                      label={
                        p.permission_allowed === true
                          ? 'Allowed'
                          : p.permission_allowed === false
                            ? 'Not Allowed'
                            : 'Unknown'
                      }
                      color={
                        p.permission_allowed === true
                          ? 'success'
                          : p.permission_allowed === false
                            ? 'error'
                            : 'default'
                      }
                      sx={{ fontFamily: 'monospace' }}
                    />
                    {(p.start_date || p.end_date) && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        From {p.start_date ?? 'Unknown'} to{' '}
                        {p.end_date ?? 'Unkown'}
                      </Typography>
                    )}
                  </Stack>
                  {i < well.permissions.length - 1 && (
                    <Divider sx={{ mt: 2 }} />
                  )}
                </Box>
              ))}
            </Stack>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h3">Construction Info</Typography>
          </Grid>
          <Grid size={{ xs: 6, lg: 3 }}>
            <Typography variant="h6">Completion Date:</Typography>
            <Typography variant="body1">
              {well?.well_completion_date || 'N/A'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, lg: 3 }}>
            <Typography variant="h6">Driller Name:</Typography>
            <Typography variant="body1">
              {well?.well_driller_name || 'N/A'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Typography variant="h6">Construction Method:</Typography>
            <Typography variant="body1">
              {well?.well_construction_method || 'N/A'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Typography variant="h6">Completion Date Source:</Typography>
            <Typography variant="body1">
              {well?.well_completion_date_source || 'N/A'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Typography variant="h6">Construction Method Source:</Typography>
            <Typography variant="body1">
              {well?.well_construction_method_source || 'N/A'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h3">Well Physical Properties</Typography>
          </Grid>
          <Grid size={{ xs: 6, lg: 3 }}>
            <Typography variant="h6">Casing Diameter:</Typography>
            <Typography variant="body1">
              {well?.well_casing_diameter?.toFixed(2) || 'N/A'}
              {well?.well_casing_diameter
                ? ` ${well?.well_casing_diameter_unit}`
                : null}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, lg: 3 }}>
            <Typography variant="h6">Casing Depth:</Typography>
            <Typography variant="body1">
              {well?.well_casing_depth?.toFixed(2) || 'N/A'}
              {well?.well_casing_depth
                ? ` ${well?.well_casing_depth_unit}`
                : null}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Typography variant="h6">Casing Materials:</Typography>
            <Typography variant="body1">
              {well?.well_casing_materials?.join(', ') || 'N/A'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, lg: 3 }}>
            <Typography variant="h6">Pump Type:</Typography>
            <Typography variant="body1">
              {well?.well_pump_type || 'N/A'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, lg: 3 }}>
            <Typography variant="h6">Pump Depth:</Typography>
            <Typography variant="body1">
              {well?.well_pump_depth?.toFixed(2) || 'N/A'}
              {well?.well_pump_depth ? ` ${well?.well_pump_depth_unit}` : null}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Typography variant="h6">
              Is open and suitable for a datalogger?
            </Typography>
            <Typography variant="body1">
              <Chip
                sx={{ fontFamily: 'monospace' }}
                label={well?.is_suitable_for_datalogger?.toString() || 'N/A'}
                color={well?.is_suitable_for_datalogger ? 'success' : 'error'}
              />
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h3">Geology Information</Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6">Formation Completion Code:</Typography>
            <Typography variant="body1">
              {well?.formation_completion_code || 'N/A'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Typography variant="h6">Aquifer Systems:</Typography>
            <Typography variant="body1">
              {(well?.aquifers ?? [])
                ?.map((a) => a?.aquifer_system)
                ?.filter(Boolean)
                ?.join(', ') || 'N/A'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Typography variant="h6">Aquifer Types:</Typography>
            <Typography variant="body1">
              {well?.aquifers && well.aquifers.length > 0
                ? [
                    ...new Set(well.aquifers.flatMap((a) => a.aquifer_types)),
                  ].join(', ')
                : 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  )
}
