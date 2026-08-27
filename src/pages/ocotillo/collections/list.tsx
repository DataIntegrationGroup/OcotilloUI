import {
  ArrowOutward,
  DataObject,
  ElectricBolt,
  Opacity,
  OpenInNew,
  TableRows,
  ViewModule,
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { alpha } from '@mui/material/styles'
import { useCan, useDataProvider } from '@refinedev/core'
import { ErrorComponent } from '@refinedev/mui'
import { useQuery } from '@tanstack/react-query'
import { Fragment, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import { CollectionSchemaDialog } from '@/components/CollectionSchemaDialog'
import {
  GisConnectionsPanel,
  GisLayerDownloads,
} from '@/components/GisArtifacts'
import { SCREENS } from '@/constants/breakpoints'
import { useAccessCapabilities, useGisArtifacts } from '@/hooks'
import { settings } from '@/settings'
import {
  buildCollectionRows,
  type CollectionsTableRow,
  collectionDescriptionOf,
  collectionIdOf,
  collectionTitleOf,
} from '@/utils/collectionsView'
import { type GisLayer, indexGisLayersByCollection } from '@/utils/gisArtifacts'
import {
  type OgcCollectionRecord,
  resolveCollection,
} from '@/utils/ogcLayerUtils'

type CollectionsView = 'cards' | 'table'

// Desktop-GIS connection and layer downloads are hidden on this page for now.
// The catalogue data still loads (the collection index keys off it), so
// flipping this back to `true` restores the panel, the table column, and the
// per-card download links together.
const SHOW_DESKTOP_GIS = false

type SchemaDialogTarget = {
  collectionId?: string
  title: string
}

type CollectionGroupKey =
  | 'groundwater'
  | 'surfaceWater'
  | 'geothermal'
  | 'reference'

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
  displayLabel?: string
}

type RegisteredCollectionMatch = {
  layerKey: string
  collection: OgcCollectionRecord
  displayLabel?: string
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
  groundwater: {
    icon: Opacity,
    accent: '#0f766e',
    softAccent: '#ccfbf1',
    borderAccent: '#5eead4',
  },
  surfaceWater: {
    icon: Opacity,
    accent: '#0369a1',
    softAccent: '#e0f2fe',
    borderAccent: '#7dd3fc',
  },
  geothermal: {
    icon: ElectricBolt,
    accent: '#b45309',
    softAccent: '#fef3c7',
    borderAccent: '#fbbf24',
  },
  reference: {
    icon: ArrowOutward,
    accent: '#475569',
    softAccent: '#e2e8f0',
    borderAccent: '#94a3b8',
  },
}

const REGISTERED_MAP_COLLECTIONS: RegisteredMapCollection[] = [
  {
    layerKey: 'ogc-latest-tds',
    groupKey: 'groundwater',
    candidates: [
      'Latest TDS (Water Wells)',
      'latest_tds_water_wells',
      'latest_tds',
    ],
  },
  {
    layerKey: 'ogc-major-chemistry',
    groupKey: 'groundwater',
    candidates: [
      'Major Chemistry (Water Wells)',
      'major_chemistry_results',
      'major_chemistry_wells',
      'major_chemistry',
    ],
  },
  {
    layerKey: 'ogc-minor-chemistry',
    groupKey: 'groundwater',
    candidates: [
      'Minor Chemistry (Water Wells)',
      'minor_chemistry_wells',
      'minor_chemistry_results',
      'minor_chemistry',
    ],
  },
  {
    layerKey: 'ogc-depth-to-water-trend',
    groupKey: 'groundwater',
    candidates: [
      'Depth to Water Trend (Water Wells)',
      'depth_to_water_trend_water_wells',
      'depth_to_water_trend',
      'latest_trend',
    ],
  },
  {
    layerKey: 'ogc-water-well-summary',
    groupKey: 'groundwater',
    candidates: ['Water Well Summary', 'water_well_summary'],
  },
  {
    layerKey: 'ogc-water-wells',
    groupKey: 'groundwater',
    candidates: ['Water Wells', 'water_wells'],
  },
  {
    layerKey: 'ogc-actively-monitored',
    groupKey: 'groundwater',
    candidates: [
      'Actively Monitored (Water Wells)',
      'Actively Monitored Water Wells',
      'actively_monitored_water_wells',
      'actively_monitored_wells',
      'actively_monitored',
    ],
  },
  {
    layerKey: 'ogc-springs',
    groupKey: 'surfaceWater',
    candidates: ['Springs', 'springs'],
  },
  {
    layerKey: 'ogc-water-elevation-points',
    groupKey: 'groundwater',
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
    groupKey: 'surfaceWater',
    candidates: ['Surface Water Diversions', 'surface_water_diversions'],
  },
  {
    layerKey: 'ogc-ephemeral-streams',
    groupKey: 'surfaceWater',
    candidates: ['Ephemeral Streams', 'ephemeral_streams'],
  },
  {
    layerKey: 'ogc-lakes-ponds-reservoirs',
    groupKey: 'surfaceWater',
    candidates: ['Lakes, Ponds, and Reservoirs', 'lakes_ponds_and_reservoirs'],
  },
  {
    layerKey: 'ogc-meteorological-stations',
    groupKey: 'surfaceWater',
    candidates: ['Meteorological Stations', 'meteorological_stations'],
  },
  {
    layerKey: 'ogc-project-areas',
    groupKey: 'reference',
    candidates: [
      'Project Areas',
      'Project Area',
      'project_areas',
      'project_area',
    ],
    displayLabel: 'AMP Project Areas',
  },
  {
    layerKey: 'ogc-outfalls-return-flow',
    groupKey: 'surfaceWater',
    candidates: ['Outfalls and Return Flow', 'outfalls_and_return_flow'],
  },
  {
    layerKey: 'ogc-perennial-streams',
    groupKey: 'surfaceWater',
    candidates: ['Perennial Streams', 'perennial_streams'],
  },
  {
    layerKey: 'ogc-rock-sample-locations',
    groupKey: 'reference',
    candidates: ['Rock Sample Locations', 'rock_sample_locations'],
  },
  {
    layerKey: 'ogc-soil-gas-sample-locations',
    groupKey: 'reference',
    candidates: ['Soil Gas Sample Locations', 'soil_gas_sample_locations'],
  },
  {
    layerKey: 'ogc-geothermal-wells-bht',
    groupKey: 'geothermal',
    candidates: [
      'geothermal_wells_bht',
      'Geothermal Wells — Bottom-Hole Temperature',
    ],
    displayLabel: 'Geothermal Wells (BHT)',
  },
  {
    layerKey: 'ogc-geothermal-wells-temperature-profile',
    groupKey: 'geothermal',
    candidates: [
      'geothermal_wells_temperature_profile',
      'Geothermal Wells — Temperature-Depth Profile',
    ],
    displayLabel: 'Geothermal Wells (Temp-Depth)',
  },
  {
    layerKey: 'ogc-bht-measurements',
    groupKey: 'geothermal',
    candidates: ['bht_measurements', 'BHT Measurements'],
  },
  {
    layerKey: 'ogc-temp-depth-measurements',
    groupKey: 'geothermal',
    candidates: ['temp_depth_measurements', 'Temperature-Depth Measurements'],
  },
  {
    layerKey: 'ogc-heat-flow',
    groupKey: 'geothermal',
    candidates: ['heat_flow', 'Heat Flow'],
  },
  {
    layerKey: 'ogc-dst',
    groupKey: 'geothermal',
    candidates: ['dst', 'Drill Stem Tests'],
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
      a.displayLabel ||
      a.collection.title ||
      a.collection.name ||
      a.collection.id ||
      a.collection.collection_id ||
      ''
    const bLabel =
      b.displayLabel ||
      b.collection.title ||
      b.collection.name ||
      b.collection.id ||
      b.collection.collection_id ||
      ''

    return aLabel.localeCompare(bLabel)
  })

const groupCollections = (
  collections: OgcCollectionRecord[]
): CollectionGroup[] => {
  const grouped = {
    groundwater: [] as RegisteredCollectionMatch[],
    surfaceWater: [] as RegisteredCollectionMatch[],
    geothermal: [] as RegisteredCollectionMatch[],
    reference: [] as RegisteredCollectionMatch[],
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
      displayLabel: definition.displayLabel,
    })
  }

  return [
    {
      key: 'groundwater',
      title: 'Groundwater',
      description:
        'Water wells, groundwater chemistry, depth-to-water, and water-elevation collections.',
      collections: sortRegisteredCollections(grouped.groundwater),
    },
    {
      key: 'surfaceWater',
      title: 'Surface Water',
      description:
        'Springs, streams, diversions, lakes, reservoirs, and related hydrologic context collections.',
      collections: sortRegisteredCollections(grouped.surfaceWater),
    },
    {
      key: 'geothermal',
      title: 'Geothermal',
      description:
        'Geothermal wells with bottom-hole and temperature-depth data, plus the underlying measurements, heat flow, and drill stem tests.',
      collections: sortRegisteredCollections(grouped.geothermal),
    },
    {
      key: 'reference',
      title: 'Reference',
      description:
        'Boundary, project, and contextual collections that support map interpretation.',
      collections: sortRegisteredCollections(grouped.reference),
    },
  ]
}

export const CollectionsPage = () => {
  const { data: access, isLoading: isAccessLoading } = useCan({
    action: 'list',
    resource: 'ocotillo.collections',
  })
  const dataProvider = useDataProvider()
  const { canViewAmp } = useAccessCapabilities()
  const [view, setView] = useState<CollectionsView>('table')
  // The target outlives `isSchemaOpen` on purpose: MUI keeps the dialog mounted
  // through its closing transition, and clearing the target on close would
  // flash an empty schema shell on the way out.
  const [schemaTarget, setSchemaTarget] = useState<SchemaDialogTarget | null>(
    null
  )
  const [isSchemaOpen, setIsSchemaOpen] = useState(false)

  const openSchema = (target: SchemaDialogTarget) => {
    setSchemaTarget(target)
    setIsSchemaOpen(true)
  }
  const { data: gisCatalog } = useGisArtifacts({
    enabled: access?.can === true,
  })

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
  const gisLayersByCollection = indexGisLayersByCollection(gisCatalog)
  const totalCollections = groups.reduce(
    (count, group) => count + group.collections.length,
    0
  )

  return (
    // Wider than the old `lg` cap, which left the table cramped: full width
    // up to a widescreen monitor, then ten of twelve columns so the rows do
    // not run the whole span of a very wide display.
    <Container maxWidth={false} sx={{ py: 3 }}>
      <Box
        sx={{
          mx: 'auto',
          width: '100%',
          [`@media (min-width:${SCREENS.widescreen})`]: { width: '83.3333%' },
        }}
      >
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
                    <Typography variant="h4">OGC Datasets</Typography>
                    <Typography variant="body1" color="text.secondary">
                      Published map-backed datasets grouped into Water and
                      Geothermal with cleaner IDs and descriptions for quick
                      review.
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      flexWrap="wrap"
                    >
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
                    <ToggleButtonGroup
                      size="small"
                      exclusive
                      value={view}
                      onChange={(_event, next: CollectionsView | null) => {
                        if (next) setView(next)
                      }}
                      aria-label="Dataset layout"
                    >
                      <ToggleButton value="cards" aria-label="Card view">
                        <ViewModule fontSize="small" sx={{ mr: 0.75 }} />
                        Cards
                      </ToggleButton>
                      <ToggleButton value="table" aria-label="Table view">
                        <TableRows fontSize="small" sx={{ mr: 0.75 }} />
                        Table
                      </ToggleButton>
                    </ToggleButtonGroup>
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

          {SHOW_DESKTOP_GIS && gisCatalog ? (
            <GisConnectionsPanel
              catalog={gisCatalog}
              canViewInternal={canViewAmp}
            />
          ) : null}

          {view === 'table' ? (
            <CollectionsTable
              rows={buildCollectionRows(groups, gisLayersByCollection)}
              onOpenSchema={openSchema}
            />
          ) : (
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
                          group.collections.map(
                            ({ layerKey, collection, displayLabel }, index) => (
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
                                displayLabel={displayLabel}
                                gisLayer={gisLayersByCollection.get(
                                  collectionIdOf(collection) ?? ''
                                )}
                                onOpenSchema={openSchema}
                                index={index}
                              />
                            )
                          )
                        ) : (
                          <EmptyGroupState groupKey={group.key} />
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Stack>
      </Box>

      <CollectionSchemaDialog
        open={isSchemaOpen}
        onClose={() => setIsSchemaOpen(false)}
        collectionId={schemaTarget?.collectionId}
        title={schemaTarget?.title ?? ''}
      />
    </Container>
  )
}

const CollectionsTable = ({
  rows,
  onOpenSchema,
}: {
  rows: CollectionsTableRow<CollectionGroupKey>[]
  onOpenSchema: (target: SchemaDialogTarget) => void
}) => (
  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
    <Table size="small" aria-label="Published OGC datasets">
      <TableHead>
        <TableRow>
          <TableCell>Dataset</TableCell>
          <TableCell>Description</TableCell>
          {SHOW_DESKTOP_GIS ? <TableCell>Desktop GIS</TableCell> : null}
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, index) => {
          const style = GROUP_STYLES[row.groupKey]
          // The group is carried by the row tint, so it opens with a labelled
          // band rather than repeating the group name on every row.
          const startsGroup = row.groupKey !== rows[index - 1]?.groupKey

          return (
            <Fragment key={row.id ?? `${row.groupKey}-${row.layerKey}`}>
              {startsGroup ? (
                <TableRow>
                  <TableCell
                    colSpan={SHOW_DESKTOP_GIS ? 4 : 3}
                    sx={{
                      py: 0.75,
                      bgcolor: alpha(style.accent, 0.16),
                      color: style.accent,
                      fontWeight: 700,
                      letterSpacing: 0.4,
                      textTransform: 'uppercase',
                      fontSize: 12,
                    }}
                  >
                    {row.groupTitle}
                  </TableCell>
                </TableRow>
              ) : null}
              <TableRow sx={{ bgcolor: alpha(style.accent, 0.05) }}>
                <TableCell sx={{ minWidth: 180 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {row.title}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 420 }}>
                  {row.description ? (
                    <Tooltip title={row.description}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {row.description}
                      </Typography>
                    </Tooltip>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No published description.
                    </Typography>
                  )}
                </TableCell>
                {SHOW_DESKTOP_GIS ? (
                  <TableCell sx={{ minWidth: 200 }}>
                    {row.gisLayer ? (
                      <GisLayerDownloads layer={row.gisLayer} />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                ) : null}
                <TableCell align="right">
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="flex-end"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<DataObject fontSize="small" />}
                      disabled={!row.id}
                      onClick={() =>
                        onOpenSchema({
                          collectionId: row.id,
                          title: row.title,
                        })
                      }
                      sx={{ color: style.accent }}
                    >
                      Schema
                    </Button>
                    <Button
                      component={RouterLink}
                      to={`/ocotillo/map?layer=${encodeURIComponent(row.layerKey)}`}
                      size="small"
                      variant="outlined"
                      endIcon={<ArrowOutward fontSize="small" />}
                      sx={{
                        borderColor: alpha(style.accent, 0.28),
                        color: style.accent,
                      }}
                    >
                      Open Map
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            </Fragment>
          )
        })}
      </TableBody>
    </Table>
  </TableContainer>
)

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
  displayLabel,
  gisLayer,
  onOpenSchema,
}: {
  collection: OgcCollectionRecord
  layerKey: string
  groupKey: CollectionGroupKey
  displayLabel?: string
  gisLayer?: GisLayer
  onOpenSchema: (target: SchemaDialogTarget) => void
  index: number
}) => {
  const style = GROUP_STYLES[groupKey]
  const title = collectionTitleOf(collection, displayLabel)
  const id = collectionIdOf(collection)
  const description = collectionDescriptionOf(collection)

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
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Button
              size="small"
              variant="text"
              startIcon={<DataObject fontSize="small" />}
              disabled={!id}
              onClick={() => onOpenSchema({ collectionId: id, title })}
              sx={{ color: style.accent }}
            >
              Schema
            </Button>
            <Button
              component={RouterLink}
              to={`/ocotillo/map?layer=${encodeURIComponent(layerKey)}`}
              size="small"
              variant="outlined"
              endIcon={<ArrowOutward fontSize="small" />}
              sx={{
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
        {SHOW_DESKTOP_GIS && gisLayer ? (
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Open in desktop GIS
            </Typography>
            <GisLayerDownloads layer={gisLayer} />
          </Stack>
        ) : null}
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
