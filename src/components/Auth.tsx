import { useFormContext } from 'react-hook-form'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'

const AUTHENTIK_URL =
  import.meta.env.VITE_AUTHENTIK_URL || 'http://localhost:8000/'

const CLIENT_ID = import.meta.env.VITE_AUTHENTIK_CLIENT_ID || 'client'
const REDIRECT_URI =
  import.meta.env.VITE_AUTHENTIK_REDIRECT_URI ||
  'http://localhost:3000/callback'

export const Callback = () => {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const storedVerifier = localStorage.getItem('pkce_code_verifier')

  if (!code || !storedVerifier) {
    throw new Error('Missing authorization code or PKCE verifier')
  }

  fetch(`${AUTHENTIK_URL}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: storedVerifier,
    }),
  })
    .then((response) => {
      return response.json()
    })
    .then((tokenData) => {
      localStorage.setItem('refresh_token', tokenData.refresh_token)
      localStorage.setItem('access_token', tokenData.access_token)
      localStorage.setItem('id_token', tokenData.id_token)

      // Optional: remove PKCE verifier
      localStorage.removeItem('pkce_code_verifier')
      window.location.replace('/')
    })

  return <p></p>
}

export const RememberMe = () => {
  const { register } = useFormContext()

  return (
    <FormControlLabel
      sx={{
        span: {
          fontSize: '12px',
          color: 'text.secondary',
        },
      }}
      color="secondary"
      control={
        <Checkbox size="small" id="rememberMe" {...register('rememberMe')} />
      }
      label="Remember me"
    />
  )
}
