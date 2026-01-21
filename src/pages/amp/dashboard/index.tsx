import { Card, Stack, Typography } from '@mui/material'
import { useShow } from '@refinedev/core'
import { WIPAlert } from '@/components'

export const WaterDashboard = () => {
  const { query } = useShow({
    resource: 'dashboard',
    id: 'dashboard',
    dataProviderName: 'amp',
  })
  const stats = query.data?.data

  return (
    <Stack
      direction="column"
      spacing={2}
      sx={{ justifyContent: 'space-between' }}
    >
      <WIPAlert />
      <Typography variant="h3">Water Dashboard</Typography>
      <Card sx={{ p: 3 }}>
        <Typography variant="h5">Projects</Typography>
        <Typography variant="body1">{stats?.projects}</Typography>
      </Card>
      <Card sx={{ p: 3 }}>
        <Typography variant="h5">Wells</Typography>
        <Typography variant="body1">{stats?.wells}</Typography>
      </Card>
      <Card sx={{ p: 3 }}>
        <Typography variant="h5">Manual Measurements</Typography>
        <Typography variant="body1">
          {stats?.manual_measurements.count}
        </Typography>
        <Typography variant="h5">Last Measurement</Typography>
        <Typography variant="body1">
          {stats?.manual_measurements.last_timestamp}
        </Typography>
      </Card>
      <Card sx={{ p: 3 }}>
        <Typography variant="h5">Continuous Measurements</Typography>
        <Typography variant="body1">
          {stats?.continuous_measurements}
        </Typography>
      </Card>
    </Stack>
  )
}
