import { Add, DesktopWindows, FilterAltOff, Storage } from '@mui/icons-material'
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import {
  useAccessGrants,
  useCreateGrant,
  useGroups,
  useRevokeGrant,
} from '@/hooks'
import { AccessConsole } from '@/pages/access/AccessConsole'
import { GrantDialog } from '@/pages/access/grants/GrantDialog'
import { GrantsTable } from '@/pages/access/grants/GrantsTable'
import {
  ACCESS_DATA_TYPES,
  CAPABILITIES,
  GRANT_SUBJECTS,
  type CreateGrantInput,
  describeScope,
  describeSubject,
  GRANT_SCOPE_TYPES,
  type GrantFilters,
  isUnfiltered,
  matchesFilters,
  type PermissionGrant,
  sortGrants,
} from '@/utils/accessGrants'

/**
 * Operations console for ADR5 permission grants.
 *
 * The page is organised around a single principal because the API is: there is
 * no route that lists every grant, only `GET /access/grant?principal_id=…`.
 * That is the right shape for the question this console answers — "what may
 * this person, role, or key do, and why" — but it does mean an admin has to
 * know who they are asking about before anything loads.
 */
export const AccessGrantsPage = () => (
  <AccessConsole activePath="/access/grants">
    <GrantsTab />
  </AccessConsole>
)

const GrantsTab = () => {
  // `principal` is what is being typed; `filters.principalId` is what has
  // been submitted. Keeping them apart stops a partially-typed subject from
  // firing a request on every keystroke. The dropdowns have no such problem,
  // so they apply on change.
  const [principal, setPrincipal] = useState('')
  const [filters, setFilters] = useState<GrantFilters>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  // Revocation is not undoable through this console — the API has no
  // un-revoke — so the button asks before it fires.
  const [pendingRevoke, setPendingRevoke] = useState<PermissionGrant | null>(
    null
  )
  const [today] = useState(() => new Date())
  // A grant written outside the slice on screen. The list refetches either
  // way; this is what says so, rather than the row landing nowhere visible.
  const [grantedOutOfView, setGrantedOutOfView] =
    useState<PermissionGrant | null>(null)

  const grants = useAccessGrants(filters)
  const createGrant = useCreateGrant()
  const revokeGrant = useRevokeGrant()

  const setFilter = <TKey extends keyof GrantFilters>(
    key: TKey,
    value: GrantFilters[TKey]
  ) => setFilters((previous) => ({ ...previous, [key]: value || undefined }))

  const clearFilters = () => {
    setPrincipal('')
    setFilters({})
  }

  const showOnlyPrincipal = (principalId: string) => {
    setPrincipal(principalId)
    setFilters({
      principalId,
      includeRevoked: filters.includeRevoked,
    })
    setGrantedOutOfView(null)
  }

  const handleCreate = (input: CreateGrantInput) => {
    createGrant.mutate(input, {
      onSuccess: (grant) => {
        setIsDialogOpen(false)
        // The filters an admin set are theirs to change. Creating a grant
        // refetches the list in place; it does not narrow the view to the new
        // row, which would hide every grant they were already looking at.
        setGrantedOutOfView(matchesFilters(grant, filters) ? null : grant)
      },
    })
  }

  // Every filter but `subject` is answered by the API; that one narrows the
  // rows here, because the route filters on an exact screen rather than on
  // whether a grant names one at all.
  const rows = grants.data
    ? sortGrants(
        grants.data.filter((grant) => matchesFilters(grant, filters)),
        today
      )
    : []

  return (
    <Stack spacing={3}>
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        justifyContent="space-between"
      >
        <Chip
          size="small"
          variant="outlined"
          label={grants.data ? `${rows.length} shown` : 'Loading'}
        />
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setIsDialogOpen(true)}
        >
          Grant access
        </Button>
      </Stack>

      {grantedOutOfView ? (
        <Alert
          severity="info"
          onClose={() => setGrantedOutOfView(null)}
          action={
            <Button
              size="small"
              onClick={() => showOnlyPrincipal(grantedOutOfView.principal_id)}
            >
              Show it
            </Button>
          }
        >
          Granted to {grantedOutOfView.principal_id}. The current filters do not
          show it.
        </Alert>
      ) : null}

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              size="small"
              fullWidth
              label="Principal"
              placeholder="Authentik subject, role name, or key label"
              helperText="Press Enter to apply. Leave empty for every principal."
              value={principal}
              onChange={(event) => setPrincipal(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  setFilter('principalId', principal.trim())
                }
              }}
            />
            <FilterSelect
              label="Capability"
              value={filters.capability ?? ''}
              options={CAPABILITIES}
              onChange={(value) => setFilter('capability', value)}
            />
            <FilterSelect
              label="Covers"
              value={filters.subject ?? ''}
              options={GRANT_SUBJECTS}
              labels={SUBJECT_FILTER_LABELS}
              onChange={(value) =>
                setFilters((previous) => ({
                  ...previous,
                  subject: value || undefined,
                  // A screen grant carries no data type, so the two filters
                  // together would always come back empty.
                  dataType:
                    value === 'ui_surface' ? undefined : previous.dataType,
                }))
              }
            />
            <FilterSelect
              label="Data type"
              value={filters.dataType ?? ''}
              options={ACCESS_DATA_TYPES}
              disabled={filters.subject === 'ui_surface'}
              helperText={
                filters.subject === 'ui_surface'
                  ? 'Screen grants have no data type.'
                  : undefined
              }
              onChange={(value) => setFilter('dataType', value)}
            />
            <FilterSelect
              label="Scope"
              value={filters.scopeType ?? ''}
              options={GRANT_SCOPE_TYPES}
              onChange={(value) => setFilter('scopeType', value)}
            />
          </Stack>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            useFlexGap
          >
            <FormControlLabel
              sx={{ mr: 0 }}
              control={
                <Switch
                  size="small"
                  checked={filters.includeRevoked ?? false}
                  onChange={(event) =>
                    setFilters((previous) => ({
                      ...previous,
                      includeRevoked: event.target.checked,
                    }))
                  }
                />
              }
              label="Include revoked"
            />
            <Button
              size="small"
              startIcon={<FilterAltOff fontSize="small" />}
              onClick={clearFilters}
              disabled={isUnfiltered(filters)}
            >
              Clear filters
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {revokeGrant.isError ? (
        <Alert severity="error">
          Failed to revoke that grant.
          {revokeGrant.error instanceof Error
            ? ` ${revokeGrant.error.message}`
            : null}
        </Alert>
      ) : null}

      {grants.isLoading ? (
        <Stack alignItems="center" spacing={1.5} sx={{ py: 6 }}>
          <CircularProgress size={28} />
          <Typography variant="body2" color="text.secondary">
            Loading grants...
          </Typography>
        </Stack>
      ) : grants.isError ? (
        <Alert severity="error">
          Failed to load grants.
          {grants.error instanceof Error ? ` ${grants.error.message}` : null}
        </Alert>
      ) : rows.length === 0 ? (
        <EmptyState
          title={isUnfiltered(filters) ? 'No grants yet' : 'No grants match'}
          body={
            isUnfiltered(filters)
              ? filters.includeRevoked
                ? 'No permission grant has ever been recorded.'
                : 'No grant is live. Turn on "Include revoked" to see past ones.'
              : 'Nothing matches these filters. Widen or clear them to see more.'
          }
        />
      ) : (
        <GrantsTable
          rows={rows}
          today={today}
          onRevoke={setPendingRevoke}
          revokingId={
            revokeGrant.isPending ? (revokeGrant.variables ?? null) : null
          }
        />
      )}

      <ConfirmDialog
        open={pendingRevoke !== null}
        onClose={() => setPendingRevoke(null)}
        title="Revoke this grant?"
        text={
          pendingRevoke
            ? `${pendingRevoke.principal_id} will lose "${pendingRevoke.capability}" on ${describeSubject(pendingRevoke)} (${describeScope(pendingRevoke)}). This cannot be undone from here — restoring access means creating a new grant.`
            : ''
        }
        PrimaryActionBtnMsg="Revoke"
        onPrimaryAction={() => {
          if (pendingRevoke) revokeGrant.mutate(pendingRevoke.id)
          setPendingRevoke(null)
        }}
      />

      {isDialogOpen ? (
        <GrantDialog
          open
          onClose={() => setIsDialogOpen(false)}
          onSubmit={handleCreate}
          today={today}
          defaultPrincipalId={filters.principalId ?? principal.trim()}
          isSubmitting={createGrant.isPending}
          submitError={
            createGrant.isError
              ? createGrant.error instanceof Error
                ? createGrant.error.message
                : 'The grant was rejected.'
              : undefined
          }
        />
      ) : null}
    </Stack>
  )
}

/**
 * A filter that can be switched off. "Any" is the empty value the API means
 * by omitting the parameter, so it is a real option rather than a cleared
 * field the reader has to guess at.
 */
const FilterSelect = ({
  label,
  value,
  options,
  labels,
  disabled,
  helperText,
  onChange,
}: {
  label: string
  value: string
  options: readonly string[]
  /** For options whose stored value is not what an admin should read. */
  labels?: Record<string, string>
  disabled?: boolean
  helperText?: string
  onChange: (value: string) => void
}) => (
  <TextField
    select
    size="small"
    fullWidth
    label={label}
    value={value}
    disabled={disabled}
    helperText={helperText}
    onChange={(event) => onChange(event.target.value)}
    sx={{ minWidth: 150 }}
  >
    <MenuItem value="">Any</MenuItem>
    {options.map((option) => (
      <MenuItem key={option} value={option}>
        {labels?.[option] ?? option}
      </MenuItem>
    ))}
  </TextField>
)

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

const SUBJECT_FILTER_LABELS: Record<string, string> = {
  data_type: 'data grants',
  ui_surface: 'screen grants',
}
