import {
  Agriculture,
  Groups,
  Public,
  PublicOff,
  WaterDrop,
} from '@mui/icons-material'
import {
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
import { ChipWithExplain } from '@/components'

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

  const hasPurposes = !!(
    well?.well_purposes?.length && well.well_purposes.length > 0
  )

  const topChipValues = hasPurposes
    ? well!.well_purposes
    : [well?.thing_type || 'UNKNOWN TYPE']

  const topChipIcon = hasPurposes ? <WaterDrop /> : <Agriculture />
  const isPublic = well?.release_status?.toLocaleUpperCase() === 'PUBLIC'
  const isPrivate = well?.release_status?.toLocaleUpperCase() === 'PRIVATE'

  return (
    <Card elevation={2} sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}>
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
              sx={{
                gap: 2,
                rowGap: 2,
                columnGap: 2,
                mt: 1,
              }}
            >
              {topChipValues.map((p, i) => (
                <ChipWithExplain
                  key={p ?? `UNKNOWN TYPE #${i}`}
                  label={p?.toLocaleUpperCase() || 'UNKNOWN TYPE'}
                  icon={topChipIcon}
                  color="info"
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
                  chipSx={{ fontFamily: 'monospace', px: 1 }}
                />
              ))}

              <ChipWithExplain
                label={
                  well?.release_status?.toLocaleUpperCase() || 'UNKNOWN STATUS'
                }
                icon={isPublic ? <Public /> : isPrivate ? <PublicOff /> : null}
                color={isPublic ? 'success' : isPrivate ? 'error' : null}
                tooltip="Visibility (click for details)"
                explain={{
                  title: 'Visibility',
                  meaning:
                    'Who is allowed to view the data (Public: visible to anyone; Private: authorized users only).',
                  source: 'release_status',
                }}
                chipSx={{ fontFamily: 'monospace', px: 1 }}
              />

              {well?.groups?.map((g, i) => (
                <ChipWithExplain
                  key={g?.name ?? `UNKNOWN GROUP #${i}`}
                  icon={<Groups />}
                  label={g?.name?.toLocaleUpperCase() || 'UNKNOWN GROUP'}
                  color="primary"
                  tooltip="Group or Project (click for details)"
                  explain={{
                    title: 'Group or Project',
                    meaning:
                      'The organization or existing project this site belongs to.',
                    source: 'group',
                  }}
                  chipSx={{ fontFamily: 'monospace', px: 1 }}
                />
              ))}
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
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6">Measuring Point Height:</Typography>
            <Typography variant="body1">
              {well?.measuring_point_height || 'N/A'}{' '}
              {well?.measuring_point_height
                ? well?.measuring_point_height_unit
                : null}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6">Measuring Point Description:</Typography>
            <Typography variant="body1">
              {well?.measuring_point_description || 'N/A'}{' '}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6">Easting, Northing:</Typography>
            <Typography variant="body1">
              {`${easting?.toFixed(0) || 'N/A'}, ${northing?.toFixed(0) || 'N/A'}`}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6">Vertical Datum:</Typography>
            <Typography variant="body1">
              {well?.current_location?.properties?.vertical_datum || 'N/A'}{' '}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6">Latitude/Longitude:</Typography>
            <Typography variant="body1">
              {well?.current_location?.geometry
                ? `${lat?.toFixed(6)}, ${lon?.toFixed(6)}`
                : 'N/A'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6">Elevation:</Typography>
            <Typography variant="body1">
              {well?.current_location?.properties?.elevation?.toFixed(2) ||
                'N/A'}
              {well?.current_location?.properties?.elevation_unit
                ? ` ${well?.current_location?.properties?.elevation_unit}`
                : null}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6">Elevation Method:</Typography>
            <Typography variant="body1">
              {well?.current_location?.properties?.elevation_method || 'N/A'}
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
  <Card elevation={2} sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}>
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
          <Skeleton variant="text" width={140} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={60} height={24} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Skeleton variant="text" width={140} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={60} height={24} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Skeleton variant="text" width={220} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={60} height={24} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Skeleton variant="text" width={180} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={160} height={24} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Skeleton variant="text" width={140} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={90} height={24} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Skeleton variant="text" width={200} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={240} height={24} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Skeleton variant="text" width={140} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={90} height={24} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Skeleton variant="text" width={140} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={90} height={24} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Typography variant="h4">Alternate IDs</Typography>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Skeleton variant="text" width={80} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={60} height={24} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Skeleton variant="text" width={80} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={60} height={24} />
        </Grid>
      </Grid>
    </CardContent>
  </Card>
)
