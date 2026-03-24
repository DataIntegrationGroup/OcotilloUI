import { useState } from 'react'
import { MapOutlined } from '@mui/icons-material'
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Box,
  Drawer,
  Alert,
  Divider,
  Container,
  Link,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import ocotilloImage from '@/img/ocotillo.jpeg'
import { useCan } from '@refinedev/core'

export const Home = () => {
  const { data: permissions } = useCan({ action: 'list', resource: 'ocotillo' })

  return (
    <>
      <HomeNotification noPermissions={!permissions?.can} />
      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Hero />
            <About />
          </Stack>
        </CardContent>
      </Card>
    </>
  )
}

const HomeNotification = ({ noPermissions }) => {
  const [notificationOpen, setNotificationOpen] = useState(true)

  return (
    <Drawer
      anchor={'top'}
      open={notificationOpen}
      onClose={() => setNotificationOpen(false)}
    >
      {noPermissions && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '300px',
            width: '100%',
          }}
        >
          <Alert severity="warning">
            <Typography variant="h6">
              You do not have permission to access this site.
            </Typography>
            <Typography variant="body1">
              Please contact the site administrator to request access.
            </Typography>
          </Alert>
        </Box>
      )}
      {!noPermissions && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',

            width: '100%',
          }}
        >
          <Alert severity="info">
            <Typography variant="h6">
              This is a test site for the NMBGMR Data Management Portal.
            </Typography>
            <Typography variant="body1">
              This site is currently in development and is not intended for
              general use.
            </Typography>
          </Alert>
        </Box>
      )}
    </Drawer>
  )
}

const Hero = () => {
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,

        // Consistent, professional hero sizing across devices
        height: 'clamp(260px, 42vh, 520px)',

        display: 'flex',
        alignItems: 'flex-end',
        p: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          transform: 'scaleX(-1)',
          backgroundImage: `url(${ocotilloImage})`,
          backgroundRepeat: 'no-repeat, no-repeat',
          backgroundSize: 'cover, auto 100%', // overlay covers, image is auto x 100%
          backgroundPosition: 'center, center',
          backgroundColor: '#212121',
        }}
      />
      {/* Overlay for readability + polish */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(0,0,0,0.66) 0%, rgba(0,0,0,0.33) 50%, rgba(0,0,0,0.03) 100%)',
        }}
      />
      <Box
        sx={{
          position: 'relative',
          color: 'common.white',
          maxWidth: { xs: '100%', md: '70%' },
          textShadow: '0 2px 14px rgba(0,0,0,0.35)',
        }}
      >
        <Typography variant="h1" sx={{ fontSize: { xs: 40, sm: 56, md: 72 } }}>
          Welcome to Ocotillo
        </Typography>
      </Box>
    </Box>
  )
}

const About = () => (
  <Box sx={{ width: '100%' }}>
    <Container maxWidth="lg">
      <Stack spacing={3}>
        <Box>
          <Typography variant="deck" sx={{ color: 'text.secondary' }}>
            Ocotillo is an application for accessing and working with New Mexico
            Bureau of Geology water data. It provides access to groundwater well
            information from the Aquifer Mapping Program (AMP), with additional
            datasets from Geothermal, Oil &amp; Gas, and Argon Geochronology
            planned for the future.
          </Typography>
        </Box>

        <Divider />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              What you can do now
            </Typography>
            <Stack component="ul" spacing={1} sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body1">
                <Link href="/ocotillo/map">Browse wells on the Map</Link>
              </Typography>
              <Typography component="li" variant="body1">
                Search by well ID, site name, or contact/owner
              </Typography>
              <Typography component="li" variant="body1">
                View well records (water levels, equipment, photos,
                contacts/owners)
              </Typography>
              <Typography component="li" variant="body1">
                <Link href="/ocotillo/well/batch-export">
                  Batch export Field Compilation sheets
                </Link>
              </Typography>
              <Typography component="li" variant="body1">
                <Link href="/ocotillo/help">
                  Connect Ocotillo to ArcGIS Pro or QGIS
                </Link>
              </Typography>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              What’s coming next
            </Typography>
            <Stack component="ul" spacing={1} sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body1">
                Run spatial queries and batch export data for groups of wells,
                springs, and other AMP features
              </Typography>
              <Typography component="li" variant="body1">
                Batch-generate Field Compilation sheets for field campaigns
              </Typography>
              <Typography component="li" variant="body1">
                Enter field-collected data such as well inventory updates, water
                levels, and field parameters
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  </Box>
)
