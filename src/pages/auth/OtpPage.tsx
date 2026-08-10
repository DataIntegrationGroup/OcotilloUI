import { FormEvent, useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router'
import {
  Alert,
  Button,
  CircularProgress,
  Link,
  Stack,
  TextField,
} from '@mui/material'
import { AuthLayout } from './AuthLayout'
import {
  authentikFlowStore,
  clearAuthentikFlowTransaction,
  submitAuthentikOtp,
} from '@/services/authentik-flow'

export const OtpPage = () => {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const hasTransaction = Boolean(authentikFlowStore.transaction)

  useEffect(() => {
    if (!hasTransaction) {
      setError('This sign-in session has expired. Start again to continue.')
    }
  }, [hasTransaction])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const result = await submitAuthentikOtp(code)

    setLoading(false)

    if (result.status === 'redirect') {
      window.location.assign(result.to)
      return
    }

    if (result.status === 'expired') {
      clearAuthentikFlowTransaction()
    }

    setError(result.message)
  }

  const restartLogin = () => {
    clearAuthentikFlowTransaction()
    navigate('/login', { replace: true })
  }

  return (
    <AuthLayout
      title="Enter verification code"
      subtitle="Use the 6-digit code from your authenticator app."
    >
      <Stack component="form" spacing={2.5} onSubmit={onSubmit} noValidate>
        {error ? (
          <Alert severity="error" variant="outlined">
            {error}
          </Alert>
        ) : null}

        <TextField
          autoComplete="one-time-code"
          autoFocus
          disabled={loading || !hasTransaction}
          fullWidth
          id="otp"
          inputProps={{
            inputMode: 'numeric',
            maxLength: 6,
            pattern: '[0-9]*',
          }}
          label="Verification code"
          name="otp"
          onChange={(event) =>
            setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
          }
          required
          value={code}
        />

        <Button
          disabled={loading || !hasTransaction}
          fullWidth
          size="large"
          type="submit"
          variant="contained"
        >
          {loading ? (
            <CircularProgress color="inherit" size={22} />
          ) : (
            'Verify code'
          )}
        </Button>

        <Link
          component={RouterLink}
          onClick={restartLogin}
          to="/login"
          textAlign="center"
          underline="hover"
        >
          Back to sign in
        </Link>
      </Stack>
    </AuthLayout>
  )
}
