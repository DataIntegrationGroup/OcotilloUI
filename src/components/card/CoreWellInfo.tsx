import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { IWell } from '@/interfaces/ocotillo'
import { Info } from '@mui/icons-material'

export const CoreWellInfoCard = ({
  well,
  usgs_id,
  osepod_id,
}: {
  well: IWell
  usgs_id: string
  osepod_id: string
}) => {
  if (!well) {
    return <LoadingCard />
  }

  const coords = well?.current_location?.geometry?.coordinates as
    | [number, number, number?]
    | undefined

  const [lon, lat] = coords ?? []

  const { easting, northing } = well?.current_location?.properties
    ?.utm_coordinates ?? { easting: null, northing: null }

  return (
    <Card elevation={2} sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Info color="primary" />
            <Typography variant="body1" fontWeight="bold">Core Well Information</Typography>
          </Stack>
        }
      />
      <CardContent>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body1" sx={{ mb: 1.5 }}>
              <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                Hole Depth:
              </Box>
              {well?.hole_depth || 'N/A'}
              {well?.hole_depth ? ` ${well?.hole_depth_unit}` : null}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1.5 }}>
              <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                Well Depth:
              </Box>
              {well?.well_depth || 'N/A'}
              {well?.well_depth ? ` ${well?.well_depth_unit}` : null}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1.5 }}>
              <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                Measuring Point Description:
              </Box>
              {well?.measuring_point_description || 'N/A'}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1.5 }}>
              <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                Vertical Datum:
              </Box>
              {well?.current_location?.properties?.vertical_datum || 'N/A'}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1.5 }}>
              <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                Latitude/Longitude:
              </Box>
              {well?.current_location?.geometry
                ? `${lat?.toFixed(6)}, ${lon?.toFixed(6)}`
                : 'N/A'}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1.5 }}>
              <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                Elevation:
              </Box>
              {well?.current_location?.properties?.elevation?.toFixed(2) ||
                'N/A'}
              {well?.current_location?.properties?.elevation_unit
                ? ` ${well?.current_location?.properties?.elevation_unit}`
                : null}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body1" sx={{ mb: 1.5 }}>
              <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                Measuring Point Height:
              </Box>
              {well?.measuring_point_height || 'N/A'}
              {well?.measuring_point_height
                ? ` ${well?.measuring_point_height_unit}`
                : null}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1.5 }}>
              <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                Easting, Northing:
              </Box>
              {`${easting?.toFixed(0) || 'N/A'}, ${northing?.toFixed(0) || 'N/A'}`}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1.5 }}>
              <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                Elevation Method:
              </Box>
              {well?.current_location?.properties?.elevation_method || 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

const LoadingCard = () => (
  <Card elevation={2} sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}>
    <CardHeader title={<Skeleton variant="text" width={150} height={32} />} />
    <CardContent>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton
              key={i}
              variant="text"
              width="80%"
              height={24}
              sx={{ mb: 1.5 }}
            />
          ))}
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="text"
              width="80%"
              height={24}
              sx={{ mb: 1.5 }}
            />
          ))}
        </Grid>
      </Grid>
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Alternate IDs
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Skeleton variant="text" width={200} height={24} sx={{ mb: 1.5 }} />
        <Skeleton variant="text" width={200} height={24} />
      </Box>
    </CardContent>
  </Card>
)
