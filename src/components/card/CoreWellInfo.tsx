import { IWell } from '@/interfaces/ocotillo'
import {
  Agriculture,
  Close,
  Groups,
  InfoOutlined,
  LabelOutlined,
  Public,
  PublicOff,
  WaterDrop,
} from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Popover,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { MouseEvent, useState } from 'react'

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
  const topChipTooltip = hasPurposes ? 'Well purpose' : 'Well type'
  const isPublic = well?.release_status?.toLocaleUpperCase() === 'PUBLIC'
  const isPrivate = well?.release_status?.toLocaleUpperCase() === 'PRIVATE'

  const [legendAnchorEl, setLegendAnchorEl] = useState<null | HTMLElement>(null)
  const legendOpen = Boolean(legendAnchorEl)

  const openLegend = (e: MouseEvent<HTMLElement>) =>
    setLegendAnchorEl(e.currentTarget)
  const closeLegend = () => setLegendAnchorEl(null)

  const topLegend = hasPurposes
    ? {
        icon: <WaterDrop fontSize="small" />,
        title: 'Well purpose',
        desc: 'What the well is used for (e.g., monitoring, irrigation, municipal use).',
      }
    : {
        icon: <Agriculture fontSize="small" />,
        title: 'Well type',
        desc: 'What kind of asset this is (the system “thing type”).',
      }

  const statusLegend = {
    icon: isPublic ? (
      <Public fontSize="small" />
    ) : isPrivate ? (
      <PublicOff fontSize="small" />
    ) : (
      <LabelOutlined fontSize="small" />
    ),
    title: 'Release status',
    desc: isPublic
      ? 'Public: visible to everyone who has access to the project.'
      : isPrivate
        ? 'Private: restricted visibility.'
        : 'Unknown: status not set.',
  }

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardHeader
        title={<Typography variant="h5">{well?.name}</Typography>}
        action={
          <>
            <Button
              onClick={legendOpen ? closeLegend : openLegend}
              size="small"
              startIcon={<InfoOutlined />}
              variant="text"
            >
              Legend
            </Button>

            <Popover
              open={legendOpen}
              anchorEl={legendAnchorEl}
              onClose={closeLegend}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Box sx={{ p: 2, width: 340, maxWidth: '90vw' }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    Chip Legend
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={closeLegend}
                    aria-label="Close legend"
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Stack>

                <List dense>
                  <ListItem>
                    <ListItemIcon>{topLegend.icon}</ListItemIcon>
                    <ListItemText
                      primary={topLegend.title}
                      secondary={topLegend.desc}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>{statusLegend.icon}</ListItemIcon>
                    <ListItemText
                      primary={statusLegend.title}
                      secondary={statusLegend.desc}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <Groups fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Group"
                      secondary="A team or organization this well belongs to."
                    />
                  </ListItem>
                </List>

                <Divider sx={{ my: 1 }} />

                <Typography variant="caption" color="text.secondary">
                  Tip: hover chips for quick labels; use Legend for full
                  explanations.
                </Typography>
              </Box>
            </Popover>
          </>
        }
      />
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
              {topChipValues.map((p) => (
                <Tooltip key={p ?? 'UNKNOWN'} title={topChipTooltip} arrow>
                  <span>
                    <Chip
                      icon={topChipIcon}
                      sx={{ fontFamily: 'monospace', px: 1 }}
                      label={p?.toLocaleUpperCase() || 'UNKNOWN TYPE'}
                      color="info"
                    />
                  </span>
                </Tooltip>
              ))}

              <Tooltip title="Release status" arrow>
                <span>
                  <Chip
                    sx={{ fontFamily: 'monospace', px: 1 }}
                    icon={
                      isPublic ? <Public /> : isPrivate ? <PublicOff /> : null
                    }
                    label={
                      well?.release_status?.toLocaleUpperCase() ||
                      'UNKNOWN STATUS'
                    }
                    color={isPublic ? 'success' : isPrivate ? 'error' : null}
                  />
                </span>
              </Tooltip>

              {well?.groups?.map((g) => (
                <Tooltip key={g?.id} title="Group" arrow>
                  <span>
                    <Chip
                      icon={<Groups />}
                      sx={{ fontFamily: 'monospace', px: 1 }}
                      label={g?.name?.toLocaleUpperCase() || 'UNKNOWN GROUP'}
                      color="primary"
                    />
                  </span>
                </Tooltip>
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
            <Typography variant="h6">Easting/Northing:</Typography>
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
