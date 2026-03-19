import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Paper,
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
    <Card
      elevation={2}
      sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}
    >
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Info color="primary" />
            <Typography variant="body1" fontWeight="bold">
              Core Well Information
            </Typography>
          </Stack>
        }
      />
      <CardContent>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Section title="Well Details">
              <InfoRow
                label="Hole Depth"
                value={`${well?.hole_depth || 'N/A'}${
                  well?.hole_depth ? ` ${well?.hole_depth_unit}` : ''
                }`}
              />
              <InfoRow
                label="Well Depth"
                value={`${well?.well_depth || 'N/A'}${
                  well?.well_depth ? ` ${well?.well_depth_unit}` : ''
                }`}
              />
              <InfoRow
                label="Measuring Point"
                value={
                  [
                    well?.measuring_point_description || null,
                    well?.measuring_point_height
                      ? `${well.measuring_point_height} ${well?.measuring_point_height_unit ?? ''}`.trim()
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' | ') || 'N/A'
                }
              />
            </Section>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Section title="Location Information">
              <InfoRow
                label="Latitude / Longitude"
                value={
                  well?.current_location?.geometry
                    ? `${lat?.toFixed(6)}, ${lon?.toFixed(6)}`
                    : 'N/A'
                }
              />
              <InfoRow
                label="Easting / Northing"
                value={`${easting?.toFixed(0) || 'N/A'}, ${
                  northing?.toFixed(0) || 'N/A'
                }`}
              />
            </Section>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Section title="Elevation Information">
              <InfoRow
                label="Elevation"
                value={`${
                  well?.current_location?.properties?.elevation?.toFixed(2) ||
                  'N/A'
                }${
                  well?.current_location?.properties?.elevation_unit
                    ? ` ${well?.current_location?.properties?.elevation_unit}`
                    : ''
                }`}
              />
              <InfoRow
                label="Elevation Method"
                value={
                  well?.current_location?.properties?.elevation_method || 'N/A'
                }
              />
              <InfoRow
                label="Vertical Datum"
                value={
                  well?.current_location?.properties?.vertical_datum || 'N/A'
                }
              />
            </Section>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

const Section = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <Paper
    variant="outlined"
    sx={{
      p: 1.5,
      borderRadius: 2,
      borderColor: 'divider',
      bgcolor: 'background.default',
    }}
  >
    <Typography
      variant="overline"
      sx={{
        display: 'block',
        mb: 1,
        color: 'text.secondary',
        letterSpacing: 1,
        lineHeight: 1.2,
      }}
    >
      {title}
    </Typography>
    <Stack spacing={0.75}>{children}</Stack>
  </Paper>
)

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: '132px 1fr' },
      gap: 0.75,
      alignItems: 'start',
    }}
  >
    <Typography variant="caption" color="text.secondary" fontWeight={700}>
      {label}
    </Typography>
    <Typography variant="body2">{value}</Typography>
  </Box>
)

const LoadingCard = () => (
  <Card
    elevation={2}
    sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}
  >
    <CardHeader title={<Skeleton variant="text" width={150} height={32} />} />
    <CardContent>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Skeleton variant="rounded" width="100%" height={220} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Skeleton variant="rounded" width="100%" height={220} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Skeleton variant="rounded" width="100%" height={220} />
        </Grid>
      </Grid>
    </CardContent>
  </Card>
)
