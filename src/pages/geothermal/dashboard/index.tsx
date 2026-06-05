import { useRef } from 'react'
import { Box, Button, Card, CardContent, CardHeader, Chip, Divider, Paper, Stack, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { DeviceThermostat, Directions, Map, Place } from '@mui/icons-material'
import { Layer, type MapRef, Source } from 'react-map-gl'
import { GeothermalDataCard, GeothermalInformationAccordion, MapComponent, CardHeaderTitle } from '@/components'

const MOCK_WELL = {
  name: 'GT-0042',
  county: 'Sandoval County',
  state: 'NM',
  basin: 'Jemez Mountains',
  database: 'NM_Wells',
  holeDepth: '2,200',
  holeDepthUnit: 'ft',
  wellDepth: '2,000',
  wellDepthUnit: 'ft',
  lat: 36.2062,
  lon: -106.3197,
  elevation: '6,812',
  elevationUnit: 'ft',
  verticalDatum: 'NAVD88',
}

export const GeothermalDashboard = () => {
  return (
    <Box sx={{ p: '5px' }}>
      {/* Mock page title row */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Typography variant="h5" fontWeight="bold">
          {MOCK_WELL.name}
        </Typography>
        <Chip
          icon={<DeviceThermostat fontSize="small" />}
          label="Geothermal"
          color="error"
          size="small"
          variant="outlined"
        />
        <Chip label="Public" color="success" size="small" variant="outlined" />
        <Chip label={MOCK_WELL.basin} size="small" variant="outlined" />
        <Chip label={MOCK_WELL.database} size="small" variant="outlined" />
      </Box>

      {/* Full-width KPI strip */}
      <Box sx={{ mb: 2 }}>
        <WellKpiStrip />
      </Box>

      <Grid container spacing={2}>
        {/* Left column */}
        <Grid size={{ xs: 12, md: 8, lg: 9 }}>
          <Stack spacing={2}>
            <GeothermalDataCard />
            <GeothermalMapCard />
          </Stack>
        </Grid>

        {/* Right column */}
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <Stack spacing={2}>
            <MockLocationCard />
            <GeothermalInformationAccordion />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}

const GEOTHERMAL_HIGHLIGHT: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [MOCK_WELL.lon, MOCK_WELL.lat] },
      properties: { name: MOCK_WELL.name },
    },
  ],
}

const GeothermalMapCard = () => {
  const mapRef = useRef<MapRef>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${MOCK_WELL.lat},${MOCK_WELL.lon}`

  return (
    <Card elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <CardHeader
        title={
          <CardHeaderTitle icon={<Map color="primary" />} title="Interactive Satellite Map" />
        }
        action={
          <Button
            component="a"
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<Directions />}
          >
            Open in Google Maps
          </Button>
        }
      />
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <Box
          ref={containerRef}
          sx={{
            position: 'relative',
            overflow: 'hidden',
            height: 450,
            width: '100%',
          }}
        >
          <MapComponent
            mapRef={mapRef}
            containerRef={containerRef}
            initialViewState={{
              longitude: MOCK_WELL.lon,
              latitude: MOCK_WELL.lat,
              zoom: 13,
            }}
            style={{ width: '100%', height: '100%' }}
          >
            <Source id="highlight-well" type="geojson" data={GEOTHERMAL_HIGHLIGHT}>
              <Layer
                id="highlight-layer"
                type="circle"
                paint={{
                  'circle-radius': 8,
                  'circle-color': '#D32F2F',
                  'circle-stroke-color': '#ffffff',
                  'circle-stroke-width': 2,
                }}
              />
            </Source>
          </MapComponent>
        </Box>
      </CardContent>
    </Card>
  )
}

const KPI_METRICS = [
  { label: 'Hole Depth', value: '2,200', unit: 'ft' },
  { label: 'Well Depth', value: '2,000', unit: 'ft' },
  { label: 'Bottom-hole Temp', value: '145.2', unit: '°F' },
  { label: 'Geothermal Gradient', value: '35.4', unit: '°C/km' },
  { label: 'Heat Flow', value: '85.3', unit: 'mW/m²' },
  { label: 'Elevation', value: '6,812', unit: 'ft NAVD88' },
]

const WellKpiStrip = () => (
  <Card elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        overflowX: 'auto',
      }}
    >
      {/* Left anchor cell */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minWidth: 140,
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 0.25 }}>
          Well
        </Typography>
        <Typography variant="body1" fontWeight="bold" noWrap>
          {MOCK_WELL.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {MOCK_WELL.basin}
        </Typography>
      </Box>

      {/* Metric cells */}
      {KPI_METRICS.map((metric, i) => (
        <Box key={metric.label} sx={{ display: 'flex', alignItems: 'stretch' }}>
          {i > 0 && (
            <Divider orientation="vertical" flexItem sx={{ my: 1.5 }} />
          )}
          <Box
            sx={{
              px: 2.5,
              py: 2,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minWidth: 130,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              sx={{ mb: 0.5, whiteSpace: 'nowrap' }}
            >
              {metric.label}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography variant="h6" fontWeight="bold" lineHeight={1}>
                {metric.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {metric.unit}
              </Typography>
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  </Card>
)

const MockLocationCard = () => (
  <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
    <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
      <Place fontSize="small" color="action" />
      <Typography variant="body1" fontWeight="bold">
        Location
      </Typography>
    </Box>
    <Box sx={{ p: 2 }}>
      <Stack spacing={1.25}>
        <FieldRow label="Basin" value={MOCK_WELL.basin} />
        <FieldRow label="County" value={MOCK_WELL.county} />
        <FieldRow label="State" value={MOCK_WELL.state} />
        <FieldRow
          label="Coordinates"
          value={`${MOCK_WELL.lat.toFixed(4)}, ${MOCK_WELL.lon.toFixed(4)}`}
        />
        <FieldRow
          label="Elevation"
          value={`${MOCK_WELL.elevation} ${MOCK_WELL.elevationUnit} ${MOCK_WELL.verticalDatum}`}
        />
      </Stack>
    </Box>
  </Paper>
)


const FieldRow = ({ label, value }: { label: string; value: string }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: '100px 1fr' },
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
