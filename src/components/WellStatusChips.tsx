import { Chip, Skeleton, Stack } from '@mui/material'
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
        spacing={1}
        flexWrap="wrap"
        alignItems="center"
        useFlexGap
        sx={{ gap: 1 }}
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
    ? well.well_purposes
    : [well?.thing_type || 'UNKNOWN TYPE']

  const isPublic = well?.release_status?.toLocaleUpperCase() === 'PUBLIC'
  const isPrivate = well?.release_status?.toLocaleUpperCase() === 'PRIVATE'

  return (
    <Stack
      direction="row"
      spacing={1}
      flexWrap="wrap"
      alignItems="center"
      useFlexGap
      sx={{ gap: 1 }}
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

      {well?.groups?.map((g, i) => (
        <ChipWithExplain
          key={g?.name ?? `UNKNOWN GROUP #${i}`}
          icon={null}
          label={g?.name?.toLocaleUpperCase() || 'UNKNOWN GROUP'}
          color="primary"
          size="small"
          chipSx={statusChipSx}
          tooltip="Group or Project (click for details)"
          explain={{
            title: 'Group or Project',
            meaning:
              'The organization or existing project this site belongs to.',
            source: 'group',
          }}
        />
      ))}
    </Stack>
  )
}
