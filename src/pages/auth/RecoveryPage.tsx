import { useEffect, useState } from 'react'
import { Alert, Button, CircularProgress, Stack } from '@mui/material'
import { AuthLayout } from './AuthLayout'
import { buildAuthentikPasswordRecoveryUrl } from '@/services/authentik-flow'

export const RecoveryPage = () => {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const recoveryUrl = await buildAuthentikPasswordRecoveryUrl()
        if (!cancelled) window.location.assign(recoveryUrl)
      } catch {
        if (!cancelled) {
          setError('Could not start password recovery. Try again in a moment.')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AuthLayout
      title="Password recovery"
      subtitle="Redirecting to Authentik recovery."
    >
      <Stack spacing={2.5} alignItems="center">
        {error ? (
          <>
            <Alert severity="error" variant="outlined">
              {error}
            </Alert>
            <Button href="/login" variant="contained">
              Back to sign in
            </Button>
          </>
        ) : (
          <CircularProgress />
        )}
      </Stack>
    </AuthLayout>
  )
}
