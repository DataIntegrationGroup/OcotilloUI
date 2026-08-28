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
import { SettingsCard } from '@/pages/settings/SettingsCard'
import { OGC_INTERNAL_GROUP } from '@/utils/accessControl'
import {
  type ApiKey,
  apiKeyStatus,
  createApiKey,
  describeExpiry,
  describeLastUsed,
  isApiKeyActive,
  renameApiKey,
  revokeApiKey,
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
  apiKey: ApiKey | null
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
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  confirmLabel: string
  initialName?: string
  onCancel: () => void
  onConfirm: (name: string) => void
}) => {
  const [name, setName] = useState(initialName ?? '')

  return (
    <Dialog
      open={open}
      onClose={onCancel}
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
          helperText="A name you will recognise later, so you know what to revoke."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!name.trim()}
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

/**
 * Personal API keys.
 *
 * Deliberately not wired to the backend: the endpoints do not exist yet, so
 * this renders the whole flow against local state to settle the interaction
 * first. Keys generated here are not credentials and do not survive a reload,
 * and the card says as much rather than letting anyone assume otherwise.
 */
export const ApiKeysCard = ({
  canManageKeys,
  initialKeys = [],
  now = () => new Date(),
}: {
  /** Whether the account holds the group the API will require. */
  canManageKeys: boolean
  initialKeys?: ApiKey[]
  now?: () => Date
}) => {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys)
  const [newKey, setNewKey] = useState<ApiKey | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editing, setEditing] = useState<ApiKey | null>(null)
  const [revoking, setRevoking] = useState<ApiKey | null>(null)

  const handleGenerate = (name: string) => {
    const created = createApiKey({ name, now: now() })
    setKeys((existing) => [created, ...existing])
    setIsGenerating(false)
    setNewKey(created)
  }

  const handleRename = (name: string) => {
    if (!editing) return
    setKeys((existing) =>
      existing.map((key) =>
        key.id === editing.id ? renameApiKey(key, name) : key
      )
    )
    setEditing(null)
  }

  const handleRevoke = () => {
    if (!revoking) return
    setKeys((existing) =>
      existing.map((key) =>
        key.id === revoking.id ? revokeApiKey(key, now()) : key
      )
    )
    setRevoking(null)
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
  const sorted = sortApiKeys(keys, at)

  return (
    <SettingsCard
      title="API keys"
      description="Keys for reaching the Ocotillo API from scripts and desktop tools."
    >
      <Stack spacing={2}>
        <Alert severity="info">
          Preview only. The API does not issue keys yet, so keys created here
          are not real credentials and disappear when you reload the page.
        </Alert>

        <Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add fontSize="small" />}
            onClick={() => setIsGenerating(true)}
          >
            Generate key
          </Button>
        </Box>

        {sorted.length === 0 ? (
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
        onCancel={() => setIsGenerating(false)}
        onConfirm={handleGenerate}
      />
      <NameDialog
        open={Boolean(editing)}
        title="Rename key"
        confirmLabel="Save"
        initialName={editing?.name}
        onCancel={() => setEditing(null)}
        onConfirm={handleRename}
      />
      <RevokeDialog
        apiKey={revoking}
        onCancel={() => setRevoking(null)}
        onConfirm={handleRevoke}
      />
      <NewKeyDialog apiKey={newKey} onClose={() => setNewKey(null)} />
    </SettingsCard>
  )
}
