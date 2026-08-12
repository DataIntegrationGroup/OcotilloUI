import { Alert, Button, Stack } from '@mui/material'
import { AuthLayout } from './AuthLayout'
import { clearAuthentikFlowTransaction } from '@/services/authentik-flow'

export const AuthErrorPage = () => {
  const restart = () => {
    clearAuthentikFlowTransaction()
  }

  return (
    <AuthLayout
      title="Sign-in error"
      subtitle="Authentik could not complete this sign-in flow."
    >
      <Stack spacing={2.5}>
        <Alert severity="error" variant="outlined">
          Start again to continue. If this keeps happening, the Authentik flow
          returned a stage this page does not support yet.
        </Alert>
        <Button href="/login" onClick={restart} variant="contained">
          Back to sign in
        </Button>
      </Stack>
    </AuthLayout>
  )
}
