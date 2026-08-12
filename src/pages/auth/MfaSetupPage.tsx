import { Alert, Button, Stack } from '@mui/material'
import { AuthLayout } from './AuthLayout'
import { clearAuthentikFlowTransaction } from '@/services/authentik-flow'

export const MfaSetupPage = () => {
  const restart = () => {
    clearAuthentikFlowTransaction()
  }

  return (
    <AuthLayout
      title="Set up MFA"
      subtitle="Additional authenticator setup is required."
    >
      <Stack spacing={2.5}>
        <Alert severity="warning" variant="outlined">
          This Authentik MFA setup stage is not implemented in the custom UI
          yet.
        </Alert>
        <Button href="/login" onClick={restart} variant="contained">
          Back to sign in
        </Button>
      </Stack>
    </AuthLayout>
  )
}
