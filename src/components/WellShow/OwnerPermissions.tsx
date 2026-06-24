import {
  Box,
  Chip,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { IWell } from '@/interfaces/ocotillo'
import { formatAppDate } from '@/utils'
import { z } from 'zod'
import { zReleaseStatus } from '@/generated/zod.gen'

type ReleaseStatus = z.infer<typeof zReleaseStatus>

export const OwnerPermissionsCard = ({
  well,
  isLoading,
}: {
  well?: IWell
  isLoading?: boolean
}) => {
  const releaseStatus: ReleaseStatus =
    well?.current_location?.release_status ?? 'draft'

  const ownerPublicDataAcknowledgement =
    getPublicDataAcknowledgementStatus(releaseStatus)

  const permissions = well?.permissions ?? []

  if (isLoading) {
    return (
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body1" fontWeight="bold">
            Owner Permissions
          </Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          <Stack spacing={0.75}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="body2" component="span">
                <Skeleton
                  variant="text"
                  width={120}
                  sx={{ fontSize: 'inherit' }}
                />
              </Typography>
              <Skeleton
                variant="rounded"
                width={100}
                height={22}
                sx={{ borderRadius: 999 }}
              >
                <Chip label="" size="small" />
              </Skeleton>
            </Box>
          </Stack>
          <Skeleton variant="text" width="40%" height={28} />
          <Skeleton variant="text" width="40%" height={28} />
        </Box>
      </Paper>
    )
  }

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="body1" fontWeight="bold">
          Owner Permissions
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          p: 2,
          bgcolor: 'action.hover',
        }}
      >
        <Typography variant="body2" fontWeight={600}>
          Owner acknowledged public data release
        </Typography>
        <BooleanStatusChip
          value={ownerPublicDataAcknowledgement}
          variant="yesno"
        />
      </Box>
      <Box sx={{ p: 2 }}>
        {permissions.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No permissions available
          </Typography>
        ) : (
          <Stack spacing={2}>
            {permissions.map((permission, index) => (
              <Box key={index}>
                <Stack spacing={0.75}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography variant="body2" component="span">
                      {permission.permission_type}:
                    </Typography>
                    <BooleanStatusChip value={permission.permission_allowed} />
                  </Box>
                  {(permission.start_date || permission.end_date) && (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'auto auto' },
                        gap: 0.75,
                        pl: { sm: 0.25 },
                      }}
                    >
                      <DateMeta
                        label="Start"
                        value={formatAppDate(permission.start_date) || '---'}
                      />
                      <DateMeta
                        label="End"
                        value={formatAppDate(permission.end_date) || '---'}
                      />
                    </Box>
                  )}
                </Stack>
                {index < permissions.length - 1 && (
                  <Divider sx={{ mt: 2 }} />
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Paper>
  )
}

const DateMeta = ({ label, value }: { label: string; value: string }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'baseline',
      gap: 0.75,
      px: 1,
      py: 0.5,
      borderRadius: 1.5,
      bgcolor: 'action.hover',
    }}
  >
    <Typography variant="caption" color="text.secondary" fontWeight={700}>
      {label}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {value}
    </Typography>
  </Box>
)

const getPublicDataAcknowledgementStatus = (
  releaseStatus: ReleaseStatus
): boolean | null => {
  if (releaseStatus === 'public') return true
  if (releaseStatus === 'private') return false
  return null
}

const getBooleanStatusLabel = (
  value: boolean | null,
  variant: 'permission' | 'yesno' = 'permission'
) => {
  if (variant === 'yesno') {
    return value === true ? 'Yes' : value === false ? 'No' : 'Unknown'
  }

  return value === true
    ? 'Allowed'
    : value === false
      ? 'Not Allowed'
      : 'Unknown'
}

const getBooleanStatusColor = (value: boolean | null) => {
  return value === true ? 'success' : value === false ? 'error' : 'default'
}

const BooleanStatusChip = ({
  value,
  variant = 'permission',
}: {
  value: boolean | null
  variant?: 'permission' | 'yesno'
}) => (
  <Chip
    size="small"
    label={getBooleanStatusLabel(value, variant)}
    color={getBooleanStatusColor(value)}
    sx={{ fontFamily: 'monospace', flexShrink: 0 }}
  />
)
