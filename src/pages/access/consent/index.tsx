import { Add } from '@mui/icons-material'
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
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
import { ConfirmDialog } from '@/components/ConfirmDialog'
import {
  useAccessConsent,
  useAccessDestinations,
  useCreateConsent,
  useRevokeConsent,
  useThingSearch,
} from '@/hooks'
import { AccessConsole } from '@/pages/access/AccessConsole'
import {
  type ConsentFormErrors,
  type CreateConsentInput,
  describeConsentingContact,
  type PublicationConsent,
  sortConsent,
  toCreateConsentInput,
  validateConsentForm,
} from '@/utils/accessConsent'
import {
  type Destination,
  destinationLabel,
  indexDestinationsById,
  sortDestinations,
} from '@/utils/accessDestinations'
import { ACCESS_DATA_TYPES } from '@/utils/accessGrants'
import {
  ACCESS_STATUS_COLORS,
  ACCESS_STATUS_LABELS,
  accessStatusOf,
  isRevocable,
  toDateInputValue,
} from '@/utils/accessLifecycle'

/**
 * Picks a thing by its PointID and hands back the id the API wants.
 *
 * `freeSolo`, because an id pasted from a ticket still has to work — anything
 * typed that is not chosen from the list is treated as an id, which is what
 * the field held before it could search by name.
 */
const ThingPicker = ({
  label,
  helperText,
  error,
  inputValue,
  onInputChange,
  onSelect,
  onEnter,
}: {
  label: string
  helperText?: string
  error?: boolean
  inputValue: string
  onInputChange: (value: string) => void
  onSelect: (thingId: string, name: string) => void
  onEnter?: () => void
}) => {
  const autocompleteProps = useThingSearch()

  return (
    <Autocomplete
      {...autocompleteProps}
      freeSolo
      fullWidth
      size="small"
      inputValue={inputValue}
      onInputChange={(event, next, reason) => {
        autocompleteProps.onInputChange?.(event, next, reason)
        onInputChange(next)
      }}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.name
      }
      isOptionEqualToValue={(option, value) => option.id === value.id}
      onChange={(_event, option) => {
        if (option && typeof option !== 'string') {
          onSelect(String(option.id), option.name)
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          label={label}
          helperText={helperText}
          error={error}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onEnter?.()
          }}
        />
      )}
    />
  )
}

export const AccessConsentPage = () => (
  <AccessConsole activePath="/access/consent">
    <ConsentTab />
  </AccessConsole>
)

const ConsentTab = () => {
  // Unlike grants, `GET /access/consent` still requires a thing_id — there is
  // no consent-wide audit view — so this tab stays thing-scoped and says so
  // rather than looking broken before one is entered.
  const [thingInput, setThingInput] = useState('')
  const [thingId, setThingId] = useState('')
  const [includeRevoked, setIncludeRevoked] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [pendingRevoke, setPendingRevoke] = useState<PublicationConsent | null>(
    null
  )
  const [today] = useState(() => new Date())

  const destinations = useAccessDestinations()
  const consent = useAccessConsent(thingId, { includeRevoked })
  const createConsent = useCreateConsent()
  const revokeConsent = useRevokeConsent()

  const destinationsById = indexDestinationsById(destinations.data)
  const rows = consent.data ? sortConsent(consent.data, today) : []

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ sm: 'center' }}
        >
          <ThingPicker
            label="Thing (PointID)"
            helperText="Search by PointID, or paste an id and press Enter."
            inputValue={thingInput}
            onInputChange={setThingInput}
            onSelect={(selectedId) => setThingId(selectedId)}
            onEnter={() => setThingId(thingInput.trim())}
          />
          <FormControlLabel
            sx={{ flexShrink: 0, mr: 0 }}
            control={
              <Switch
                size="small"
                checked={includeRevoked}
                onChange={(event) => setIncludeRevoked(event.target.checked)}
              />
            }
            label="Include withdrawn"
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsDialogOpen(true)}
            disabled={destinations.data?.length === 0}
            sx={{ flexShrink: 0 }}
          >
            Record consent
          </Button>
        </Stack>
      </Paper>

      {destinations.data?.length === 0 ? (
        <Alert severity="info">
          No destination is registered yet. Consent names the destination it
          publishes to, so register one first.
        </Alert>
      ) : null}

      {revokeConsent.isError ? (
        <Alert severity="error">
          Failed to withdraw that consent.
          {revokeConsent.error instanceof Error
            ? ` ${revokeConsent.error.message}`
            : null}
        </Alert>
      ) : null}

      {!thingId ? (
        <EmptyState
          title="Enter a thing id to begin"
          body="The API records consent one thing at a time, so this tab needs a well or site id before it can show anything."
        />
      ) : consent.isLoading ? (
        <Stack alignItems="center" spacing={1.5} sx={{ py: 6 }}>
          <CircularProgress size={28} />
          <Typography variant="body2" color="text.secondary">
            Loading consent...
          </Typography>
        </Stack>
      ) : consent.isError ? (
        <Alert severity="error">
          Failed to load consent for thing {thingId}.
          {consent.error instanceof Error ? ` ${consent.error.message}` : null}
        </Alert>
      ) : rows.length === 0 ? (
        <EmptyState
          title={`Nothing published for thing ${thingId}`}
          body={
            includeRevoked
              ? 'No consent has ever been recorded for this thing.'
              : 'No consent is live for this thing. Turn on "Include withdrawn" to see past ones.'
          }
        />
      ) : (
        <ConsentTable
          rows={rows}
          today={today}
          destinationsById={destinationsById}
          onRevoke={setPendingRevoke}
          revokingId={
            revokeConsent.isPending ? (revokeConsent.variables ?? null) : null
          }
        />
      )}

      <ConfirmDialog
        open={pendingRevoke !== null}
        onClose={() => setPendingRevoke(null)}
        title="Withdraw this consent?"
        text={
          pendingRevoke
            ? `${
                destinationsById.get(pendingRevoke.destination_id)?.name ??
                `Destination ${pendingRevoke.destination_id}`
              } will stop being offered "${pendingRevoke.data_type}" for thing ${pendingRevoke.thing_id}. Copies already harvested are not recalled.`
            : ''
        }
        PrimaryActionBtnMsg="Withdraw"
        onPrimaryAction={() => {
          if (pendingRevoke) revokeConsent.mutate(pendingRevoke.id)
          setPendingRevoke(null)
        }}
      />

      {isDialogOpen ? (
        <ConsentDialog
          destinations={sortDestinations(destinations.data ?? [])}
          defaultThingId={thingId || thingInput.trim()}
          today={today}
          onClose={() => setIsDialogOpen(false)}
          onSubmit={(input) =>
            createConsent.mutate(input, {
              onSuccess: (created) => {
                setIsDialogOpen(false)
                // Record consent for a thing you were not looking at and the
                // tab follows, so the new row is visible.
                setThingInput(String(created.thing_id))
                setThingId(String(created.thing_id))
              },
            })
          }
          isSubmitting={createConsent.isPending}
          submitError={
            createConsent.isError
              ? createConsent.error instanceof Error
                ? createConsent.error.message
                : 'The consent was rejected.'
              : undefined
          }
        />
      ) : null}
    </Stack>
  )
}

const EmptyState = ({ title, body }: { title: string; body: string }) => (
  <Paper
    variant="outlined"
    sx={{ p: 4, borderRadius: 2, borderStyle: 'dashed' }}
  >
    <Stack spacing={0.75} alignItems="center" textAlign="center">
      <Typography variant="subtitle1">{title}</Typography>
      <Typography variant="body2" color="text.secondary">
        {body}
      </Typography>
    </Stack>
  </Paper>
)

const ConsentTable = ({
  rows,
  today,
  destinationsById,
  onRevoke,
  revokingId,
}: {
  rows: PublicationConsent[]
  today: Date
  destinationsById: Map<number, Destination>
  onRevoke: (consent: PublicationConsent) => void
  revokingId: number | null
}) => (
  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
    <Table size="small" aria-label="Publication consent">
      <TableHead>
        <TableRow>
          <TableCell>Destination</TableCell>
          <TableCell>Data type</TableCell>
          <TableCell>Dates</TableCell>
          <TableCell>Consented by</TableCell>
          <TableCell>Recorded by</TableCell>
          <TableCell>Status</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((consent) => {
          const status = accessStatusOf(consent, today)
          const destination = destinationsById.get(consent.destination_id)

          return (
            <TableRow key={consent.id} hover>
              <TableCell sx={{ minWidth: 150 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {destination?.name ?? `Destination ${consent.destination_id}`}
                </Typography>
              </TableCell>
              <TableCell>{consent.data_type}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                <Typography variant="body2">
                  {consent.starts_at} → {consent.ends_at ?? 'no end'}
                </Typography>
              </TableCell>
              <TableCell>
                <Stack spacing={0.25}>
                  <Typography variant="body2">
                    {describeConsentingContact(consent)}
                  </Typography>
                  {consent.notes ? (
                    <Typography variant="caption" color="text.secondary">
                      {consent.notes}
                    </Typography>
                  ) : null}
                </Stack>
              </TableCell>
              <TableCell>{consent.recorded_by}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={ACCESS_STATUS_LABELS[status]}
                  color={ACCESS_STATUS_COLORS[status]}
                  variant={status === 'active' ? 'filled' : 'outlined'}
                />
              </TableCell>
              <TableCell align="right">
                {isRevocable(consent, today) ? (
                  <Button
                    size="small"
                    color="error"
                    disabled={revokingId === consent.id}
                    onClick={() => onRevoke(consent)}
                  >
                    {revokingId === consent.id ? 'Withdrawing...' : 'Withdraw'}
                  </Button>
                ) : (
                  <Typography component="span" color="text.disabled">
                    —
                  </Typography>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  </TableContainer>
)

const ConsentDialog = ({
  destinations,
  defaultThingId,
  today,
  onClose,
  onSubmit,
  isSubmitting,
  submitError,
}: {
  destinations: Destination[]
  defaultThingId: string
  today: Date
  onClose: () => void
  onSubmit: (input: CreateConsentInput) => void
  isSubmitting: boolean
  submitError?: string
}) => {
  // What the picker shows, which is a PointID once one is chosen. The id it
  // resolves to lives in the form.
  const [thingInput, setThingInput] = useState(defaultThingId)
  const [form, setForm] = useState({
    thing_id: defaultThingId,
    destination_slug: destinations[0]?.slug ?? '',
    data_type: 'water level',
    contact_id: '',
    starts_at: toDateInputValue(today),
    ends_at: '',
    notes: '',
  })
  const [errors, setErrors] = useState<ConsentFormErrors>({})

  const set = (field: keyof typeof form) => (value: string) =>
    setForm((previous) => ({ ...previous, [field]: value }))

  const handleSubmit = () => {
    const found = validateConsentForm(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    onSubmit(toCreateConsentInput(form))
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Record publication consent</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {submitError ? <Alert severity="error">{submitError}</Alert> : null}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <ThingPicker
              label="Thing (PointID)"
              helperText={
                errors.thing_id ?? 'Search by PointID, or enter an id.'
              }
              error={Boolean(errors.thing_id)}
              inputValue={thingInput}
              onInputChange={(value) => {
                setThingInput(value)
                // Digits are an id; a partly typed name is not one yet, and
                // sending it as though it were would fail at the API.
                set('thing_id')(/^\d+$/.test(value.trim()) ? value.trim() : '')
              }}
              onSelect={(thingId, name) => {
                set('thing_id')(thingId)
                setThingInput(name)
              }}
            />
            <TextField
              select
              fullWidth
              size="small"
              label="Destination"
              helperText={errors.destination_slug}
              error={Boolean(errors.destination_slug)}
              value={form.destination_slug}
              onChange={(event) => set('destination_slug')(event.target.value)}
            >
              {destinations.map((destination) => (
                <MenuItem key={destination.id} value={destination.slug}>
                  {destinationLabel(destination)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Data type"
              value={form.data_type}
              onChange={(event) => set('data_type')(event.target.value)}
            >
              {ACCESS_DATA_TYPES.map((dataType) => (
                <MenuItem key={dataType} value={dataType}>
                  {dataType}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              size="small"
              label="Consenting contact id"
              helperText={
                errors.contact_id ??
                'Leave empty when the Bureau owns the well.'
              }
              error={Boolean(errors.contact_id)}
              value={form.contact_id}
              onChange={(event) => set('contact_id')(event.target.value)}
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Starts"
              slotProps={{ inputLabel: { shrink: true } }}
              value={form.starts_at}
              onChange={(event) => set('starts_at')(event.target.value)}
            />
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Ends"
              slotProps={{ inputLabel: { shrink: true } }}
              helperText={errors.ends_at ?? 'Leave empty for no end date.'}
              error={Boolean(errors.ends_at)}
              value={form.ends_at}
              onChange={(event) => set('ends_at')(event.target.value)}
            />
          </Stack>

          <TextField
            fullWidth
            multiline
            minRows={2}
            size="small"
            label="Notes"
            helperText="Recorded with the consent. Say what was agreed, and with whom."
            value={form.notes}
            onChange={(event) => set('notes')(event.target.value)}
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
          {isSubmitting ? 'Recording...' : 'Record'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
