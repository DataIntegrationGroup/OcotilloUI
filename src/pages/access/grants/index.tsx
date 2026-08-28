import { Add, FilterAltOff } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
  Tooltip,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useAccessGrants, useCreateGrant, useRevokeGrant } from '@/hooks'
import { AccessConsole } from '@/pages/access/AccessConsole'
import { GrantDialog } from '@/pages/access/grants/GrantDialog'
import {
  ACCESS_DATA_TYPES,
  CAPABILITIES,
  type CreateGrantInput,
  describeScope,
  GRANT_SCOPE_TYPES,
  type GrantFilters,
  type GrantStatus,
  grantStatusOf,
  isUnfiltered,
  type PermissionGrant,
  sortGrants,
} from '@/utils/accessGrants'
import {
  ACCESS_STATUS_COLORS,
  ACCESS_STATUS_LABELS,
  isRevocable,
} from '@/utils/accessLifecycle'

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

  const handleCreate = (input: CreateGrantInput) => {
    createGrant.mutate(input, {
      onSuccess: (grant) => {
        setIsDialogOpen(false)
        // Grant to a principal the current filter excludes and the new row
        // would land off-screen, so the console narrows to it instead.
        setPrincipal(grant.principal_id)
        setFilters({
          principalId: grant.principal_id,
          includeRevoked: filters.includeRevoked,
        })
      },
    })
  }

  const rows = grants.data ? sortGrants(grants.data, today) : []

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
          label={grants.data ? `${grants.data.length} shown` : 'Loading'}
        />
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setIsDialogOpen(true)}
        >
          Grant access
        </Button>
      </Stack>

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
              label="Data type"
              value={filters.dataType ?? ''}
              options={ACCESS_DATA_TYPES}
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
            ? `${pendingRevoke.principal_id} will lose "${pendingRevoke.capability}" on ${pendingRevoke.data_type} (${describeScope(pendingRevoke)}). This cannot be undone from here — restoring access means creating a new grant.`
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
  onChange,
}: {
  label: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) => (
  <TextField
    select
    size="small"
    fullWidth
    label={label}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    sx={{ minWidth: 150 }}
  >
    <MenuItem value="">Any</MenuItem>
    {options.map((option) => (
      <MenuItem key={option} value={option}>
        {option}
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

const GrantsTable = ({
  rows,
  today,
  onRevoke,
  revokingId,
}: {
  rows: PermissionGrant[]
  today: Date
  onRevoke: (grant: PermissionGrant) => void
  revokingId: number | null
}) => (
  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
    <Table size="small" aria-label="Permission grants">
      <TableHead>
        <TableRow>
          <TableCell>Principal</TableCell>
          <TableCell>Capability</TableCell>
          <TableCell>Data type</TableCell>
          <TableCell>Scope</TableCell>
          <TableCell>Dates</TableCell>
          <TableCell>Granted by</TableCell>
          <TableCell>Status</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((grant) => {
          const status = grantStatusOf(grant, today)

          return (
            <TableRow key={grant.id} hover>
              <TableCell sx={{ minWidth: 160 }}>
                <Stack spacing={0.25}>
                  <Typography
                    component="code"
                    variant="body2"
                    sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}
                  >
                    {grant.principal_id}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {grant.principal_type}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>{grant.capability}</TableCell>
              <TableCell>{grant.data_type}</TableCell>
              <TableCell>{describeScope(grant)}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                <Typography variant="body2">
                  {grant.starts_at} → {grant.ends_at ?? 'no end'}
                </Typography>
              </TableCell>
              <TableCell>
                <Stack spacing={0.25}>
                  <Typography variant="body2">{grant.granted_by}</Typography>
                  {grant.reason ? (
                    <Typography variant="caption" color="text.secondary">
                      {grant.reason}
                    </Typography>
                  ) : null}
                </Stack>
              </TableCell>
              <TableCell>
                <Tooltip
                  title={
                    grant.revoked_at
                      ? `Revoked by ${grant.revoked_by ?? 'unknown'}`
                      : ''
                  }
                >
                  <Chip
                    size="small"
                    label={ACCESS_STATUS_LABELS[status]}
                    color={ACCESS_STATUS_COLORS[status]}
                    variant={status === 'active' ? 'filled' : 'outlined'}
                  />
                </Tooltip>
              </TableCell>
              <TableCell align="right">
                {isRevocable(grant, today) ? (
                  <Button
                    size="small"
                    color="error"
                    disabled={revokingId === grant.id}
                    onClick={() => onRevoke(grant)}
                  >
                    {revokingId === grant.id ? 'Revoking...' : 'Revoke'}
                  </Button>
                ) : (
                  <Box component="span" sx={{ color: 'text.disabled' }}>
                    —
                  </Box>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  </TableContainer>
)
