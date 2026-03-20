import { Box, Paper, Stack, Typography } from '@mui/material'
import { History } from '@mui/icons-material'
import { ISample } from '@/interfaces/ocotillo'
import { formatAppDateTime } from '@/utils'

function buildEventContent(sample: Partial<ISample> | null | undefined): {
  date: string | null
  body: string
} {
  if (!sample) return { date: null, body: '' }

  const eventDate =
    sample.field_event?.event_date ?? sample.sample_date ?? null
  const activityType = sample.field_activity?.activity_type ?? null
  const contactName = sample.contact?.name ?? null
  const contactOrg = sample.contact?.organization ?? null
  const sampleMethod = sample.sample_method ?? null
  const notes = sample.field_event?.notes ?? sample.notes ?? null

  const date = eventDate ? formatAppDateTime(eventDate) : null

  let body = ''
  if (activityType) {
    const article = activityType.match(/^[aeiou]/i) ? 'An' : 'A'
    const staffPart = contactName
      ? ` by ${contactName}${contactOrg ? ` (${contactOrg})` : ''}`
      : ''
    const methodPart = sampleMethod
      ? `, using the ${sampleMethod} method`
      : ''
    body = `${article} ${activityType} check was performed${staffPart}${methodPart}`
  }
  if (body && !body.endsWith('.')) body += '.'
  if (notes) body = body ? `${body} ${notes}` : notes

  if (!date && !body) return { date: null, body: '' }

  return { date, body }
}

export const FieldEventHistoryAccordion = ({
  sample,
}: {
  sample?: Partial<ISample> | null
}) => {
  const { date, body } = buildEventContent(sample)
  const hasData = date || body

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <History color="primary" />
        <Typography variant="body1" fontWeight="bold">
          Field Event History
        </Typography>
      </Box>
      <Box sx={{ px: 2, py: 1, pb: 3 }}>
        {!hasData ? (
          <Typography variant="body2" color="text.secondary">
            No field event history found.
          </Typography>
        ) : (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              borderColor: 'divider',
              bgcolor: 'background.default',
            }}
          >
            <Stack spacing={1.5}>
              {date && (
                <Box>
                  <Typography
                    variant="overline"
                    sx={{
                      display: 'block',
                      color: 'text.secondary',
                      letterSpacing: 1.1,
                    }}
                  >
                    Event Date
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {date}
                  </Typography>
                </Box>
              )}

              {body && (
                <Box>
                  <Typography
                    variant="overline"
                    sx={{
                      display: 'block',
                      color: 'text.secondary',
                      letterSpacing: 1.1,
                    }}
                  >
                    Event Summary
                  </Typography>
                  <Typography
                    variant="body2"
                    component="p"
                    sx={{ whiteSpace: 'pre-line', lineHeight: 1.65, m: 0 }}
                  >
                    {body}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        )}
      </Box>
    </Paper>
  )
}
