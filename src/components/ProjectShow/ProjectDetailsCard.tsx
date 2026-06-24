import { Box, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material'
import type { IGroup } from '@/interfaces/ocotillo/IGroup'
import { formatAppDateTime } from '@/utils'

const RELEASE_STATUS_COLOR: Record<
  string,
  'default' | 'success' | 'warning' | 'error' | 'info'
> = {
  draft: 'default',
  provisional: 'info',
  final: 'success',
  published: 'success',
  public: 'success',
  archived: 'warning',
  private: 'error',
}

type DetailRowProps = {
  label: string
  value?: string | number | null
}

const DetailRow = ({ label, value }: DetailRowProps) => {
  if (value == null || value === '') return null

  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', fontWeight: 600, letterSpacing: 0.3 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25 }}>
        {value}
      </Typography>
    </Box>
  )
}

export const ProjectDetailsCard = ({
  project,
  isLoading = false,
}: {
  project?: IGroup | null
  isLoading?: boolean
}) => {
  const releaseStatus = project?.release_status?.trim()

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="body1" fontWeight="bold">
          Project Details
        </Typography>
      </Box>
      <Box sx={{ px: 2, pb: 3 }}>
        {isLoading ? (
          <Stack spacing={1.5}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={36} />
            ))}
          </Stack>
        ) : !project ? (
          <Typography variant="body2" color="text.secondary">
            No project details available.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {releaseStatus ? (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', fontWeight: 600, letterSpacing: 0.3 }}
                >
                  Release Status
                </Typography>
                <Chip
                  label={releaseStatus}
                  size="small"
                  color={RELEASE_STATUS_COLOR[releaseStatus.toLowerCase()] ?? 'default'}
                  sx={{ mt: 0.5, height: 22, '& .MuiChip-label': { px: 1 } }}
                />
              </Box>
            ) : null}
            <DetailRow
              label="Description"
              value={project.description?.trim() || 'No description provided.'}
            />
            <DetailRow label="Type" value={project.group_type ?? '—'} />
            <DetailRow label="Wells" value={project.well_count ?? 0} />
            <DetailRow label="Parent Group ID" value={project.parent_group_id ?? '—'} />
            <DetailRow
              label="Created At"
              value={
                project.created_at ? formatAppDateTime(project.created_at) : '—'
              }
            />
            <DetailRow label="Created By" value={project.created_by_name ?? '—'} />
          </Stack>
        )}
      </Box>
    </Paper>
  )
}
