import { IWell } from '@/interfaces/ocotillo/IThing'
import {
  Card,
  CardContent,
  CardHeader,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { Map } from '@mui/icons-material'
import { MapComponent } from '@/components'

export const InteractiveSatelliteMapCard = ({ well }: { well: IWell }) => {
  if (!well) {
    return <LoadingCard />
  }

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Map color="primary" />
            <Typography variant="body1">Interactive Satellite Map</Typography>
          </Stack>
        }
      />
      <CardContent>
        <MapComponent />
      </CardContent>
    </Card>
  )
}

const LoadingCard = () => {
  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Map color="primary" />
            <Typography variant="body1">Interactive Satellite Map</Typography>
          </Stack>
        }
      />
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height={650}
          sx={{ borderRadius: '0.5rem' }}
        />
      </CardContent>
    </Card>
  )
}
