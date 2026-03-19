import { useMemo } from 'react'
import { Box, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { Link } from '@refinedev/core'
import { useOne } from '@refinedev/core'
import { useDataGrid } from '@refinedev/mui'
import type { IThing, IWell, IObservation, ISample } from '@/interfaces/ocotillo'
import { formatAppDateTime } from '@/utils'

type AssociatedSiteSummaryCardProps = {
  thing: IThing
}

const getShowPath = (thing: IThing) => {
  const type = (thing.thing_type || '').toLowerCase()
  if (type === 'water well' || type === 'geothermal well') {
    return `/ocotillo/well/show/${thing.id}`
  }
  if (type === 'spring') {
    return `/ocotillo/spring/show/${thing.id}`
  }
  return `/ocotillo/well/show/${thing.id}`
}

export const AssociatedSiteSummaryCard = ({ thing }: AssociatedSiteSummaryCardProps) => {
  const { result: well, query: wellQuery } = useOne<IWell>({
    resource: 'ocotillo.thing-well',
    id: thing.id,
    dataProviderName: 'ocotillo',
    queryOptions: {
      enabled: !!thing.id,
    },
  })

  const {
    dataGridProps: { rows: observations },
  } = useDataGrid({
    resource: 'observation/groundwater-level',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_id: thing.id,
      },
    },
    pagination: {
      pageSize: 5,
      mode: 'server',
    },
    sorters: {
      initial: [{ field: 'observation_datetime', order: 'desc' }],
    },
    queryOptions: {
      enabled: !!thing.id,
      gcTime: 10 * 60 * 1000,
      staleTime: 5 * 60 * 1000,
    },
  })

  const sampleId = useMemo(() => {
    const sorted = (observations ?? [])
      .filter((o: IObservation) => o.observation_datetime)
      .sort(
        (a: IObservation, b: IObservation) =>
          new Date(b.observation_datetime!).getTime() -
          new Date(a.observation_datetime!).getTime()
      )
    return sorted[0]?.sample_id ?? null
  }, [observations])

  const { result: sample } = useOne<ISample>({
    resource: 'ocotillo.sample',
    id: sampleId,
    dataProviderName: 'ocotillo',
    queryOptions: {
      enabled: !!sampleId,
    },
  })

  const latestObs = useMemo(() => {
    const sorted = (observations ?? [])
      .filter((o: IObservation) => o.observation_datetime)
      .sort(
        (a: IObservation, b: IObservation) =>
          new Date(b.observation_datetime!).getTime() -
          new Date(a.observation_datetime!).getTime()
      )
    return sorted[0] as IObservation | undefined
  }, [observations])

  const lastCheckedBy =
    sample?.contact?.name && sample?.contact?.organization
      ? `${sample.contact.name} (${sample.contact.organization})`
      : sample?.contact?.name ?? sample?.sampler_name ?? null

  const lastCheckedDate =
    sample?.field_event?.event_date ??
    sample?.sample_date ??
    latestObs?.observation_datetime ??
    null

  const depthToWater = latestObs?.depth_to_water_bgs ?? null

  const isLoading = wellQuery?.isLoading === true

  if (isLoading) {
    return <LoadingCard siteName={thing.name} />
  }

  const coords = (well ?? thing)?.current_location?.geometry?.coordinates as
    | [number, number, number?]
    | undefined
  const [lon, lat] = coords ?? []
  const locProps = (well ?? thing)?.current_location?.properties
  const elevation = locProps?.elevation
  const elevationUnit = locProps?.elevation_unit ?? 'ft'

  return (
    <Paper
      elevation={2}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Link
          to={getShowPath(thing)}
          style={{
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{
              color: 'primary.main',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {thing.name || `Site ${thing.id}`}
          </Typography>
        </Link>
      </Box>
      <Box sx={{ px: 2, py: 1.5, pb: 2 }}>
        <Stack spacing={1}>
          <DetailRow
            label="Last checked"
            value={
              lastCheckedDate ? formatAppDateTime(lastCheckedDate as string) : 'No data'
            }
          />
          <DetailRow
            label="Checked by"
            value={lastCheckedBy ?? 'Unknown'}
          />
          <DetailRow
            label="Depth to water"
            value={
              depthToWater != null
                ? `${depthToWater} ft bgs`
                : 'No measurements'
            }
          />
          <DetailRow
            label="Well depth"
            value={
              well?.well_depth != null
                ? `${well.well_depth} ${well.well_depth_unit ?? 'ft'}`
                : 'N/A'
            }
          />
          <DetailRow
            label="Hole depth"
            value={
              well?.hole_depth != null
                ? `${well.hole_depth} ${well.hole_depth_unit ?? 'ft'}`
                : 'N/A'
            }
          />
          <DetailRow
            label="Elevation"
            value={
              elevation != null
                ? `${elevation.toFixed(1)} ${elevationUnit}`
                : 'N/A'
            }
          />
          {lat != null && lon != null && (
            <DetailRow
              label="Coordinates"
              value={`${lat.toFixed(5)}, ${lon.toFixed(5)}`}
            />
          )}
        </Stack>
      </Box>
    </Paper>
  )
}

const DetailRow = ({
  label,
  value,
}: {
  label: string
  value: string
}) => (
  <Typography variant="body2">
    <Box component="span" sx={{ fontWeight: 600, color: 'text.secondary', mr: 0.5 }}>
      {label}:
    </Box>
    {value}
  </Typography>
)

const LoadingCard = ({ siteName }: { siteName?: string }) => (
  <Paper
    elevation={2}
    sx={{
      borderRadius: 2,
      overflow: 'hidden',
      border: '1px solid',
      borderColor: 'divider',
    }}
  >
    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Skeleton variant="text" width={120} height={24} />
    </Box>
    <Box sx={{ px: 2, py: 1.5, pb: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} variant="text" width="80%" height={20} sx={{ mb: 0.5 }} />
      ))}
    </Box>
  </Paper>
)
