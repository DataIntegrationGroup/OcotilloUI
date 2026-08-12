import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  TextField,
} from '@mui/material'
import { AuthLayout } from './AuthLayout'
import { startAuthentikIdentification } from '@/services/authentik-flow'

export const LoginPage = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [recoveryLoading, setRecoveryLoading] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const result = await startAuthentikIdentification(username)

    setLoading(false)

    if (result.status === 'password_required') {
      navigate('/login/password')
      return
    }

    if (result.status === 'otp_required') {
      navigate('/login/mfa')
      return
    }

    if (result.status === 'redirect') {
      window.location.assign(result.to)
      return
    }

    setError(result.message)
  }

  const onForgotPassword = () => {
    setError(null)
    setRecoveryLoading(true)
    navigate('/login/recovery')
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Use your Ocotillo account credentials."
    >
      <Stack component="form" spacing={2.5} onSubmit={onSubmit} noValidate>
        {error ? (
          <Alert severity="error" variant="outlined">
            {error}
          </Alert>
        ) : null}

        <TextField
          autoComplete="username"
          autoFocus
          disabled={loading || recoveryLoading}
          fullWidth
          id="username"
          label="Username or email"
          name="username"
          onChange={(event) => setUsername(event.target.value)}
          required
          value={username}
        />

        <Button
          disabled={loading || recoveryLoading}
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

        <Button
          disabled={loading || recoveryLoading}
          fullWidth
          onClick={onForgotPassword}
          size="large"
          type="button"
          variant="text"
        >
          {recoveryLoading ? (
            <CircularProgress color="inherit" size={22} />
          ) : (
            'Forgot password?'
          )}
        </Button>
      </Stack>
    </AuthLayout>
  )
}
