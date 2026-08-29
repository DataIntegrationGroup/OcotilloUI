import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import { useState } from 'react'
import {
  ACCESS_DATA_TYPES,
  CAPABILITIES,
  type CreateGrantInput,
  GRANT_SCOPE_TYPES,
  type GrantFormErrors,
  PRINCIPAL_TYPES,
  scopeIdRequired,
  scopeTypeFor,
  toCreateGrantInput,
  UI_SURFACES,
  validateGrantForm,
} from '@/utils/accessGrants'
import { toDateInputValue } from '@/utils/accessLifecycle'

export type GrantFormState = {
  principal_type: string
  principal_id: string
  capability: string
  scope_type: string
  scope_id: string
  subject: string
  data_type: string
  ui_surface: string
  starts_at: string
  ends_at: string
  reason: string
}

export const emptyGrantForm = (
  today: Date,
  principalId = ''
): GrantFormState => ({
  principal_type: 'user',
  principal_id: principalId,
  capability: 'read',
  scope_type: 'global',
  scope_id: '',
  subject: 'data_type',
  data_type: 'water level',
  ui_surface: '',
  starts_at: toDateInputValue(today),
  ends_at: '',
  reason: '',
})

/**
 * Every axis of a grant is named explicitly — there is no wildcard data type
 * on the API side, and the form does not invent one. An admin picks one
 * capability over one data type in one scope, which is the unit the API
 * stores and the unit that can later be revoked.
 */
export const GrantDialog = ({
  open,
  onClose,
  onSubmit,
  today,
  defaultPrincipalId,
  isSubmitting,
  submitError,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (input: CreateGrantInput) => void
  today: Date
  defaultPrincipalId: string
  isSubmitting: boolean
  submitError?: string
}) => {
  const [form, setForm] = useState<GrantFormState>(() =>
    emptyGrantForm(today, defaultPrincipalId)
  )
  const [errors, setErrors] = useState<GrantFormErrors>({})

  const set = (field: keyof GrantFormState) => (value: string) =>
    setForm((previous) => ({ ...previous, [field]: value }))

  const handleSubmit = () => {
    const found = validateGrantForm(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    onSubmit(toCreateGrantInput(form))
  }

  const isSurface = form.subject === 'ui_surface'
  // A screen grant is global whatever the scope select last held.
  const scopeType = scopeTypeFor(form.subject, form.scope_type)
  const needsScopeId = scopeIdRequired(scopeType)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      // Remounting on open resets the form without an effect: a dialog that
      // reopens holding the last submission is a way to grant twice by
      // accident.
      keepMounted={false}
    >
      <DialogTitle>Grant access</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {submitError ? <Alert severity="error">{submitError}</Alert> : null}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Principal type"
              value={form.principal_type}
              onChange={(event) => set('principal_type')(event.target.value)}
            >
              {PRINCIPAL_TYPES.map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              size="small"
              label="Principal"
              helperText={
                errors.principal_id ??
                'Authentik subject, role name, or key label.'
              }
              error={Boolean(errors.principal_id)}
              value={form.principal_id}
              onChange={(event) => set('principal_id')(event.target.value)}
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Capability"
              value={form.capability}
              onChange={(event) => set('capability')(event.target.value)}
            >
              {CAPABILITIES.map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              fullWidth
              size="small"
              label="Grant covers"
              value={form.subject}
              onChange={(event) => set('subject')(event.target.value)}
            >
              <MenuItem value="data_type">a data type</MenuItem>
              <MenuItem value="ui_surface">a screen</MenuItem>
            </TextField>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {isSurface ? (
              <TextField
                select
                fullWidth
                size="small"
                label="Screen"
                helperText={
                  errors.ui_surface ??
                  'Opens this screen for the principal. It grants no write access.'
                }
                error={Boolean(errors.ui_surface)}
                value={form.ui_surface}
                onChange={(event) => set('ui_surface')(event.target.value)}
              >
                {UI_SURFACES.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                select
                fullWidth
                size="small"
                label="Data type"
                value={form.data_type}
                onChange={(event) => set('data_type')(event.target.value)}
              >
                {ACCESS_DATA_TYPES.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Scope"
              disabled={isSurface}
              helperText={
                isSurface
                  ? 'Navigation is app-wide, so a screen grant is global.'
                  : undefined
              }
              value={scopeType}
              onChange={(event) => set('scope_type')(event.target.value)}
            >
              {GRANT_SCOPE_TYPES.map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              size="small"
              label={needsScopeId ? `${scopeType} id` : 'Scope id'}
              disabled={!needsScopeId}
              helperText={
                errors.scope_id ??
                (needsScopeId ? undefined : 'A global grant names no scope id.')
              }
              error={Boolean(errors.scope_id)}
              value={needsScopeId ? form.scope_id : ''}
              onChange={(event) => set('scope_id')(event.target.value)}
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
            label="Reason"
            helperText="Recorded with the grant. Say why this access exists."
            value={form.reason}
            onChange={(event) => set('reason')(event.target.value)}
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
          {isSubmitting ? 'Granting...' : 'Grant'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
