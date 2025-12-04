import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
            <Typography variant="h6">Water Notes:</Typography>
            <Typography variant="body1">
              {well?.water_notes?.content || 'N/A'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6">Measuring Notes:</Typography>
            <Typography variant="body1">
              {well?.measuring_notes?.content || 'N/A'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6">Construction Notes:</Typography>
            <Typography variant="body1">
              {well?.well_construction_notes || 'N/A'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6">Notes:</Typography>
            <Typography variant="body1">
              {well?.notes?.content || 'N/A'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6">General Notes:</Typography>
            <Typography variant="body1">
              {well?.general_notes?.content || 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  )
}
