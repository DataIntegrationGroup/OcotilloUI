import { Box, Paper, Skeleton, Typography } from '@mui/material'
import { IWell } from '@/interfaces/ocotillo'

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
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {stats.map((stat, i) => (
          <Box
            key={stat.label}
            sx={{
              px: 2,
              py: 1.5,
              borderLeft: i > 0 ? '1px solid' : 'none',
              borderColor: 'divider',
            }}
          >
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
  <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            px: 2,
            py: 1.5,
            borderLeft: i > 0 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Skeleton width="60%" height={14} sx={{ mb: 0.5 }} />
          <Skeleton width="80%" height={18} />
        </Box>
      ))}
    </Box>
  </Paper>
)
