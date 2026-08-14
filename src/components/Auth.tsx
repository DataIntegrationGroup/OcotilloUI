import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Link,
  Stack,
  Typography,
} from '@mui/material'
import { AUTHENTIK_URL, CLIENT_ID, REDIRECT_URI } from '@/config'
import { AuthPage } from '@refinedev/mui'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router'
import { ThemedTitleV2 } from '@/components/layout/title'
import { buildAuthentikUrl, CLIENT_ID, REDIRECT_URI } from '@/config'
import {
  clearPkceFallbacks,
  consumePkceFallbackByState,
  tokenStore,
  transientStore,
} from '@/providers/authentik-provider'

type TokenResponse = {
  access_token: string
  id_token?: string
  refresh_token?: string
}

export const Login = () => (
  <AuthPage
    title={<ThemedTitleV2 collapsed={false} />}
    hideForm={true}
    type="login"
    registerLink={false}
    providers={[
      {
        name: 'authentik',
        label: 'Sign in with Authentik',
      },
    ]}
    renderContent={(content, title) => (
      <>
        {title}
        {content}
        <Box sx={{ mt: 2, px: 1, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Ocotillo uses PostHog analytics and records production sessions to
            improve reliability and support users.{' '}
            <Link
              component={RouterLink}
              to="/analytics-disclosure"
              underline="hover"
            >
              Learn why.
            </Link>
          </Typography>
        </Box>
      </>
    )}
  />
)

export const Callback = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const ran = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [details, setDetails] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'error'>('loading')

  useEffect(() => {
    if (ran.current) return // guard against StrictMode double-invoke
    ran.current = true

    setError(null)
    setDetails(null)
    setStatus('loading')
    ;(async () => {
      try {
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state')
        const fallbackPkce = state ? consumePkceFallbackByState(state) : null

        const verifier = transientStore.pkceVerifier ?? fallbackPkce?.verifier
        const expectedState = transientStore.pkceState ?? fallbackPkce?.state

        if (!code || !verifier) {
          throw new Error('Missing authorization code or PKCE verifier')
        }

        // If you are sending `state` in authorize request, validate it here
        if (!state || !expectedState || state !== expectedState) {
          throw new Error('Invalid state parameter')
        }

        const tokenUrl = new URL(
          'token/',
          `${AUTHENTIK_URL.replace(/\/+$/, '')}/`
        )

        const resp = await fetch(tokenUrl.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI,
            client_id: CLIENT_ID,
            code_verifier: verifier,
          }),
        })

        if (!resp.ok) {
          // include some debugging info if available
          const text = await resp.text().catch(() => '')
          setDetails(text || null)
          throw new Error('Token exchange failed')
        }

        // Persist tokens first (important)
        const tokenData = (await resp.json()) as TokenResponse

        tokenStore.refreshToken = tokenData.refresh_token ?? null
        tokenStore.accessToken = tokenData.access_token ?? null
        if (tokenData.id_token) tokenStore.idToken = tokenData.id_token

        // Cleanup PKCE + flags (important to prevent future races)
        transientStore.pkceVerifier = null
        transientStore.pkceState = null
        clearPkceFallbacks()

        // Re-check everything under new auth context
        await queryClient.invalidateQueries()

        // Leave callback route
        navigate('/', { replace: true })
      } catch (e) {
        setStatus('error')
        setError(e instanceof Error ? e.message : 'Callback failed')
      }
    })()
  }, [navigate, queryClient])

  const goToLogin = () => navigate('/login', { replace: true })

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Card elevation={3}>
        <CardContent>
          {status === 'loading' ? (
            <Stack spacing={2} alignItems="center" textAlign="center">
              <CircularProgress />
              <Typography variant="h6">Signing you in…</Typography>
              <Typography variant="body2" color="text.secondary">
                Completing secure login with Authentik.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={2} alignItems="center" textAlign="center">
              <Typography variant="h6">Sign-in failed</Typography>

              <Alert severity="error" variant="outlined">
                {error ?? 'Something went wrong while completing sign-in.'}
              </Alert>

              {details ? (
                <Box
                  sx={{
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    p: 2,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    maxHeight: 200,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {details}
                </Box>
              ) : null}

              <Button onClick={goToLogin} variant="contained">
                Back to login
              </Button>

              <Typography variant="caption" color="text.secondary">
                If this keeps happening, try clearing site data or signing in
                again.
              </Typography>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}
