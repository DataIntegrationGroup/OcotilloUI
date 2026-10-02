import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { ThemedTitleV2 } from '@/components/layout/title'
import { AUTHENTIK_SIGNUP_URL } from '@/config/auth'

export const LandingPage = () => (
  <Box
    sx={{
      minHeight: '100dvh',
      bgcolor: 'background.wrapper',
      color: 'text.primary',
    }}
  >
    <Paper
      component="header"
      elevation={0}
      square
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Container
        maxWidth="lg"
        sx={{
          minHeight: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <ThemedTitleV2 collapsed={false} />
        <Stack direction="row" spacing={1} alignItems="center">
          <Button component={RouterLink} to="/login" variant="text">
            Log in
          </Button>
          <Button
            component="a"
            href={AUTHENTIK_SIGNUP_URL}
            target="_blank"
            rel="noreferrer"
            variant="contained"
          >
            Sign up
          </Button>
        </Stack>
      </Container>
    </Paper>

    <Container maxWidth="lg">
      <Stack
        spacing={3}
        sx={{
          minHeight: 'calc(100dvh - 73px)',
          justifyContent: 'center',
          py: { xs: 8, md: 12 },
          maxWidth: 720,
        }}
      >
        <Typography variant="overline" color="text.secondary">
          New Mexico water data
        </Typography>
        <Typography variant="h1" sx={{ fontSize: { xs: 48, md: 72 } }}>
          Welcome to Ocotillo
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 620 }}>
          Explore and manage groundwater well information from the New Mexico
          Bureau of Geology &amp; Mineral Resources.
        </Typography>
        <Box>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            size="large"
          >
            Get started
          </Button>
        </Box>
      </Stack>
    </Container>
  </Box>
)
