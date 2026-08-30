import { Add } from '@mui/icons-material'
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useAccessDestinations, useCreateDestination } from '@/hooks'
import { AccessConsole } from '@/pages/access/AccessConsole'
import {
  type CreateDestinationInput,
  DESTINATION_KINDS,
  type Destination,
  type DestinationFormErrors,
  sortDestinations,
  toCreateDestinationInput,
  validateDestinationForm,
} from '@/utils/accessDestinations'

export const AccessDestinationsPage = () => (
  <AccessConsole activePath="/access/destinations">
    <DestinationsTab />
  </AccessConsole>
)

const DestinationsTab = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const destinations = useAccessDestinations()
  const createDestination = useCreateDestination()

  const rows = destinations.data ? sortDestinations(destinations.data) : []

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Chip
          size="small"
          variant="outlined"
          label={
            destinations.data
              ? `${destinations.data.length} registered`
              : 'Loading'
          }
        />
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setIsDialogOpen(true)}
        >
          Register destination
        </Button>
      </Stack>

      {destinations.isLoading ? (
        <Stack alignItems="center" spacing={1.5} sx={{ py: 6 }}>
          <CircularProgress size={28} />
          <Typography variant="body2" color="text.secondary">
            Loading destinations...
          </Typography>
        </Stack>
      ) : destinations.isError ? (
        <Alert severity="error">
          Failed to load destinations.
          {destinations.error instanceof Error
            ? ` ${destinations.error.message}`
            : null}
        </Alert>
      ) : rows.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ p: 4, borderRadius: 2, borderStyle: 'dashed' }}
        >
          <Stack spacing={0.75} alignItems="center" textAlign="center">
            <Typography variant="subtitle1">
              No destinations registered
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Register one before recording consent — consent names the
              destination it publishes to.
            </Typography>
          </Stack>
        </Paper>
      ) : (
        <DestinationsTable rows={rows} />
      )}

      {isDialogOpen ? (
        <DestinationDialog
          onClose={() => setIsDialogOpen(false)}
          onSubmit={(input) =>
            createDestination.mutate(input, {
              onSuccess: () => setIsDialogOpen(false),
            })
          }
          isSubmitting={createDestination.isPending}
          submitError={
            createDestination.isError
              ? createDestination.error instanceof Error
                ? createDestination.error.message
                : 'The destination was rejected.'
              : undefined
          }
        />
      ) : null}
    </Stack>
  )
}

const DestinationsTable = ({ rows }: { rows: Destination[] }) => (
  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
    <Table size="small" aria-label="Destinations">
      <TableHead>
        <TableRow>
          <TableCell>Destination</TableCell>
          <TableCell>Kind</TableCell>
          <TableCell>Description</TableCell>
          <TableCell>Status</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((destination) => (
          <Row key={destination.id} destination={destination} />
        ))}
      </TableBody>
    </Table>
  </TableContainer>
)

const Row = ({ destination }: { destination: Destination }) => (
  <TableRow hover>
    <TableCell sx={{ minWidth: 180 }}>
      <Stack spacing={0.25}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {destination.name}
        </Typography>
        <Typography
          component="code"
          variant="caption"
          color="text.secondary"
          sx={{ overflowWrap: 'anywhere' }}
        >
          {destination.slug}
        </Typography>
      </Stack>
    </TableCell>
    <TableCell>{destination.destination_kind}</TableCell>
    <TableCell sx={{ maxWidth: 320 }}>
      {destination.description ? (
        <Typography variant="body2" color="text.secondary">
          {destination.description}
        </Typography>
      ) : (
        <Typography variant="caption" color="text.disabled">
          —
        </Typography>
      )}
    </TableCell>
    <TableCell>
      <Chip
        size="small"
        label={destination.active ? 'Active' : 'Retired'}
        color={destination.active ? 'success' : 'default'}
        variant={destination.active ? 'filled' : 'outlined'}
      />
    </TableCell>
  </TableRow>
)

const DestinationDialog = ({
  onClose,
  onSubmit,
  isSubmitting,
  submitError,
}: {
  onClose: () => void
  onSubmit: (input: CreateDestinationInput) => void
  isSubmitting: boolean
  submitError?: string
}) => {
  const [form, setForm] = useState({
    slug: '',
    name: '',
    destination_kind: 'public web',
    description: '',
  })
  const [errors, setErrors] = useState<DestinationFormErrors>({})

  const set = (field: keyof typeof form) => (value: string) =>
    setForm((previous) => ({ ...previous, [field]: value }))

  const handleSubmit = () => {
    const found = validateDestinationForm(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    onSubmit(toCreateDestinationInput(form))
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Register a destination</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {submitError ? <Alert severity="error">{submitError}</Alert> : null}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              size="small"
              label="Slug"
              placeholder="ngwmn"
              helperText={errors.slug ?? 'Used in the destination URL path.'}
              error={Boolean(errors.slug)}
              value={form.slug}
              onChange={(event) => set('slug')(event.target.value)}
            />
            <TextField
              select
              fullWidth
              size="small"
              label="Kind"
              value={form.destination_kind}
              onChange={(event) => set('destination_kind')(event.target.value)}
            >
              {DESTINATION_KINDS.map((kind) => (
                <MenuItem key={kind} value={kind}>
                  {kind}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <TextField
            fullWidth
            size="small"
            label="Name"
            placeholder="National Ground-Water Monitoring Network"
            helperText={errors.name}
            error={Boolean(errors.name)}
            value={form.name}
            onChange={(event) => set('name')(event.target.value)}
          />
          <TextField
            fullWidth
            multiline
            minRows={2}
            size="small"
            label="Description"
            value={form.description}
            onChange={(event) => set('description')(event.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Registering...' : 'Register'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
