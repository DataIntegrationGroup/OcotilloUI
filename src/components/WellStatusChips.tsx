import { Link as RouterLink } from 'react-router'
import { Chip, Skeleton, Stack, Tooltip } from '@mui/material'
import { captureEvent, setWellsProjectFilterSource } from '@/analytics/posthog'
import { ChipWithExplain } from '@/components/ChipWithExplain'
import { IWell } from '@/interfaces/ocotillo'

const loadingChipWidths = [100, 110, 100]

const statusChipSx = {
  fontFamily: 'monospace',
  fontWeight: 300,
  lineHeight: 1,
  fontSize: '0.75rem',
  height: 22,
  '& .MuiChip-label': {
    px: 1.5,
    py: 0,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
  },
}

export const WellStatusChips = ({
  well,
  isLoading,
}: {
  well?: IWell | null
  isLoading?: boolean
}) => {
  if (isLoading) {
    return (
      <Stack
        direction="row"
        flexWrap="wrap"
        alignItems="center"
        useFlexGap
        sx={{ columnGap: 1, rowGap: 0 }}
      >
        {loadingChipWidths.map((width, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            width={width}
            height={22}
            sx={{ borderRadius: 999 }}
          >
            <Chip label="" size="small" />
          </Skeleton>
        ))}
      </Stack>
    )
  }

  if (!well) return null

  const hasPurposes = !!(
    well?.well_purposes?.length && well.well_purposes.length > 0
  )
  const topChipValues = hasPurposes
    ? (well.well_purposes ?? [])
    : [well?.thing_type || 'UNKNOWN TYPE']

  const isPublic = well?.release_status?.toLocaleUpperCase() === 'PUBLIC'
  const isPrivate = well?.release_status?.toLocaleUpperCase() === 'PRIVATE'

  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      alignItems="center"
      useFlexGap
      sx={{ columnGap: 1, rowGap: 0 }}
    >
      {topChipValues.map((p, i) => (
        <ChipWithExplain
          key={p ?? `UNKNOWN TYPE #${i}`}
          label={p?.toLocaleUpperCase() || 'UNKNOWN TYPE'}
          icon={null}
          color="info"
          size="small"
          chipSx={statusChipSx}
          tooltip={
            hasPurposes
              ? 'Well Purposes (click for details)'
              : 'Site Type (click for details)'
          }
          explain={
            hasPurposes
              ? {
                  title: 'Well Purposes',
                  meaning:
                    'What the well is used for (e.g., irrigation, monitoring, municipal supply).',
                  source: 'well_purposes',
                }
              : {
                  title: 'Site Type',
                  meaning:
                    'The category of this site (e.g., water well, monitoring well, diversion, stream, reservoir).',
                  source: 'thing_type',
                }
          }
        />
      ))}

      <ChipWithExplain
        label={well?.release_status?.toLocaleUpperCase() || 'UNKNOWN STATUS'}
        icon={null}
        color={isPublic ? 'success' : isPrivate ? 'error' : undefined}
        size="small"
        chipSx={statusChipSx}
        tooltip="Visibility (click for details)"
        explain={{
          title: 'Visibility',
          meaning:
            'Who is allowed to view the data (Public: visible to anyone; Private: authorized users only).',
          source: 'release_status',
        }}
      />

      {well?.groups?.map((group, i) => (
        <Tooltip
          key={group?.id ?? group?.name ?? `UNKNOWN GROUP #${i}`}
          title="View wells in this project"
          arrow
          placement="top"
        >
          <span>
            <Chip
              component={RouterLink}
              clickable
              to={`/ocotillo/well?projectId=${group.id}`}
              onClick={() => {
                setWellsProjectFilterSource('well_detail')
                captureEvent('wells_project_link_clicked', {
                  project_id: group.id,
                  project_name: group.name,
                  source: 'well_detail',
                })
              }}
              label={group?.name?.toLocaleUpperCase() || 'UNKNOWN GROUP'}
              color="primary"
              size="small"
              sx={{
                ...statusChipSx,
                textDecoration: 'none',
              }}
            />
          </span>
        </Tooltip>
      ))}
    </Stack>
  )
}
