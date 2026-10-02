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
  /** What is being written right now, when there is more than one step. */
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
          <AlertTitle>Publishing to {progress.wellName}…</AlertTitle>
          <Typography variant="body2">
            {progress.detail ??
              'Processing the corrected series. This can take several minutes; keep this tab open.'}
          </Typography>
          <LinearProgress
            color="inherit"
            aria-label={`Publishing to ${progress.wellName}`}
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
