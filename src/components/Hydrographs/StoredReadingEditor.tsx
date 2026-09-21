import { Close, DeleteForever, Save } from '@mui/icons-material'
import {
  Alert,
  Button,
  Chip,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import type {
  TransducerObservationDetailResponse,
  UpdateTransducerObservation,
} from '@/generated/types.gen'

/**
 * The per-reading routes, supplied by the page so the workbench stays free of
 * API calls and still renders in demo mode.
 */
export interface StoredReadingActions {
  load: (observationId: number) => Promise<TransducerObservationDetailResponse>
  update: (
    observationId: number,
    patch: UpdateTransducerObservation
  ) => Promise<TransducerObservationDetailResponse>
  remove: (observationId: number) => Promise<void>
}

const errorMessage = (caught: unknown, fallback: string) =>
  caught instanceof Error ? caught.message : fallback

/**
 * One stored reading, loaded fresh by id, with its value and note editable.
 *
 * The timestamp is not editable -- only time ties a reading to its block, so
 * moving one would orphan it. A changed value needs a note, because a reading
 * with no note reads as the value the sensor recorded; the API enforces the
 * same rule, and saying so here saves a round trip.
 */
export const StoredReadingEditor = ({
  observationId,
  actions,
  canEdit,
  onClose,
}: {
  observationId: number
  actions: StoredReadingActions
  canEdit: boolean
  onClose: () => void
}) => {
  const [detail, setDetail] =
    useState<TransducerObservationDetailResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [valueText, setValueText] = useState('')
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const { load } = actions

  useEffect(() => {
    let cancelled = false
    setDetail(null)
    setLoadError(null)
    setActionError(null)
    setConfirmingDelete(false)

    load(observationId)
      .then((loaded) => {
        if (cancelled) return
        setDetail(loaded)
        setValueText(String(loaded.observation.value))
        setNote(loaded.observation.note ?? '')
      })
      .catch((caught) => {
        if (!cancelled) {
          setLoadError(errorMessage(caught, 'Unable to load the reading.'))
        }
      })

    return () => {
      cancelled = true
    }
  }, [observationId, load])

  const header = (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Typography variant="body2" fontWeight={600}>
        Stored reading {observationId}
      </Typography>
      <IconButton size="small" aria-label="Close reading" onClick={onClose}>
        <Close fontSize="small" />
      </IconButton>
    </Stack>
  )

  if (loadError) {
    return (
      <Stack spacing={1}>
        {header}
        <Alert severity="error" sx={{ py: 0.25 }}>
          {loadError}
        </Alert>
      </Stack>
    )
  }

  if (!detail) {
    return (
      <Stack spacing={1}>
        {header}
        <Skeleton variant="rounded" height={96} />
      </Stack>
    )
  }

  const { observation, block } = detail
  const parsedValue = Number(valueText)
  const valueIsValid = valueText.trim() !== '' && Number.isFinite(parsedValue)
  const valueChanged = valueIsValid && parsedValue !== observation.value
  const noteChanged = note !== (observation.note ?? '')
  const needsNote = valueChanged && note.trim() === ''
  const busy = isSaving || isDeleting

  const save = async () => {
    const patch: UpdateTransducerObservation = {}
    if (valueChanged) patch.value = parsedValue
    if (noteChanged) patch.note = note.trim() === '' ? null : note
    setIsSaving(true)
    setActionError(null)
    try {
      const updated = await actions.update(observationId, patch)
      setDetail(updated)
      setValueText(String(updated.observation.value))
      setNote(updated.observation.note ?? '')
    } catch (caught) {
      setActionError(errorMessage(caught, 'Saving the reading failed.'))
    } finally {
      setIsSaving(false)
    }
  }

  const remove = async () => {
    setIsDeleting(true)
    setActionError(null)
    try {
      await actions.remove(observationId)
      onClose()
    } catch (caught) {
      setActionError(errorMessage(caught, 'Deleting the reading failed.'))
      setIsDeleting(false)
    }
  }

  return (
    <Stack spacing={1}>
      {header}
      <Typography variant="caption" color="text.secondary">
        {new Date(observation.observation_datetime).toLocaleString()}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Chip
          size="small"
          color={observation.data_maturity === 'approved' ? 'success' : 'info'}
          label={observation.data_maturity ?? 'maturity not stated'}
        />
        <Typography variant="caption" color="text.secondary">
          {block
            ? `Block ${block.id} (${block.review_status})`
            : 'No block covers this reading'}
        </Typography>
      </Stack>

      <TextField
        label="Value (ft bgs)"
        size="small"
        type="number"
        value={valueText}
        onChange={(event) => setValueText(event.target.value)}
        disabled={!canEdit || busy}
        error={!valueIsValid}
        helperText={valueIsValid ? undefined : 'Enter a number.'}
      />
      <TextField
        label="Note"
        size="small"
        multiline
        minRows={2}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        disabled={!canEdit || busy}
        error={needsNote}
        helperText={
          needsNote
            ? 'A changed value needs a note saying why.'
            : 'Empty means the value is as the sensor recorded it.'
        }
      />

      {actionError ? (
        <Alert severity="error" sx={{ py: 0.25 }}>
          {actionError}
        </Alert>
      ) : null}

      {canEdit ? (
        <Stack spacing={0.75}>
          <Button
            size="small"
            variant="contained"
            startIcon={<Save />}
            onClick={save}
            disabled={
              busy ||
              !valueIsValid ||
              needsNote ||
              !(valueChanged || noteChanged)
            }
          >
            {isSaving ? 'Saving…' : 'Save Reading'}
          </Button>
          {confirmingDelete ? (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                fullWidth
                onClick={() => setConfirmingDelete(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                size="small"
                fullWidth
                variant="contained"
                color="error"
                startIcon={<DeleteForever />}
                onClick={remove}
                disabled={busy}
              >
                {isDeleting ? 'Deleting…' : 'Confirm Delete'}
              </Button>
            </Stack>
          ) : (
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteForever />}
              onClick={() => setConfirmingDelete(true)}
              disabled={busy}
            >
              Delete Reading
            </Button>
          )}
        </Stack>
      ) : null}
    </Stack>
  )
}
