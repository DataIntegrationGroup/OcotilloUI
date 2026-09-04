import {
  Add,
  ContentCopy,
  Delete,
  Edit,
  WarningAmber,
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import {
  useApiKeys,
  useCreateApiKey,
  useRenameApiKey,
  useRevokeApiKey,
} from '@/hooks'
import { SettingsCard } from '@/pages/settings/SettingsCard'
import { settings } from '@/settings'
import { OGC_INTERNAL_GROUP } from '@/utils/accessControl'
import {
  type ApiKey,
  apiKeyStatus,
  describeExpiry,
  describeLastUsed,
  isApiKeyActive,
  type NewApiKey,
  sortApiKeys,
} from '@/utils/apiKeys'

/**
 * Shown once, immediately after generation. A real API returns the token only
 * at creation, so the dialog is the single chance to copy it — the card below
 * never renders a full token again.
 */
const NewKeyDialog = ({
  apiKey,
  onClose,
}: {
  apiKey: NewApiKey | null
  onClose: () => void
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!apiKey?.token) return
    await navigator.clipboard.writeText(apiKey.token)
    setCopied(true)
  }

  return (
    <Dialog open={Boolean(apiKey)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Copy your new key</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          <DialogContentText>
            This is the only time the full key is shown. Copy it now and store
            it somewhere safe.
          </DialogContentText>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography
              component="code"
              sx={{
                flex: 1,
                px: 1.5,
                py: 1,
                borderRadius: 1,
                bgcolor: 'action.hover',
                overflowWrap: 'anywhere',
                fontSize: 13,
              }}
            >
              {apiKey?.token}
            </Typography>
            <Tooltip title={copied ? 'Copied' : 'Copy key'}>
              <IconButton onClick={handleCopy} aria-label="Copy key">
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  )
}

const NameDialog = ({
  open,
  title,
  confirmLabel,
  initialName,
  isPending = false,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  confirmLabel: string
  initialName?: string
  isPending?: boolean
  onCancel: () => void
  onConfirm: (name: string) => void
}) => {
  const [name, setName] = useState(initialName ?? '')

  return (
    <Dialog
      open={open}
      // Ignore backdrop/escape dismissals while the request is in flight, so
      // the dialog cannot close out from under a pending mutation.
      onClose={() => {
        if (!isPending) onCancel()
      }}
      fullWidth
      maxWidth="xs"
      // Remount on open so the field starts from the key being edited.
      key={`${title}-${initialName ?? ''}`}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label="Key name"
          placeholder="e.g. Field laptop, QGIS at the office"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isPending}
          helperText="A name you will recognise later, so you know what to revoke."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!name.trim() || isPending}
          startIcon={
            isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
          onClick={() => onConfirm(name)}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const RevokeDialog = ({
  apiKey,
  onCancel,
  onConfirm,
}: {
  apiKey: ApiKey | null
  onCancel: () => void
  onConfirm: () => void
}) => (
  <Dialog open={Boolean(apiKey)} onClose={onCancel} fullWidth maxWidth="xs">
    <DialogTitle>Revoke “{apiKey?.name}”?</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Anything using this key stops working immediately. This cannot be undone
        — you would generate a new key instead.
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>Cancel</Button>
      <Button color="error" variant="contained" onClick={onConfirm}>
        Revoke key
      </Button>
    </DialogActions>
  </Dialog>
)

/** The one URL a desktop client connects to. A key reaches this and nothing else. */
const INTERNAL_OGC_URL = `${settings.ocotillo_api_url.replace(/\/+$/, '')}/ogcapi-internal`

/**
 * How to use a key from ArcGIS Pro.
 *
 * Pro cannot carry an Authentik bearer token, which is why keys exist at all:
 * Basic auth with a saved login is the only scheme its OGC API connection
 * dialog supports, and the query parameter is the fallback for when an
 * intermediary refuses Basic.
 */
const ArcGisDialog = ({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(INTERNAL_OGC_URL)
    setCopied(true)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Connecting from ArcGIS Pro</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <DialogContentText>
            A key connects ArcGIS Pro to the internal OGC collections, which
            include draft records and skip the public filters. Generate the key
            first. It is shown once, so copy it before you start.
          </DialogContentText>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Server URL
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                component="code"
                sx={{
                  flex: 1,
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  overflowWrap: 'anywhere',
                  fontSize: 13,
                }}
              >
                {INTERNAL_OGC_URL}
              </Typography>
              <Tooltip title={copied ? 'Copied' : 'Copy URL'}>
                <IconButton onClick={handleCopy} aria-label="Copy URL">
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Basic authentication (preferred)
            </Typography>
            <Typography
              variant="body2"
              component="ol"
              // Tailwind's preflight resets list-style, so numbered steps stop
              // being numbered unless the list asks for it back.
              sx={{ listStyle: 'decimal', pl: 3, m: 0 }}
            >
              <li>
                <strong>Insert</strong> → <strong>Connections</strong> →{' '}
                <strong>Server</strong> → <strong>New OGC API Server</strong>.
              </li>
              <li>Paste the server URL above.</li>
              <li>
                Authentication: <strong>Server Authentication</strong>. Any
                username works, so use <code>apikey</code>. Password: your key.
              </li>
              <li>
                Check <strong>Save Login</strong> so Pro keeps the key with the
                connection.
              </li>
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              If Basic is refused
            </Typography>
            <Typography variant="body2">
              Leave Authentication as <strong>No Authentication</strong>. Add a
              custom request parameter named <code>token</code> with your key as
              the value. Pro re-appends it to every request, including paging.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  )
}

/**
 * Personal API keys.
 *
 * A key here is a real credential for `/ogcapi-internal` and nothing else. The
 * token is shown once, at creation, because that is the only time the server
 * has it — everything after reads the digest.
 */
export const ApiKeysCard = ({
  canManageKeys,
  now = () => new Date(),
}: {
  /** Whether the account holds the group the route requires. */
  canManageKeys: boolean
  now?: () => Date
}) => {
  const [newKey, setNewKey] = useState<NewApiKey | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editing, setEditing] = useState<ApiKey | null>(null)
  const [revoking, setRevoking] = useState<ApiKey | null>(null)
  const [isShowingArcGis, setIsShowingArcGis] = useState(false)

  const keys = useApiKeys()
  const createKey = useCreateApiKey()
  const renameKey = useRenameApiKey()
  const revokeKey = useRevokeApiKey()

  const handleGenerate = (name: string) => {
    createKey.mutate(
      { name },
      {
        onSuccess: (created) => {
          setIsGenerating(false)
          // The one moment the token exists outside the server.
          setNewKey(created)
        },
      }
    )
  }

  const handleRename = (name: string) => {
    if (!editing) return
    renameKey.mutate(
      { id: editing.id, name },
      { onSuccess: () => setEditing(null) }
    )
  }

  const handleRevoke = () => {
    if (!revoking) return
    revokeKey.mutate(revoking.id, { onSuccess: () => setRevoking(null) })
  }

  // Shown rather than hidden: a missing card leaves someone guessing why, and
  // this page exists to answer exactly that kind of question.
  if (!canManageKeys) {
    return (
      <SettingsCard
        title="API keys"
        description="Keys for reaching the Ocotillo API from scripts and desktop tools."
      >
        <Alert severity="info">
          API keys are limited to accounts in the{' '}
          <Typography component="code" variant="inherit">
            {OGC_INTERNAL_GROUP}
          </Typography>{' '}
          group, which this account does not hold. Ask an administrator to add
          you if you need to reach the API from outside this app.
        </Alert>
      </SettingsCard>
    )
  }

  // One reading of the clock per render, so every row agrees on what "now" is.
  const at = now()
  const sorted = keys.data ? sortApiKeys(keys.data, at) : []

  return (
    <SettingsCard
      title="API keys"
      description="Keys for reaching the Ocotillo API from scripts and desktop tools."
    >
      <Stack spacing={2}>
        <Alert severity="info">
          A key reaches the internal OGC collections and nothing else. It is
          shown once, when it is created.
        </Alert>

        {keys.isError ? (
          <Alert severity="error">
            Failed to load your keys.
            {keys.error instanceof Error ? ` ${keys.error.message}` : null}
          </Alert>
        ) : null}

        {createKey.isError ? (
          <Alert severity="error">
            Failed to issue a key.
            {createKey.error instanceof Error
              ? ` ${createKey.error.message}`
              : null}
          </Alert>
        ) : null}

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            size="small"
            startIcon={
              createKey.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Add fontSize="small" />
              )
            }
            disabled={createKey.isPending}
            onClick={() => setIsGenerating(true)}
          >
            {createKey.isPending ? 'Generating...' : 'Generate key'}
          </Button>
          <Button size="small" onClick={() => setIsShowingArcGis(true)}>
            Connecting from ArcGIS Pro
          </Button>
        </Stack>

        {keys.isLoading ? (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              Loading your keys...
            </Typography>
          </Stack>
        ) : sorted.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No keys yet. Generate one to use the API outside this app.
          </Typography>
        ) : (
          <Table size="small" aria-label="API keys">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Key</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Last used</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((key) => {
                const status = apiKeyStatus(key, at)
                const active = isApiKeyActive(key, at)
                const expiryColor =
                  status === 'expired'
                    ? 'error.main'
                    : status === 'expiring'
                      ? 'warning.main'
                      : 'text.secondary'

                return (
                  <TableRow key={key.id} sx={{ opacity: active ? 1 : 0.6 }}>
                    <TableCell>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        useFlexGap
                        flexWrap="wrap"
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {key.name}
                        </Typography>
                        {status === 'revoked' ? (
                          <Chip size="small" label="Revoked" color="default" />
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography
                        component="code"
                        variant="caption"
                        sx={{ overflowWrap: 'anywhere' }}
                      >
                        {key.token_preview}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(key.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {/* A revoked key's own expiry no longer means anything. */}
                      {status === 'revoked' ? (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      ) : (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                        >
                          {status === 'expiring' || status === 'expired' ? (
                            <WarningAmber
                              fontSize="small"
                              sx={{ color: expiryColor }}
                              aria-hidden
                            />
                          ) : null}
                          <Typography
                            variant="body2"
                            sx={{ color: expiryColor }}
                          >
                            {describeExpiry(key, at)}
                          </Typography>
                        </Stack>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {describeLastUsed(key)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
                        <Tooltip title="Rename">
                          <span>
                            <IconButton
                              size="small"
                              disabled={!active}
                              onClick={() => setEditing(key)}
                              aria-label={`Rename ${key.name}`}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Revoke">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={!active}
                              onClick={() => setRevoking(key)}
                              aria-label={`Revoke ${key.name}`}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Stack>

      <NameDialog
        open={isGenerating}
        title="Generate an API key"
        confirmLabel="Generate"
        isPending={createKey.isPending}
        onCancel={() => setIsGenerating(false)}
        onConfirm={handleGenerate}
      />
      <NameDialog
        open={Boolean(editing)}
        title="Rename key"
        confirmLabel="Save"
        initialName={editing?.name}
        isPending={renameKey.isPending}
        onCancel={() => setEditing(null)}
        onConfirm={handleRename}
      />
      <RevokeDialog
        apiKey={revoking}
        onCancel={() => setRevoking(null)}
        onConfirm={handleRevoke}
      />
      <NewKeyDialog apiKey={newKey} onClose={() => setNewKey(null)} />
      <ArcGisDialog
        open={isShowingArcGis}
        onClose={() => setIsShowingArcGis(false)}
      />
    </SettingsCard>
  )
}
