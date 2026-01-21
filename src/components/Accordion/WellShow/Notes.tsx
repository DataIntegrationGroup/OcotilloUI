import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from '@mui/material'
import { ExpandMore, Notes } from '@mui/icons-material'
import Grid from '@mui/material/Grid2'
import { IWell } from '@/interfaces/ocotillo'
import { groupNotesByType } from '@/utils'

export const NotesAccordion = ({ well }: { well?: IWell }) => {
  const allNotes = [
    ...(well?.water_notes ?? []),
    ...(well?.measuring_notes ?? []),
    ...(well?.construction_notes ?? []),
    ...(well?.general_notes ?? []),
    ...(well?.current_location?.properties?.notes ?? []),
    ...(well?.sampling_procedure_notes ?? []),
  ]

  const noteSections = groupNotesByType(allNotes, { defaultTitle: 'Notes' })
  const sections =
    noteSections.length > 0 ? noteSections : [{ title: 'Notes', value: null }]

  const renderNotes = (value?: string | null) => value || 'N/A'
  const formatSectionTitle = (title: string) =>
    title.toLowerCase().endsWith('notes') ? title : `${title} Notes`

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
          {sections.map((section) => (
            <Grid key={section.title} size={{ xs: 12 }}>
              <Typography variant="h6">
                {formatSectionTitle(section.title)}:
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {renderNotes(section.value)}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  )
}
