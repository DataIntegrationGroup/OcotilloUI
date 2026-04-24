import { Chip, Divider, Paper, Box, Skeleton, Stack, Typography } from '@mui/material'
import { IWell } from '@/interfaces/ocotillo'
import { IFieldEventParticipant } from '@/interfaces/ocotillo/IFieldEvent'
import { formatAppDate } from '@/utils'

function getMeasuringDuration(firstVisitDate: string | null | undefined): string {
  if (!firstVisitDate) return 'N/A'
  const start = new Date(firstVisitDate)
  if (Number.isNaN(start.getTime())) return 'N/A'
  const now = new Date()
  const totalMonths =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth())
  if (totalMonths <= 0) return 'Less than a month'
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`
  if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`
  return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`
}

export const MonitoringInfoCard = ({
  well,
  firstVisitParticipants,
  lastVisitDate,
  isLoading,
}: {
  well?: IWell
  firstVisitParticipants?: IFieldEventParticipant[]
  lastVisitDate?: string | null
  isLoading?: boolean
}) => {
  if (isLoading) {
    return (
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body1" fontWeight="bold">
            Monitoring Info
          </Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          <Stack spacing={1.25}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} variant="rounded" height={22} width="100%" />
            ))}
          </Stack>
        </Box>
      </Paper>
    )
  }

  const firstVisitDate = well?.first_visit_date
  const duration = getMeasuringDuration(firstVisitDate)


  const hasParticipants = firstVisitParticipants && firstVisitParticipants.length > 0

  const monitoringFrequencies = well?.monitoring_frequencies ?? []
  const activeFrequencies = monitoringFrequencies.filter((f) => !f.end_date)
  const historicalFrequencies = monitoringFrequencies.filter((f) => f.end_date)

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="body1" fontWeight="bold">
          Monitoring Info
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        <Stack spacing={1.25}>
          <FieldRow label="Well Status" value={well?.well_status || 'N/A'} />
          <FieldRow
            label="Monitoring Status"
            value={well?.monitoring_status || 'N/A'}
          />

          <Box>
            <Typography variant="body2" sx={{ mb: monitoringFrequencies.length > 0 ? 0.75 : 0 }}>
              Monitoring Frequency:{' '}
              {monitoringFrequencies.length === 0 && (
                <Typography variant="body2" color="text.secondary" component="span">
                  N/A
                </Typography>
              )}
            </Typography>
            {monitoringFrequencies.length > 0 && (
              <Stack spacing={0.75} sx={{ pl: 1 }}>
                {activeFrequencies.map((f, i) => (
                  <FrequencyRow key={i} freq={f} active />
                ))}
                {historicalFrequencies.map((f, i) => (
                  <FrequencyRow key={`h-${i}`} freq={f} active={false} />
                ))}
              </Stack>
            )}
          </Box>

          <Divider />

          <FieldRow label="Measured For" value={duration} />
          <FieldRow
            label="Last Visit Date"
            value={formatAppDate(lastVisitDate) || 'N/A'}
          />
          <FieldRow
            label="First Visit Date"
            value={formatAppDate(firstVisitDate) || 'N/A'}
          />

          <Box>
            <Typography variant="body2" sx={{ mb: hasParticipants ? 0.5 : 0 }}>
              First Visit Staff:{' '}
              {!hasParticipants && (
                <Typography variant="body2" color="text.secondary" component="span">
                  N/A
                </Typography>
              )}
            </Typography>
            {hasParticipants && (
              <Stack spacing={0.25}>
                {firstVisitParticipants!.map((p) => (
                  <Typography key={p.id} variant="body2" color="text.secondary">
                    &bull;{' '}{p.participant?.name || 'Unknown'}
                    {p.participant_role && (
                      <Typography variant="body2" color="text.secondary" component="span">
                        {' '}({p.participant_role})
                      </Typography>
                    )}
                  </Typography>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </Box>
    </Paper>
  )
}

const FieldRow = ({ label, value }: { label: string; value: string }) => (
  <Typography variant="body2">
    {label}:{' '}
    <Typography variant="body2" color="text.secondary" component="span">
      {value}
    </Typography>
  </Typography>
)

const FrequencyRow = ({
  freq,
  active,
}: {
  freq: { monitoring_frequency: string; start_date: string; end_date: string | null }
  active: boolean
}) => (
  <Typography variant="body2">
    {active && (
      <Chip
        label="Current"
        size="small"
        color="success"
        sx={{ fontSize: 10, height: 18, mr: 0.75, verticalAlign: 'middle' }}
      />
    )}
    {freq.monitoring_frequency}{' '}
    <Typography variant="body2" color="text.secondary" component="span">
      {formatAppDate(freq.start_date)}
      {freq.end_date ? ` - ${formatAppDate(freq.end_date)}` : ''}
    </Typography>
  </Typography>
)
