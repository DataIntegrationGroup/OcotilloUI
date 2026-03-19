import { useCan, useDataProvider } from '@refinedev/core'
import { ErrorComponent } from '@refinedev/mui'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowOutward,
  ElectricBolt,
  Opacity,
  OpenInNew,
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Link,
  Button,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import Grid from '@mui/material/Grid2'
import { Link as RouterLink } from 'react-router'
import { settings } from '@/settings'
import {
  resolveCollection,
  type OgcCollectionRecord,
} from '@/utils/ogcLayerUtils'

type CollectionGroupKey = 'water' | 'geothermal'

type CollectionGroup = {
  key: CollectionGroupKey
  title: string
  description: string
  collections: RegisteredCollectionMatch[]
}

type RegisteredMapCollection = {
  layerKey: string
  groupKey: CollectionGroupKey
  candidates: string[]
}

type RegisteredCollectionMatch = {
  layerKey: string
  collection: OgcCollectionRecord
}

const GROUP_STYLES: Record<
  CollectionGroupKey,
  {
    icon: typeof Opacity
    accent: string
    softAccent: string
    borderAccent: string
  }
> = {
  water: {
    icon: Opacity,
    accent: '#0f766e',
    softAccent: '#ccfbf1',
    borderAccent: '#5eead4',
  },
  geothermal: {
    icon: ElectricBolt,
    accent: '#b45309',
    softAccent: '#fef3c7',
    borderAccent: '#fbbf24',
  },
}

const REGISTERED_MAP_COLLECTIONS: RegisteredMapCollection[] = [
  {
    layerKey: 'ogc-locations',
    groupKey: 'water',
    candidates: ['Locations', 'locations'],
  },
  {
    layerKey: 'ogc-latest-depth-to-water',
    groupKey: 'water',
    candidates: [
      'Latest Depth to Water (Water Wells)',
      'latest_depth_to_water_water_wells',
      'latest_depth_to_water',
    ],
  },
  {
    layerKey: 'ogc-average-tds',
    groupKey: 'water',
    candidates: [
      'Average TDS (Water Wells)',
      'average_tds_water_wells',
      'average_tds',
    ],
  },
  {
    layerKey: 'ogc-latest-tds',
    groupKey: 'water',
    candidates: [
      'Latest TDS (Water Wells)',
      'latest_tds_water_wells',
      'latest_tds',
    ],
  },
  {
    layerKey: 'ogc-major-chemistry',
    groupKey: 'water',
    candidates: [
      'Major Chemistry (Water Wells)',
      'major_chemistry_results',
      'major_chemistry_wells',
      'major_chemistry',
    ],
  },
  {
    layerKey: 'ogc-minor-chemistry',
    groupKey: 'water',
    candidates: [
      'Minor Chemistry (Water Wells)',
      'minor_chemistry_wells',
      'minor_chemistry_results',
      'minor_chemistry',
    ],
  },
  {
    layerKey: 'ogc-depth-to-water-trend',
    groupKey: 'water',
    candidates: [
      'Depth to Water Trend (Water Wells)',
      'depth_to_water_trend_water_wells',
      'depth_to_water_trend',
      'latest_trend',
    ],
  },
  {
    layerKey: 'ogc-water-well-summary',
    groupKey: 'water',
    candidates: ['Water Well Summary', 'water_well_summary'],
  },
  {
    layerKey: 'ogc-water-wells',
    groupKey: 'water',
    candidates: ['Water Wells', 'water_wells'],
  },
  {
    layerKey: 'ogc-springs',
    groupKey: 'water',
    candidates: ['Springs', 'springs'],
  },
  {
    layerKey: 'ogc-water-elevation-contours',
    groupKey: 'water',
    candidates: [
      'Water Elevation Contours',
      'water_elevation_contours',
      'water_elevation_contour',
      'groundwater_elevation_contours',
      'water_level_contours',
      'water_table_contours',
      'potentiometric_surface_contours',
      'piezometric_contours',
    ],
  },
  {
    layerKey: 'ogc-water-elevation-points',
    groupKey: 'water',
    candidates: [
      'Water Elevation Points',
      'water_elevation_points',
      'water_elevation_point',
      'water_elevation_wells',
      'ogcapi/collections/water_elevation_wells/items',
      'groundwater_elevation_points',
      'water_level_points',
      'water_table_points',
      'potentiometric_surface_points',
      'piezometric_points',
    ],
  },
  {
    layerKey: 'ogc-surface-water-diversions',
    groupKey: 'water',
    candidates: ['Surface Water Diversions', 'surface_water_diversions'],
  },
  {
    layerKey: 'ogc-ephemeral-streams',
    groupKey: 'water',
    candidates: ['Ephemeral Streams', 'ephemeral_streams'],
  },
  {
    layerKey: 'ogc-lakes-ponds-reservoirs',
    groupKey: 'water',
    candidates: [
      'Lakes, Ponds, and Reservoirs',
      'lakes_ponds_and_reservoirs',
    ],
  },
  {
    layerKey: 'ogc-meteorological-stations',
    groupKey: 'water',
    candidates: ['Meteorological Stations', 'meteorological_stations'],
  },
  {
    layerKey: 'ogc-other-thing-types',
    groupKey: 'water',
    candidates: ['Other Thing Types', 'other_thing_types'],
  },
  {
    layerKey: 'ogc-outfalls-return-flow',
    groupKey: 'water',
    candidates: ['Outfalls and Return Flow', 'outfalls_and_return_flow'],
  },
  {
    layerKey: 'ogc-perennial-streams',
    groupKey: 'water',
    candidates: ['Perennial Streams', 'perennial_streams'],
  },
  {
    layerKey: 'ogc-rock-sample-locations',
    groupKey: 'geothermal',
    candidates: ['Rock Sample Locations', 'rock_sample_locations'],
  },
  {
    layerKey: 'ogc-soil-gas-sample-locations',
    groupKey: 'geothermal',
    candidates: ['Soil Gas Sample Locations', 'soil_gas_sample_locations'],
  },
]

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const baseApiUrl = trimTrailingSlash(settings.ocotillo_api_url)
const ogcCollectionsUrl = `${baseApiUrl}/ogcapi/collections`

const sortOgcCollections = (collections: OgcCollectionRecord[]) =>
  [...collections].sort((a, b) => {
    const aLabel = a.title || a.name || a.id || a.collection_id || ''
    const bLabel = b.title || b.name || b.id || b.collection_id || ''
    return aLabel.localeCompare(bLabel)
  })

const sortRegisteredCollections = (collections: RegisteredCollectionMatch[]) =>
  [...collections].sort((a, b) => {
    const aLabel =
      a.collection.title ||
      a.collection.name ||
      a.collection.id ||
      a.collection.collection_id ||
      ''
    const bLabel =
      b.collection.title ||
      b.collection.name ||
      b.collection.id ||
      b.collection.collection_id ||
      ''

    return aLabel.localeCompare(bLabel)
  })

const groupCollections = (collections: OgcCollectionRecord[]): CollectionGroup[] => {
  const grouped = {
    water: [] as RegisteredCollectionMatch[],
    geothermal: [] as RegisteredCollectionMatch[],
  }
  const seenCollectionIds = new Set<string>()

  for (const definition of REGISTERED_MAP_COLLECTIONS) {
    const resolved = resolveCollection(collections, definition.candidates)
    if (!resolved.exists || !resolved.id) continue
    if (seenCollectionIds.has(resolved.id)) continue

    const matchedCollection = collections.find((collection) => {
      const identifiers = [
        collection.id,
        collection.collection_id,
        collection.name,
      ].filter(Boolean)

      return identifiers.includes(resolved.id)
    })

    if (!matchedCollection) continue

    seenCollectionIds.add(resolved.id)
    grouped[definition.groupKey].push({
      layerKey: definition.layerKey,
      collection: matchedCollection,
    })
  }

  return [
    {
      key: 'water',
      title: 'Water',
      description: 'Groundwater, springs, water chemistry, levels, and related hydrologic collections.',
      collections: sortRegisteredCollections(grouped.water),
    },
    {
      key: 'geothermal',
      title: 'Geothermal',
      description: 'Reserved for geothermal wells and supporting thermal, meteorological, and sample collections when they are published.',
      collections: sortRegisteredCollections(grouped.geothermal),
    },
  ]
}

export const CollectionsPage = () => {
  const { data: access, isLoading: isAccessLoading } = useCan({
    action: 'list',
    resource: 'ocotillo.collections',
  })
  const dataProvider = useDataProvider()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['ogcapi-collections-page'],
    enabled: access?.can === true,
    staleTime: 60000,
    queryFn: async () => {
      const provider = dataProvider('ogcapi')
      const result = await provider.getList({
        resource: 'ogcapi',
        pagination: { currentPage: 1, pageSize: 500 },
      })

      return (result?.data ?? []) as OgcCollectionRecord[]
    },
  })

  if (isAccessLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    )
  }

  if (!access?.can) {
    return <ErrorComponent />
  }

  if (isLoading) {
    return (
      <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading OGC collections...
        </Typography>
      </Stack>
    )
  }

  if (isError) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error">
          Failed to load OGC datasets.
          {error instanceof Error ? ` ${error.message}` : null}
        </Alert>
      </Container>
    )
  }

  const groups = groupCollections(data ?? [])
  const totalCollections = groups.reduce(
    (count, group) => count + group.collections.length,
    0
  )

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={3.5}>
        <Paper
          variant="outlined"
          sx={(theme) => ({
            overflow: 'hidden',
            borderRadius: 3,
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(15,118,110,0.18) 0%, rgba(180,83,9,0.14) 100%)'
                : 'linear-gradient(135deg, rgba(204,251,241,0.8) 0%, rgba(254,243,199,0.9) 100%)',
          })}
        >
          <Box
            sx={(theme) => ({
              p: { xs: 2.5, md: 3.5 },
              backdropFilter: 'blur(6px)',
              backgroundColor: alpha(theme.palette.background.paper, 0.72),
            })}
          >
            <Grid container spacing={2.5} alignItems="flex-end">
              <Grid size={{ xs: 12, md: 8 }}>
                <Stack spacing={1.25}>
                  <Typography variant="overline" color="text.secondary">
                    Admin View
                  </Typography>
                  <Typography variant="h4">OGC Datasets</Typography>
                  <Typography variant="body1" color="text.secondary">
                    Published map-backed datasets grouped into Water and
                    Geothermal with cleaner IDs and descriptions for quick
                    review.
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip label={`${totalCollections} total`} />
                    {groups.map((group) => (
                      <Chip
                        key={group.key}
                        label={`${group.title}: ${group.collections.length}`}
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={0.75} sx={{ alignItems: { md: 'flex-end' } }}>
                  <Typography variant="caption" color="text.secondary">
                    Source endpoint
                  </Typography>
                  <Link
                    href={ogcCollectionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    underline="hover"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.75,
                      overflowWrap: 'anywhere',
                      fontSize: 13,
                    }}
                  >
                    {ogcCollectionsUrl}
                    <OpenInNew fontSize="inherit" />
                  </Link>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {groups.map((group) => (
            <Grid key={group.key} size={{ xs: 12, md: 6 }}>
              <Card
                variant="outlined"
                sx={(theme) => {
                  const style = GROUP_STYLES[group.key]

                  return {
                    height: '100%',
                    borderRadius: 3,
                    overflow: 'hidden',
                    borderColor: alpha(style.borderAccent, 0.85),
                    boxShadow:
                      theme.palette.mode === 'dark'
                        ? '0 12px 32px rgba(0,0,0,0.18)'
                        : '0 12px 32px rgba(15,23,42,0.06)',
                  }
                }}
              >
                <Box
                  sx={(theme) => {
                    const style = GROUP_STYLES[group.key]

                    return {
                      px: 2.5,
                      py: 2,
                      borderBottom: `1px solid ${alpha(style.borderAccent, 0.75)}`,
                      background:
                        theme.palette.mode === 'dark'
                          ? `linear-gradient(135deg, ${alpha(style.accent, 0.28)} 0%, ${alpha(
                              theme.palette.background.paper,
                              0.9
                            )} 100%)`
                          : `linear-gradient(135deg, ${style.softAccent} 0%, ${alpha(
                              '#ffffff',
                              0.92
                            )} 100%)`,
                    }
                  }}
                >
                  <GroupHeader group={group} />
                </Box>
                <CardContent sx={{ p: 2 }}>
                  <Stack spacing={1.5}>
                    {group.collections.length > 0 ? (
                      group.collections.map(({ layerKey, collection }, index) => (
                        <CollectionRow
                          key={
                            collection.id ||
                            collection.collection_id ||
                            collection.name ||
                            collection.title
                          }
                          collection={collection}
                          layerKey={layerKey}
                          groupKey={group.key}
                          index={index}
                        />
                      ))
                    ) : (
                      <EmptyGroupState groupKey={group.key} />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Container>
  )
}

const GroupHeader = ({ group }: { group: CollectionGroup }) => {
  const style = GROUP_STYLES[group.key]
  const Icon = style.icon

  return (
    <Stack spacing={1.5}>
      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(style.accent, 0.12),
              color: style.accent,
            }}
          >
            <Icon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h5">{group.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {group.description}
            </Typography>
          </Box>
        </Stack>
        <Chip
          label={`${group.collections.length} collection${group.collections.length === 1 ? '' : 's'}`}
          sx={{
            bgcolor: alpha(style.accent, 0.08),
            color: style.accent,
            borderColor: alpha(style.accent, 0.2),
          }}
          variant="outlined"
        />
      </Stack>
    </Stack>
  )
}

const CollectionRow = ({
  collection,
  layerKey,
  groupKey,
}: {
  collection: OgcCollectionRecord
  layerKey: string
  groupKey: CollectionGroupKey
  index: number
}) => {
  const style = GROUP_STYLES[groupKey]
  const title =
    collection.title || collection.name || collection.id || collection.collection_id || 'Untitled collection'
  const id = collection.id || collection.collection_id || collection.name
  const description = collection.description || collection.abstract

  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        position: 'relative',
        p: 1.5,
        pl: 2,
        borderRadius: 2,
        borderColor: alpha(style.accent, 0.16),
        bgcolor:
          theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.7)
            : alpha('#ffffff', 0.96),
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 10,
          bottom: 10,
          width: 4,
          borderRadius: 999,
          backgroundColor: alpha(style.accent, 0.8),
        },
      })}
    >
      <Stack spacing={1}>
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="flex-start"
          justifyContent="space-between"
        >
          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            {id ? (
              <Typography
                component="code"
                variant="caption"
                sx={{
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: alpha(style.accent, 0.08),
                  color: 'text.primary',
                  display: 'inline-block',
                  width: 'fit-content',
                  maxWidth: '100%',
                  overflowWrap: 'anywhere',
                }}
              >
                {id}
              </Typography>
            ) : null}
          </Stack>
          <Button
            component={RouterLink}
            to={`/ocotillo/map?layer=${encodeURIComponent(layerKey)}`}
            size="small"
            variant="outlined"
            endIcon={<ArrowOutward fontSize="small" />}
            sx={{
              flexShrink: 0,
              borderColor: alpha(style.accent, 0.28),
              color: style.accent,
              '&:hover': {
                borderColor: alpha(style.accent, 0.5),
                backgroundColor: alpha(style.accent, 0.06),
              },
            }}
          >
            Open Map
          </Button>
        </Stack>
        {description ? (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary">
            No published description.
          </Typography>
        )}
      </Stack>
    </Paper>
  )
}

const EmptyGroupState = ({ groupKey }: { groupKey: CollectionGroupKey }) => {
  const style = GROUP_STYLES[groupKey]

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        borderStyle: 'dashed',
        borderColor: alpha(style.accent, 0.22),
        bgcolor: alpha(style.accent, 0.04),
      }}
    >
      <Stack spacing={0.5}>
        <Typography variant="subtitle2" sx={{ color: style.accent }}>
          No collections currently published
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This group is configured in the UI, but the OGC endpoint does not
          currently expose any collections in it.
        </Typography>
      </Stack>
    </Paper>
  )
}
