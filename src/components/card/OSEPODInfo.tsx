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
import { useOSEPODInfo } from '@/hooks/useOSEPODInfo'
import { Engineering } from '@mui/icons-material'

export const OSEPODInfoCard = ({ pod_id }) => {
  const podInfoQuery = useOSEPODInfo(pod_id)
  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Engineering color="primary" />
            <Typography variant="h5">OSEPOD Information</Typography>
          </Stack>
        }
      />
      <CardContent>
        {podInfoQuery.data?.length === 0 && (
          <Typography
            variant="body1"
            textAlign="center"
            color="text.secondary"
            padding={1}
          >
            No OSE POD data available for this well.
          </Typography>
        )}
        {podInfoQuery.isError && (
          <Typography
            variant="body1"
            textAlign="center"
            color="text.secondary"
            padding={1}
          >
            Error fetching OSE POD info.
          </Typography>
        )}
        {podInfoQuery.data?.length > 0 && (
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
                {podInfoQuery.data?.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell sx={{ py: 0.5 }}>{row.name}</TableCell>
                    <TableCell sx={{ py: 0.5 }}>
                      {row.name === 'nmwrrs_wrsum_url' ? (
                        <a
                          href={row.value}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          link
                        </a>
                      ) : (
                        row.value
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  )
}
