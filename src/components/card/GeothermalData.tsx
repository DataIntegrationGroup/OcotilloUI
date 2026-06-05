import { useMemo } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { DeviceThermostat, OpenInNew } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import ReactECharts from 'echarts-for-react'
import { CardHeaderTitle } from '@/components'

/**
 * Mock geothermal data -- replace with API data when geothermal
 * endpoints are available in OcotilloAPI.
 *
 * Key fields drawn from NM_Wells: tbl_gt_bht_data (bottom-hole temp),
 * tbl_gt_temp_depths (temperature profile), tbl_gt_sum_heat_flow (heat flow),
 * and tbl_well_sources (data provenance).
 */
const MOCK_GEOTHERMAL = {
  bottomHoleTemp: {
    valueFahrenheit: 145.2,
    valueCelsius: 62.9,
    depthFt: 2000,
  },
  geothermalGradient: {
    value: 35.4,
    unit: '°C/km',
  },
  heatFlow: {
    value: 85.3,
    unit: 'mW/m²',
  },
  thermalConductivity: {
    value: 2.4,
    unit: 'W/m·K',
  },
  surfaceTemp: {
    valueFahrenheit: 58.0,
    valueCelsius: 14.4,
  },
  temperatureProfile: [
    { depthFt: 0, tempF: 58.0 },
    { depthFt: 500, tempF: 72.1 },
    { depthFt: 1000, tempF: 98.6 },
    { depthFt: 1500, tempF: 121.8 },
    { depthFt: 2000, tempF: 145.2 },
  ],
  source: {
    name: 'USGS Geothermal Data Repository',
    method: 'Temperature Log (Equilibrium)',
    date: 'June 15, 1987',
    recordedBy: 'Bureau of Geology Field Team',
    documentUrl: 'https://example.com/mock-source-document.pdf',
  },
  notes:
    'Original data from 1987 field survey. Values confirmed against operator logs in 2003. Temperatures recorded at equilibrium after a 72-hour shut-in period.',
}

const HeaderTitle = () => (
  <CardHeaderTitle
    icon={<DeviceThermostat color="error" />}
    title="Geothermal Data"
  />
)

export const GeothermalDataCard = () => {
  const theme = useTheme()

  const tempProfileOption = useMemo(
    () => ({
      animation: false,
      grid: { top: 12, right: 16, bottom: 32, left: 52 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: theme.palette.background.paper,
        borderColor: theme.palette.divider,
        textStyle: { color: theme.palette.text.primary, fontSize: 12 },
        formatter: (params: any[]) => {
          const p = params[0]
          return `<b>${p.value[1].toLocaleString()} ft</b><br/>${p.value[0]} °F`
        },
      },
      xAxis: {
        type: 'value',
        name: 'Temperature (°F)',
        nameLocation: 'middle',
        nameGap: 22,
        nameTextStyle: {
          color: theme.palette.text.secondary,
          fontSize: 10,
        },
        min: 50,
        max: 160,
        axisLabel: {
          color: theme.palette.text.secondary,
          fontSize: 10,
        },
        splitLine: {
          lineStyle: { color: theme.palette.divider },
        },
      },
      yAxis: {
        type: 'value',
        inverse: true,
        name: 'Depth (ft)',
        nameLocation: 'middle',
        nameGap: 40,
        nameTextStyle: {
          color: theme.palette.text.secondary,
          fontSize: 10,
        },
        axisLabel: {
          color: theme.palette.text.secondary,
          fontSize: 10,
          formatter: (v: number) => v.toLocaleString(),
        },
        splitLine: {
          lineStyle: { color: theme.palette.divider },
        },
      },
      series: [
        {
          type: 'line',
          name: 'Temperature',
          symbol: 'circle',
          symbolSize: 6,
          data: MOCK_GEOTHERMAL.temperatureProfile.map((r) => [
            r.tempF,
            r.depthFt,
          ]),
          lineStyle: { color: '#D32F2F', width: 2 },
          itemStyle: { color: '#D32F2F' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: 'rgba(211, 47, 47, 0.15)' },
                { offset: 1, color: 'rgba(211, 47, 47, 0.02)' },
              ],
            },
          },
        },
      ],
    }),
    [theme]
  )

  return (
    <Card elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <CardHeader title={<HeaderTitle />} />
      <CardContent>
        {/* Top row: two equal columns */}
        <Grid container columnSpacing={3} rowSpacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Section title="Thermal Measurements">
              <InfoRow
                label="Bottom-hole Temp"
                value={`${MOCK_GEOTHERMAL.bottomHoleTemp.valueFahrenheit} °F (${MOCK_GEOTHERMAL.bottomHoleTemp.valueCelsius} °C)`}
              />
              <InfoRow
                label="at Depth"
                value={`${MOCK_GEOTHERMAL.bottomHoleTemp.depthFt.toLocaleString()} ft`}
              />
              <InfoRow
                label="Geothermal Gradient"
                value={`${MOCK_GEOTHERMAL.geothermalGradient.value} ${MOCK_GEOTHERMAL.geothermalGradient.unit}`}
              />
              <InfoRow
                label="Heat Flow"
                value={`${MOCK_GEOTHERMAL.heatFlow.value} ${MOCK_GEOTHERMAL.heatFlow.unit}`}
              />
              <InfoRow
                label="Thermal Conductivity"
                value={`${MOCK_GEOTHERMAL.thermalConductivity.value} ${MOCK_GEOTHERMAL.thermalConductivity.unit}`}
              />
              <InfoRow
                label="Surface Temperature"
                value={`${MOCK_GEOTHERMAL.surfaceTemp.valueFahrenheit} °F (${MOCK_GEOTHERMAL.surfaceTemp.valueCelsius} °C)`}
              />
            </Section>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Section title="Temperature at Depth">
              <Box sx={{ height: 240, mt: 0.5 }}>
                <ReactECharts
                  option={tempProfileOption}
                  style={{ width: '100%', height: '100%' }}
                />
              </Box>
            </Section>
          </Grid>
        </Grid>

        {/* Full-width Data Source row */}
        <Divider sx={{ my: 2 }} />
        <Section title="Data Source">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
              alignItems: 'start',
            }}
          >
            <SourceField label="Source" value={MOCK_GEOTHERMAL.source.name} />
            <SourceField label="Method" value={MOCK_GEOTHERMAL.source.method} />
            <SourceField label="Measurement Date" value={MOCK_GEOTHERMAL.source.date} />
            <SourceField label="Recorded By" value={MOCK_GEOTHERMAL.source.recordedBy} />
          </Box>
          <Box sx={{ mt: 1.5 }}>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              endIcon={<OpenInNew fontSize="inherit" />}
              component="a"
              href={MOCK_GEOTHERMAL.source.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ fontSize: '0.75rem' }}
            >
              View Source Document
            </Button>
          </Box>
          {MOCK_GEOTHERMAL.notes && (
            <Box sx={{ mt: 1.5 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
                display="block"
                sx={{ mb: 0.5 }}
              >
                Notes
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: 'italic' }}
              >
                {MOCK_GEOTHERMAL.notes}
              </Typography>
            </Box>
          )}
        </Section>
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
  <Box sx={{ py: 0.25 }}>
    <Box sx={{ mb: 1 }}>
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
    </Box>
    <Stack spacing={0.75}>{children}</Stack>
  </Box>
)

const SourceField = ({ label, value }: { label: string; value: string }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ mb: 0.25 }}>
      {label}
    </Typography>
    <Typography variant="body2">{value}</Typography>
  </Box>
)

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: '140px 1fr' },
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
