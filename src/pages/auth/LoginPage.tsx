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
import { startAuthentikLoginFlow } from '@/services/authentik-flow'

export const LoginPage = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const result = await startAuthentikLoginFlow({ username, password })

    setLoading(false)

    if (result.status === 'otp_required') {
      navigate('/login/otp')
      return
    }

    if (result.status === 'redirect') {
      window.location.assign(result.to)
      return
    }

    setError(result.message)
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
          disabled={loading}
          fullWidth
          id="username"
          label="Username or email"
          name="username"
          onChange={(event) => setUsername(event.target.value)}
          required
          value={username}
        />

        <TextField
          autoComplete="current-password"
          disabled={loading}
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
          disabled={loading}
          fullWidth
          size="large"
          type="submit"
          variant="contained"
        >
          {loading ? <CircularProgress color="inherit" size={22} /> : 'Sign in'}
        </Button>
      </Stack>
    </AuthLayout>
  )
}
