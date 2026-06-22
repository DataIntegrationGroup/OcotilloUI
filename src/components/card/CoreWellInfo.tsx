import { Box, Paper, Skeleton, Typography } from '@mui/material'
import { IWell } from '@/interfaces/ocotillo'

const STATS_WIDE_MIN_PX = 480

const statCellSx = (index: number) => ({
  px: 2,
  py: 1.5,
  borderColor: 'divider',
  borderTop: index > 0 ? '1px solid' : 'none',
  borderLeft: 'none',
  [`@container (min-width: ${STATS_WIDE_MIN_PX}px)`]: {
    borderTop: 'none',
    borderLeft: index > 0 ? '1px solid' : 'none',
  },
})

const statsGridSx = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  [`@container (min-width: ${STATS_WIDE_MIN_PX}px)`]: {
    gridTemplateColumns: 'repeat(3, 1fr)',
  },
} as const

export const CoreWellInfoCard = ({ well }: { well?: IWell }) => {
  if (!well) {
    return <LoadingBar />
  }

  const stats: { label: string; value: string }[] = [
    {
      label: 'Hole Depth',
      value: well?.hole_depth
        ? `${well.hole_depth} ${well.hole_depth_unit ?? ''}`.trim()
        : 'N/A',
    },
    {
      label: 'Well Depth',
      value: well?.well_depth
        ? `${well.well_depth} ${well.well_depth_unit ?? ''}`.trim()
        : 'N/A',
    },
    {
      label: 'Measuring Point',
      value:
        [
          well?.measuring_point_description || null,
          well?.measuring_point_height
            ? `${well.measuring_point_height} ${well.measuring_point_height_unit ?? ''}`.trim()
            : null,
        ]
          .filter(Boolean)
          .join(' | ') || 'N/A',
    },
  ]

  return (
    <Paper
      elevation={2}
      sx={{ borderRadius: 2, overflow: 'hidden', containerType: 'inline-size' }}
    >
      <Box sx={statsGridSx}>
        {stats.map((stat, i) => (
          <Box key={stat.label} sx={statCellSx(i)}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', fontWeight: 600, letterSpacing: 0.3 }}
            >
              {stat.label}
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 0.25, fontWeight: 500 }}
              title={stat.value}
            >
              {stat.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

const LoadingBar = () => (
  <Paper
    elevation={2}
    sx={{ borderRadius: 2, overflow: 'hidden', containerType: 'inline-size' }}
  >
    <Box sx={statsGridSx}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Box key={i} sx={statCellSx(i)}>
          <Skeleton width="60%" height={14} sx={{ mb: 0.5 }} />
          <Skeleton width="80%" height={18} />
        </Box>
      ))}
    </Box>
  </Paper>
)
