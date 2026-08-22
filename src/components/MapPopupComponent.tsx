import { useMemo } from 'react'
import {
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { formatAppDate } from '@/utils/Date'

type PopupFeature = {
  layer?: { id?: string }
  properties?: Record<string, unknown>
}

type PopupRow = {
  label: string
  value: string
}

type PopupFeatureView = {
  id: string
  title: string
  subtitle: string
  layerLabel: string
  metrics: PopupRow[]
  rows: PopupRow[]
}

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

const titleCase = (value: string): string =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())

const normalizeLayerKey = (feature: PopupFeature): string => {
  const layerId = feature?.layer?.id || ''
  if (layerId.startsWith('location-label-')) {
    return layerId.replace('location-label-', '')
  }
  if (layerId.startsWith('location-')) {
    return layerId.replace('location-', '')
  }
  return layerId
}

const parseNumeric = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined

  const normalized = value.replace(/,/g, '').match(/-?\d+(\.\d+)?/)
  if (!normalized) return undefined
  const parsed = Number(normalized[0])
  return Number.isFinite(parsed) ? parsed : undefined
}

const formatDate = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || value.trim().length === 0) return undefined
  return formatAppDate(value) || value
}

const formatValue = (value: unknown): string => {
  if (value === undefined || value === null || value === '') return 'Not available'
  if (typeof value === 'number') return numberFormatter.format(value)
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'

  const maybeDate = formatDate(value)
  if (maybeDate) return maybeDate

  return String(value)
}

const formatNumberWithUnit = (value: number | undefined, unit: string): string | undefined => {
  if (value === undefined) return undefined
  return `${numberFormatter.format(value)} ${unit}`.trim()
}

const getFeatureId = (properties: Record<string, unknown>): string => {
  const candidate = [
    properties.thing_id,
    properties.well_id,
    properties.id,
    properties.fid,
    properties.feature_id,
  ].find((value) => value !== undefined && value !== null && value !== '')

  return candidate ? String(candidate) : 'Unknown'
}

const getFeatureName = (properties: Record<string, unknown>): string =>
  String(
    properties.name ||
      properties.thing_name ||
      properties.location_name ||
      properties.site_name ||
      properties.siteid ||
      properties.site_id ||
      getFeatureId(properties)
  )

const getFeatureType = (properties: Record<string, unknown>): string =>
  String(
    properties.thing_type ||
      properties.site_type ||
      properties.location_type ||
      'Feature'
  )

const getLayerLabel = (layerKey: string): string => {
  const labelByLayer: Record<string, string> = {
    'ogc-latest-tds': 'Latest TDS',
    'ogc-major-chemistry': 'Major Chemistry',
    'ogc-minor-chemistry': 'Minor Chemistry',
    'ogc-depth-to-water-trend': 'Depth to Water Trend',
    'ogc-water-elevation-points': 'Water Elevation',
    'ogc-water-well-summary': 'Water Well Summary',
    'ogc-water-wells': 'Water Wells',
    'ogc-actively-monitored': 'Actively Monitored',
    'ogc-springs': 'Springs',
    'ogc-project-areas': 'AMP Project Areas',
  }

  return labelByLayer[layerKey] || titleCase(layerKey.replace(/^ogc-/, ''))
}

const isTypeImplicitFromLayer = (
  layerKey: string,
  featureType: string
): boolean => {
  const normalizedType = featureType.toLowerCase()

  if (
    [
      'ogc-water-wells',
      'ogc-water-well-summary',
      'ogc-latest-tds',
      'ogc-major-chemistry',
      'ogc-minor-chemistry',
      'ogc-depth-to-water-trend',
      'ogc-water-elevation-points',
      'ogc-actively-monitored',
    ].includes(layerKey)
  ) {
    return normalizedType === 'water well'
  }

  if (layerKey === 'ogc-springs') {
    return normalizedType === 'spring'
  }

  return false
}

const getString = (properties: Record<string, unknown>, key: string): string | undefined => {
  const value = properties[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

const getNumber = (properties: Record<string, unknown>, key: string): number | undefined =>
  parseNumeric(properties[key])

const makeRow = (label: string, value: string | undefined): PopupRow => ({
  label,
  value: value || 'Not available',
})

const formatDateRange = (
  start: string | undefined,
  end: string | undefined
): string | undefined => {
  const formattedStart = formatDate(start)
  const formattedEnd = formatDate(end)
  if (formattedStart && formattedEnd) return `${formattedStart} to ${formattedEnd}`
  return formattedStart || formattedEnd || undefined
}

const buildFeatureRows = (
  properties: Record<string, unknown>,
  layerKey: string
): PopupRow[] => {
  const featureType = titleCase(getFeatureType(properties))
  const commonRows: PopupRow[] = isTypeImplicitFromLayer(layerKey, featureType)
    ? []
    : [{ label: 'Type', value: featureType }]
  const releaseStatus = getString(properties, 'release_status')

  const layerSpecificRowsByLayer: Record<string, PopupRow[]> = {
    'ogc-latest-tds': [
      makeRow(
        'Latest TDS',
        formatNumberWithUnit(
          getNumber(properties, 'latest_tds_value'),
          getString(properties, 'latest_tds_units') || 'mg/L'
        )
      ),
      makeRow(
        'Observation Date',
        formatDate(properties.latest_tds_observation_date)
      ),
    ],
    'ogc-major-chemistry': [
      makeRow(
        'Analytes',
        getNumber(properties, 'analyte_count')?.toString()
      ),
      makeRow(
        'Latest Chemistry Date',
        formatDate(properties.latest_chemistry_date)
      ),
      makeRow(
        'TDS',
        formatNumberWithUnit(
          getNumber(properties, 'tds'),
          getString(properties, 'tds_units') || 'mg/L'
        )
      ),
      makeRow(
        'Calcium',
        formatNumberWithUnit(
          getNumber(properties, 'calcium'),
          getString(properties, 'calcium_units') || 'mg/L'
        )
      ),
      makeRow(
        'Magnesium',
        formatNumberWithUnit(
          getNumber(properties, 'magnesium'),
          getString(properties, 'magnesium_units') || 'mg/L'
        )
      ),
      makeRow(
        'Sodium',
        formatNumberWithUnit(
          getNumber(properties, 'sodium'),
          getString(properties, 'sodium_units') || 'mg/L'
        )
      ),
    ],
    'ogc-minor-chemistry': [
      makeRow(
        'Analytes',
        getNumber(properties, 'analyte_count')?.toString()
      ),
      makeRow(
        'Latest Chemistry Date',
        formatDate(properties.latest_chemistry_date)
      ),
      makeRow(
        'H2R',
        formatNumberWithUnit(
          getNumber(properties, 'h2r'),
          getString(properties, 'h2r_units') || ''
        )
      ),
      makeRow(
        'O18R',
        formatNumberWithUnit(
          getNumber(properties, 'o18r'),
          getString(properties, 'o18r_units') || ''
        )
      ),
      makeRow(
        'C13R',
        formatNumberWithUnit(
          getNumber(properties, 'c13r'),
          getString(properties, 'c13r_units') || ''
        )
      ),
      makeRow(
        'C14 Years',
        formatNumberWithUnit(
          getNumber(properties, 'c14_years'),
          getString(properties, 'c14_years_units') || ''
        )
      ),
      makeRow(
        'Fluoride',
        formatNumberWithUnit(
          getNumber(properties, 'fluoride'),
          getString(properties, 'fluoride_units') || 'mg/L'
        )
      ),
      makeRow(
        'Bromide',
        formatNumberWithUnit(
          getNumber(properties, 'bromide'),
          getString(properties, 'bromide_units') || 'mg/L'
        )
      ),
      makeRow(
        'Nitrate',
        formatNumberWithUnit(
          getNumber(properties, 'nitrate'),
          getString(properties, 'nitrate_units') || 'mg/L'
        )
      ),
      makeRow(
        'Phosphate',
        formatNumberWithUnit(
          getNumber(properties, 'phosphate'),
          getString(properties, 'phosphate_units') || 'mg/L'
        )
      ),
      makeRow(
        'Arsenic',
        formatNumberWithUnit(
          getNumber(properties, 'arsenic'),
          getString(properties, 'arsenic_units') || 'ug/L'
        )
      ),
      makeRow(
        'Uranium',
        formatNumberWithUnit(
          getNumber(properties, 'uranium'),
          getString(properties, 'uranium_units') || 'ug/L'
        )
      ),
      makeRow(
        'Iron',
        formatNumberWithUnit(
          getNumber(properties, 'iron'),
          getString(properties, 'iron_units') || 'ug/L'
        )
      ),
      makeRow(
        'Manganese',
        formatNumberWithUnit(
          getNumber(properties, 'manganese'),
          getString(properties, 'manganese_units') || 'ug/L'
        )
      ),
    ],
    'ogc-depth-to-water-trend': [
      makeRow('Trend', getString(properties, 'trend_category') && titleCase(String(properties.trend_category))),
      makeRow(
        'Slope',
        formatNumberWithUnit(getNumber(properties, 'slope_ft_per_year'), 'ft/yr')
      ),
      makeRow(
        'Records Used',
        getNumber(properties, 'record_count')?.toString()
      ),
      makeRow(
        'Date Range',
        formatDateRange(
          getString(properties, 'first_observation_datetime'),
          getString(properties, 'last_observation_datetime')
        )
      ),
      makeRow(
        'Span',
        formatNumberWithUnit(getNumber(properties, 'span_years'), 'yr')
      ),
    ],
    'ogc-water-elevation-points': [
      makeRow(
        'Water Elevation',
        formatNumberWithUnit(getNumber(properties, 'water_elevation_ft'), 'ft')
      ),
      makeRow('Observation Date', formatDate(properties.observation_datetime)),
      makeRow(
        'Ground Elevation',
        formatNumberWithUnit(getNumber(properties, 'elevation_m'), 'm')
      ),
      makeRow(
        'Depth to Water',
        formatNumberWithUnit(
          getNumber(properties, 'depth_to_water_below_ground_surface_ft'),
          'ft bgs'
        )
      ),
    ],
    'ogc-water-well-summary': [
      makeRow(
        'Last Water Level',
        formatNumberWithUnit(getNumber(properties, 'last_water_level'), 'ft bgs')
      ),
      makeRow('Last Observation', formatDate(properties.last_water_level_datetime)),
      makeRow(
        'Water Level Count',
        getNumber(properties, 'total_water_levels')?.toString()
      ),
      makeRow(
        'Trend',
        formatNumberWithUnit(getNumber(properties, 'water_level_trend_ft_per_year'), 'ft/yr')
      ),
      makeRow('Formation', getString(properties, 'formation_zone')),
      makeRow(
        'Well Depth',
        formatNumberWithUnit(getNumber(properties, 'well_depth'), 'ft')
      ),
    ],
    'ogc-water-wells': [
      makeRow('First Visit', formatDate(properties.first_visit_date)),
      makeRow(
        'Elevation',
        formatNumberWithUnit(getNumber(properties, 'elevation'), 'ft')
      ),
      makeRow(
        'Well Depth',
        formatNumberWithUnit(getNumber(properties, 'well_depth'), 'ft')
      ),
      makeRow(
        'Hole Depth',
        formatNumberWithUnit(getNumber(properties, 'hole_depth'), 'ft')
      ),
      makeRow('Release Status', releaseStatus && titleCase(releaseStatus)),
    ],
    'ogc-springs': [
      makeRow('First Visit', formatDate(properties.first_visit_date)),
      makeRow(
        'Elevation',
        formatNumberWithUnit(getNumber(properties, 'elevation'), 'ft')
      ),
      makeRow('Release Status', releaseStatus && titleCase(releaseStatus)),
      makeRow('Formation Zone', getString(properties, 'nma_formation_zone')),
    ],
  }

  const layerSpecificRows = layerSpecificRowsByLayer[layerKey]

  if (layerSpecificRows) {
    const rowLimit = layerKey === 'ogc-minor-chemistry' ? 10 : 6
    return [...layerSpecificRows, ...commonRows]
      .filter((row) => row.value !== 'Not available')
      .slice(0, rowLimit)
  }

  const fallbackRows: PopupRow[] = [
    makeRow('Release Status', releaseStatus && titleCase(releaseStatus)),
    ...commonRows,
  ]

  return fallbackRows.filter((row) => row.value !== 'Not available').slice(0, 6)
}

const buildFeatureView = (feature: PopupFeature): PopupFeatureView => {
  const properties = feature.properties || {}
  const layerKey = normalizeLayerKey(feature)
  const rows = buildFeatureRows(properties, layerKey)
  const candidateMetrics = rows.slice(0, 3)
  const metricLabels = new Set<string>()

  for (const row of candidateMetrics) {
    if (row.label !== 'Type') {
      metricLabels.add(row.label)
    }
  }

  const detailRows = rows.filter((row) => !metricLabels.has(row.label))

  return {
    id: getFeatureId(properties),
    title: getFeatureName(properties),
    subtitle: isTypeImplicitFromLayer(layerKey, getFeatureType(properties))
      ? ''
      : titleCase(getFeatureType(properties)),
    layerLabel: getLayerLabel(layerKey),
    metrics: candidateMetrics.filter((row) => row.label !== 'Type'),
    rows: detailRows,
  }
}

const MetricCard = ({
  label,
  value,
}: {
  label: string
  value: string
}) => (
  <Box
    sx={(theme) => ({
      minWidth: 0,
      flex: 1,
      p: 0.75,
      borderRadius: 1.25,
      backgroundColor: alpha(theme.palette.primary.main, 0.07),
      border: '1px solid',
      borderColor: alpha(theme.palette.primary.main, 0.14),
    })}
  >
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        color: 'text.secondary',
        textTransform: 'uppercase',
        letterSpacing: 0.35,
        lineHeight: 1.1,
        fontSize: '0.62rem',
      }}
    >
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem', lineHeight: 1.15 }}>
      {value}
    </Typography>
  </Box>
)

export const MapPopup = ({ features }: { features: PopupFeature[] }) => {
  const featureViews = useMemo(
    () => features.map(buildFeatureView),
    [features]
  )

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        width: 336,
        maxWidth: 'calc(100vw - 48px)',
        p: 0,
        overflow: 'hidden',
        borderRadius: 2,
        background:
          theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, rgba(27,36,45,0.98) 0%, rgba(17,24,30,0.98) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
      })}
    >
      <Stack spacing={0}>
        <Box
          sx={(theme) => ({
            px: 1.5,
            py: 1,
            borderBottom: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.8),
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
          })}
        >
          <Typography
            variant="overline"
            sx={{ fontWeight: 700, letterSpacing: 0.7, lineHeight: 1.1, fontSize: '0.64rem' }}
          >
            Map Hover Details
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
            Click a point to open the full record.
          </Typography>
        </Box>

        <Stack divider={<Divider flexItem />} sx={{ maxHeight: 360, overflowY: 'auto' }}>
          {featureViews.map((feature, index) => (
            <Box key={`${feature.layerLabel}-${feature.id}-${index}`} sx={{ px: 1.5, py: 1 }}>
              <Stack spacing={0.9}>
                <Stack
                  direction="row"
                  spacing={0.75}
                  alignItems="flex-start"
                  justifyContent="space-between"
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, lineHeight: 1.15, fontSize: '0.86rem' }}
                    >
                      {feature.title}
                    </Typography>
                    {feature.subtitle ? (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ lineHeight: 1.15 }}
                      >
                        {feature.subtitle}
                      </Typography>
                    ) : null}
                  </Box>
                  <Chip
                    size="small"
                    label={feature.layerLabel}
                    sx={{
                      flexShrink: 0,
                      fontWeight: 600,
                      maxWidth: 138,
                      height: 22,
                      '& .MuiChip-label': {
                        px: 0.75,
                        fontSize: '0.66rem',
                      },
                    }}
                  />
                </Stack>

                {feature.metrics.length > 0 ? (
                  <Stack direction="row" spacing={0.75}>
                    {feature.metrics.map((metric) => (
                      <MetricCard
                        key={`${feature.id}-${metric.label}-${index}`}
                        label={metric.label}
                        value={metric.value}
                      />
                    ))}
                  </Stack>
                ) : null}

                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {feature.rows.map((row) => (
                        <TableRow
                          key={`${feature.id}-${row.label}-${index}`}
                          sx={{
                            '&:last-child td': { borderBottom: 0 },
                          }}
                        >
                          <TableCell
                            sx={{
                              width: '42%',
                              px: 0,
                              py: 0.45,
                              borderBottomStyle: 'dashed',
                              color: 'text.secondary',
                              fontWeight: 600,
                              verticalAlign: 'top',
                              fontSize: '0.72rem',
                              lineHeight: 1.15,
                            }}
                          >
                            {row.label}
                          </TableCell>
                          <TableCell
                            sx={{
                              px: 0,
                              py: 0.45,
                              borderBottomStyle: 'dashed',
                              verticalAlign: 'top',
                              fontVariantNumeric: 'tabular-nums',
                              fontSize: '0.72rem',
                              lineHeight: 1.15,
                            }}
                          >
                            {row.value}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Paper>
  )
}
