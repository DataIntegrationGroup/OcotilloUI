import { IGroup, IWell } from '@/interfaces/ocotillo/IThing'
import {
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { convertLonLatToUTM, parseWktPoint } from '@/utils'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/utils'

export const CoreWellInfoCard = ({well, usgs_id, osepod_id}: { well: IWell, usgs_id: string, osepod_id: string }) => {

  // ({ well }: { well: IWell }) => {
  const coords = parseWktPoint(well?.current_location?.point)
  const [easting, northing] = coords
    ? convertLonLatToUTM(coords.lon, coords.lat)
    : [undefined, undefined]

  if (!well) {
    return <LoadingCard />
  }

  const groupId = well?.group_id
  const groupQuery = useQuery<IGroup | null>({
    queryKey: ['group', groupId],
    queryFn: async () => {
      if (!groupId) return null

      return apiFetch({
        endpoint: `/group/${groupId}`,
        failureMessage: 'Failed to fetch group',
      })
    },
    enabled: Boolean(groupId),
  })

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardHeader title={<Typography variant="h5">{well?.name}</Typography>} />
      <CardContent>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <Stack
              direction="row"
              spacing={2}
              flexWrap="wrap"
              alignItems="center"
              justifyContent="space-around"
            >
              <Chip
                sx={{ fontFamily: 'monospace' }}
                label={
                  well?.well_purpose?.toLocaleUpperCase() ||
                  well?.thing_type?.toLocaleUpperCase() ||
                  'UNKNOWN TYPE'
                }
                color="info"
              />
              <Chip
                sx={{ fontFamily: 'monospace' }}
                label={
                  well?.release_status?.toLocaleUpperCase() || 'UNKNOWN STATUS'
                }
                color="error"
              />
              {groupQuery.isLoading ? (
                <Skeleton
                  variant="rectangular"
                  width={150}
                  height={35}
                  sx={{ borderRadius: '2rem' }}
                />
              ) : (
                <Chip
                  sx={{ fontFamily: 'monospace' }}
                  label={
                    groupQuery?.data?.name?.toLocaleUpperCase() ||
                    'UNKNOWN GROUP'
                  }
                  color="primary"
                />
              )}
            </Stack>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Divider />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6">Hole Depth:</Typography>
            <Typography variant="body1">
              {well?.hole_depth || 'N/A'}{' '}
              {well?.hole_depth ? well?.hole_depth_unit : null}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6">Well Depth:</Typography>
            <Typography variant="body1">
              {well?.well_depth || 'N/A'}{' '}
              {well?.well_depth ? well?.well_depth_unit : null}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6">Northing/Easting:</Typography>
            <Typography variant="body1">
              {`${northing?.toFixed(0) || 'N/A'}, ${easting?.toFixed(0) || 'N/A'}`}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6">Latitude/Longitude:</Typography>
            <Typography variant="body1">
              {coords
                ? `${coords.lat?.toFixed(6)}, ${coords.lon?.toFixed(6)}`
                : 'N/A'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6">Elevation:</Typography>
            <Typography variant="body1">
              {well?.current_location?.elevation?.toFixed(0) || 'N/A'}
              {well?.current_location?.elevation ? ' ft' : null}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h4">Alternate IDs</Typography>
            <Divider />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6">OSE:</Typography>
            <Typography variant="body1">{osepod_id}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6">USGS:</Typography>
            <Typography variant="body1">{usgs_id}</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

const LoadingCard = () => (
  <Card elevation={2} sx={{ height: '100%' }}>
    <CardHeader title={<Skeleton variant="text" width={150} height={32} />} />
    <CardContent>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12 }}>
          <Stack
            direction="row"
            spacing={2}
            flexWrap="wrap"
            alignItems="center"
            justifyContent="space-around"
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                width={150}
                height={35}
                sx={{ borderRadius: '2rem' }}
              />
            ))}
          </Stack>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Skeleton variant="text" width={120} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={100} height={24} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Skeleton variant="text" width={120} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={100} height={24} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Skeleton variant="text" width={100} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={90} height={24} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Skeleton variant="text" width={100} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={90} height={24} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Skeleton variant="text" width={200} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={180} height={24} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Skeleton variant="text" width={120} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={80} height={24} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Typography variant="h4">Alternate IDs</Typography>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Skeleton variant="text" width={80} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={100} height={24} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Skeleton variant="text" width={80} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={100} height={24} />
        </Grid>
      </Grid>
    </CardContent>
  </Card>
)
