import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from '@mui/material'
import { ExpandMore, Notes } from '@mui/icons-material'
import Grid from '@mui/material/Grid2'
import { IWell } from '@/interfaces/ocotillo/IThing'

export const NotesAccordion = ({ well }: { well?: IWell }) => {
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
            <Notes color="primary" />
            <Typography variant="body1" fontWeight="bold">
              Notes
            </Typography>
          </Stack>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6">Water Notes:</Typography>
            <Typography variant="body1">
              {well?.water_notes || 'N/A'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6">Measuring Notes:</Typography>
            <Typography variant="body1">
              {well?.measuring_notes || 'N/A'}
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
            <Typography variant="body1">{well?.notes || 'N/A'}</Typography>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  )
}
