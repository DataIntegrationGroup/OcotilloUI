import {
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { IWell } from '@/interfaces/ocotillo'
import { ContentCopy, Directions, Info } from '@mui/icons-material'

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
  const latLonValue =
    well?.current_location?.geometry && lat != null && lon != null
      ? `${lat.toFixed(6)}, ${lon.toFixed(6)}`
      : 'N/A'
  const utmValue =
    easting != null && northing != null
      ? `${easting.toFixed(0)}, ${northing.toFixed(0)}`
      : 'N/A'
  const googleMapsUrl =
    lat != null && lon != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
      : null

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
        <Grid container columnSpacing={3} rowSpacing={1.5}>
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
            <Section
              title="Location Information"
              action={
                googleMapsUrl ? (
                  <Tooltip title="Open in Google Maps">
                    <IconButton
                      size="small"
                      component="a"
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ p: 0.25 }}
                    >
                      <Directions fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                ) : null
              }
            >
              <InfoRow
                label="Latitude / Longitude"
                value={latLonValue}
                copyValue={latLonValue !== 'N/A' ? latLonValue : undefined}
              />
              <InfoRow
                label="Easting / Northing"
                value={utmValue}
                copyValue={utmValue !== 'N/A' ? utmValue : undefined}
              />
              <InfoRow
                label="Coordinate Notes"
                value={
                  well?.current_location?.properties?.nma_location_notes ||
                  'N/A'
                }
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
  action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) => (
  <Box
    sx={{
      py: 0.25,
    }}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        mb: 1,
      }}
    >
      <Typography
        variant="overline"
        sx={{
          display: 'block',
          color: 'text.secondary',
          letterSpacing: 1,
          lineHeight: 1.2,
        }}
      >
        {title}
      </Typography>
      <Box sx={{ width: 24, display: 'flex', justifyContent: 'center' }}>
        {action}
      </Box>
    </Box>
    <Stack spacing={0.75}>{children}</Stack>
  </Box>
)

const InfoRow = ({
  label,
  value,
  copyValue,
}: {
  label: string
  value: string
  copyValue?: string
}) => {
  const handleCopy = async () => {
    if (!copyValue) return

    try {
      await navigator.clipboard.writeText(copyValue)
    } catch (error) {
      console.error(`Failed to copy ${label}`, error)
    }
  }

  return (
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
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr 24px',
        gap: 0.25,
        alignItems: 'center',
      }}
    >
      <Typography variant="body2">{value}</Typography>
      <Box
        sx={{
          width: 24,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {copyValue && (
          <Tooltip title={`Copy ${label.toLowerCase()}`}>
            <IconButton size="small" onClick={handleCopy} sx={{ p: 0.25 }}>
              <ContentCopy fontSize="inherit" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  </Box>
)
}

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
