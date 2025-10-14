import { IWell } from '@/interfaces/ocotillo/IThing'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { Map } from '@mui/icons-material'
import { Layer, Source } from 'react-map-gl'
import { MapComponent } from '@/components'
import { useThingLayers } from '@/hooks'

export const InteractiveSatelliteMapCard = ({ well }: { well: IWell }) => {
  const THING_LAYERS = useThingLayers()
  const waterWellsLayer = THING_LAYERS['water-wells']
  const { sourceProps, layerProps } = waterWellsLayer

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
        <Box
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            border: '2.5px solid',
            borderColor: 'divider',
          }}
        >
          <MapComponent>
            <Source id="water-wells" {...sourceProps}>
              <Layer id="location-water-wells" {...layerProps} />
            </Source>
          </MapComponent>
        </Box>
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
