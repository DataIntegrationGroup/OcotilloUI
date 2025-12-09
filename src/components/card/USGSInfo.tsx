import {
  Card,
  CardContent,
  CardHeader,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useUSGSSiteInfo } from '@/hooks/useUSGSSiteInfo'
import { Public } from '@mui/icons-material'

export const USGSInfoCard = ({ site_id }) => {
  const query = useUSGSSiteInfo(site_id)

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Public color="primary" />
            <Typography variant="h5">USGS Information</Typography>
          </Stack>
        }
      />
      <CardContent>
        {query.data?.length == 0 && (
          <Typography
            variant="body1"
            textAlign="center"
            color="text.secondary"
            padding={1}
          >
            No USGS data available for this well.
          </Typography>
        )}
        {query.isError && (
          <Typography
            variant="body1"
            textAlign="center"
            color="warning.main"
            padding={1}
          >
            Error fetching USGS info.
          </Typography>
        )}
        {query.data?.length > 0 && (
          <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Name
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Value
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {query.data.map((row) => {
                  return (
                    <TableRow key={row.id}>
                      <TableCell
                        sx={{ paddingTop: '2px', paddingBottom: '2px' }}
                      >
                        {row.name}
                      </TableCell>
                      <TableCell
                        sx={{ paddingTop: '2px', paddingBottom: '2px' }}
                      >
                        {row.value}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  )
}
