import {
  TableHead,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Typography,
  Divider,
  Stack,
} from '@mui/material'

export const MapPopup = ({ features }: { features: any[] }) => (
  <Paper
    elevation={0}
    sx={{
      width: 320,
      p: 2,
      borderRadius: 2,
      backgroundColor: 'background.paper',
    }}
  >
    <Stack spacing={1.5}>
      <Typography
        variant="h6"
        color="text.primary"
        sx={{ fontWeight: 600 }}
        gutterBottom
      >
        Click for more details
      </Typography>

      <Divider />

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="left">
                <Typography variant="subtitle2" fontWeight="bold">
                  ID
                </Typography>
              </TableCell>
              <TableCell align="left">
                <Typography variant="subtitle2" fontWeight="bold">
                  Name
                </Typography>
              </TableCell>
              <TableCell align="left">
                <Typography variant="subtitle2" fontWeight="bold">
                  Type
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {features.map((feature, index: number) => (
              <TableRow
                key={index}
                hover
                sx={{
                  '&:hover': { backgroundColor: 'action.hover' },
                  transition: 'background-color 0.2s ease',
                }}
              >
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {feature.properties.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.primary">
                    {feature.properties.name || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {feature.properties.thing_type || '—'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  </Paper>
)
