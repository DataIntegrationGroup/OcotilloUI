import {
  Alert,
  AlertTitle,
  LinearProgress,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'

export interface PublishProgress {
  wellName: string
  /** What the operation is; a publish unless it says otherwise. */
  operation?: 'publish' | 'delete'
  /** What is happening right now: "Uploading", "Saving on the server". */
  stage?: string
  /**
   * How far along the whole operation is, 0 to 100, when that can be known.
   * Omitted when it cannot -- the server reports nothing while it works -- and
   * the bar then runs without a value rather than claiming a figure.
   */
  percent?: number | null
  /** Which block of several is being written. */
  step?: { current: number; total: number }
  /** Free text in place of the default explanation. */
  detail?: string
}

export interface PublishResult {
  wellName: string
  message: string
}

interface PublishStatusNoticeProps {
  progress: PublishProgress | null
  success: PublishResult | null
  error: PublishResult | null
  onDismissSuccess: () => void
  onDismissError: () => void
}

/**
 * Publishing a long series can take minutes, and by the time it ends the user
 * has usually scrolled away from the publish button. Pinned to the bottom of
 * the viewport, this keeps the in-flight state and the outcome in view
 * wherever the page is scrolled, each naming the well it concerns. Results
 * stay until dismissed rather than timing out, so one is never missed.
 */
// "Block 2 of 3 · Uploading · 47% complete": each part only when it is known.
const describeProgress = (progress: PublishProgress): string | null => {
  const parts = [
    progress.step
      ? `Block ${progress.step.current} of ${progress.step.total}`
      : null,
    progress.stage ?? null,
    progress.percent != null
      ? `${Math.round(progress.percent)}% complete`
      : null,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(' · ') : null
}

export const PublishStatusNotice = ({
  progress,
  success,
  error,
  onDismissSuccess,
  onDismissError,
}: PublishStatusNoticeProps) => (
  <Snackbar
    open={Boolean(progress || success || error)}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
  >
    <Stack spacing={1} sx={{ width: '100%', maxWidth: 640 }}>
      {progress ? (
        <Alert
          severity="info"
          variant="filled"
          icon={false}
          role="status"
          aria-live="polite"
        >
          <AlertTitle>
            {progress.operation === 'delete'
              ? `Deleting from ${progress.wellName}…`
              : `Publishing to ${progress.wellName}…`}
          </AlertTitle>
          <Typography variant="body2">
            {progress.detail ??
              describeProgress(progress) ??
              (progress.operation === 'delete'
                ? 'Removing the stored readings. This can take a while for a long record; keep this tab open.'
                : 'Processing the corrected series. This can take several minutes; keep this tab open.')}
          </Typography>
          {!progress.detail && describeProgress(progress) ? (
            <Typography variant="caption">
              Keep this tab open until it finishes.
            </Typography>
          ) : null}
          <LinearProgress
            color="inherit"
            variant={progress.percent != null ? 'determinate' : 'indeterminate'}
            value={progress.percent ?? undefined}
            aria-label={
              progress.operation === 'delete'
                ? `Deleting from ${progress.wellName}`
                : `Publishing to ${progress.wellName}`
            }
            sx={{ mt: 1 }}
          />
        </Alert>
      ) : null}
      {success ? (
        <Alert severity="success" variant="filled" onClose={onDismissSuccess}>
          <AlertTitle>Publish to {success.wellName} complete</AlertTitle>
          {success.message}
        </Alert>
      ) : null}
      {error ? (
        <Alert severity="error" variant="filled" onClose={onDismissError}>
          <AlertTitle>Publish to {error.wellName} failed</AlertTitle>
          {error.message}
        </Alert>
      ) : null}
    </Stack>
  </Snackbar>
)
