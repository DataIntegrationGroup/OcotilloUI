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
  submitAuthentikPassword,
} from '@/services/authentik-flow'

export const PasswordPage = () => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const transaction = authentikFlowStore.transaction
  const hasTransaction = Boolean(transaction)

  useEffect(() => {
    if (!hasTransaction) {
      setError('This sign-in session has expired. Start again to continue.')
    }
  }, [hasTransaction])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const result = await submitAuthentikPassword(password)

    setLoading(false)

    if (result.status === 'otp_required') {
      navigate('/login/mfa')
      return
    }

    if (result.status === 'redirect') {
      window.location.assign(result.to)
      return
    }

    if (result.status === 'password_required') {
      setError('Enter your password to continue.')
      return
    }

    setError(result.message)
  }

  const restartLogin = () => {
    clearAuthentikFlowTransaction()
    navigate('/login', { replace: true })
  }

  return (
    <AuthLayout
      title="Enter password"
      subtitle={
        transaction?.username
          ? `Signing in as ${transaction.username}`
          : 'Continue signing in.'
      }
    >
      <Stack component="form" spacing={2.5} onSubmit={onSubmit} noValidate>
        {error ? (
          <Alert severity="error" variant="outlined">
            {error}
          </Alert>
        ) : null}

        <TextField
          autoComplete="current-password"
          autoFocus
          disabled={loading || !hasTransaction}
          fullWidth
          id="password"
          label="Password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
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
            'Continue'
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
