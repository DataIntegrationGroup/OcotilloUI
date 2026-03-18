import {
  Card,
  CardContent,
  CardHeader,
  Stack,
  Typography,
  Box,
  Skeleton,
} from '@mui/material'
import { Hydrograph } from '@/components/Hydrographs/Hydrograph'
import { StackedLineChart } from '@mui/icons-material'
import { IHydrographDatasource } from '@/interfaces/st2/IHydrographDatasource'
import { IWell } from '@/interfaces/ocotillo'

export const HydrographCard = ({
  well,
  rows,
  isLoading = false,
  dataSource,
}: {
  well: IWell
  rows: readonly any[]
  isLoading: boolean
  dataSource: IHydrographDatasource[]
}) => {
  if (!well || isLoading) {
    return <LoadingCard />
  }

  return (
    <Card elevation={2} sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <StackedLineChart color="primary" />
            <Typography variant="body1" fontWeight="bold">Hydrograph</Typography>
          </Stack>
        }
      />
      <CardContent>
        {rows.length === 0 ? (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{ minHeight: 200 }}
          >
            <Box textAlign="center">
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No Hydrograph Data
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Water level observations are needed to generate a hydrograph
              </Typography>
            </Box>
          </Box>
        ) : (
          <Hydrograph
            datasource={dataSource}
            options={{ showToolbox: true, invertYAxis: true }}
          />
        )}
      </CardContent>
    </Card>
  )
}

const LoadingCard = () => {
  return (
    <Card elevation={2} sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <StackedLineChart color="primary" />
            <Typography variant="body1" fontWeight="bold">Hydrograph</Typography>
          </Stack>
        }
      />
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height={200}
          sx={{ borderRadius: '0.5rem' }}
        />
      </CardContent>
    </Card>
  )
}
