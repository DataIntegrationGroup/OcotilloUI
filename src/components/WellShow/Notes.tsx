import { Box, Paper, Typography } from '@mui/material'
import { Notes } from '@mui/icons-material'
import Grid from '@mui/material/Grid2'
import { IWell } from '@/interfaces/ocotillo'
import { groupNotesByType } from '@/utils'

export const NotesAccordion = ({ well }: { well?: IWell }) => {
  const locationNote = well?.current_location?.properties?.notes
    ?.filter((note) => note.note_type === 'General')
    .shift()

  const allNotes = [
    ...(well?.water_notes ?? []),
    ...(well?.measuring_notes ?? []),
    ...(well?.construction_notes ?? []),
    ...(well?.general_notes ?? []),
    // Exclude the specific location "General" note used in the map ("Directions to the site").
    // This prevents duplicate content between the map and Notes section.
    ...(well?.current_location?.properties?.notes ?? []).filter(
      (note) => note.id !== locationNote?.id
    ),
    ...(well?.sampling_procedure_notes ?? []),
  ]

  const noteSections = groupNotesByType(allNotes, { defaultTitle: 'Notes' })
  const sections =
    noteSections.length > 0 ? noteSections : [{ title: 'Notes', value: null }]

  const renderNotes = (value?: string | null) => value || 'N/A'
  const formatSectionTitle = (title: string) =>
    title.toLowerCase().endsWith('notes') ? title : `${title} Notes`

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box
        sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <Notes color="primary" />
        <Typography variant="body1" fontWeight="bold">
          Notes
        </Typography>
      </Box>
      <Box sx={{ px: 2, py: 1, pb: 3 }}>
        <Grid container spacing={2}>
          {sections.map((section) => (
            <Grid key={section.title} size={{ xs: 12 }}>
              <Typography variant="body2" fontWeight="bold">
                {formatSectionTitle(section.title)}:
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {renderNotes(section.value)}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Paper>
  )
}
