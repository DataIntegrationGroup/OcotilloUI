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

/** A transducer file being loaded into the workbench. */
export interface UploadProgress {
  fileName: string
  /** Reading and parsing the file, then finding its well in Ocotillo. */
  stage: 'reading' | 'resolving'
  /** The well id the file names, once it has been read. */
  pointId?: string
}

export interface PublishResult {
  wellName: string
  message: string
}

interface PublishStatusNoticeProps {
  upload?: UploadProgress | null
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
 * Loading a large transducer file shows here too, from the moment it is
 * picked until its well is found.
 */
export const PublishStatusNotice = ({
  upload = null,
  progress,
  success,
  error,
  onDismissSuccess,
  onDismissError,
}: PublishStatusNoticeProps) => (
  <Snackbar
    open={Boolean(upload || progress || success || error)}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
  >
    <Stack spacing={1} sx={{ width: '100%', maxWidth: 640 }}>
      {upload ? (
        <Alert
          severity="info"
          variant="filled"
          icon={false}
          role="status"
          aria-live="polite"
        >
          <AlertTitle>Loading {upload.fileName}…</AlertTitle>
          <Typography variant="body2">
            {upload.stage === 'reading'
              ? 'Reading and parsing the file.'
              : `Finding well ${upload.pointId ?? ''} in Ocotillo.`}
          </Typography>
          <LinearProgress
            color="inherit"
            aria-label={`Loading ${upload.fileName}`}
            sx={{ mt: 1 }}
          />
        </Alert>
      ) : null}
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
