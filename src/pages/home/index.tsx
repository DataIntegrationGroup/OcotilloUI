import { useState } from 'react'
import {
  AutoAwesome,
  ElectricBolt,
  Plumbing,
  StorageOutlined,
} from '@mui/icons-material'
import {
  Avatar,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Stack,
  Typography,
  useTheme,
  Box,
  Drawer,
  Alert,
  Divider,
  Container,
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
            <Links />
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
  const theme = useTheme()

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
          backgroundColor: theme.palette.grey[900],
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
            Ocotillo is an application for accessing and working with New
            Mexico Bureau of Geology water data. It provides access to
            groundwater well information from the Aquifer Mapping Program
            (AMP), with additional datasets from Geothermal, Oil &amp; Gas, and
            Argon Geochronology planned for the future.
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
                Browse wells on the Map
              </Typography>
              <Typography component="li" variant="body1">
                Search by well ID, site name, or contact/owner
              </Typography>
              <Typography component="li" variant="body1">
                View well records (water levels, equipment, photos,
                contacts/owners)
              </Typography>
              <Typography component="li" variant="body1">
                Export a Field Compilation sheet for a single well
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

const Links = () => {
  const theme = useTheme()

  return (
    <Box sx={{ width: '100%' }}>
      <Container maxWidth="lg">
        <List
          sx={{ width: '100%', maxWidth: 300 }}
          subheader={
            <ListSubheader component="span">
              Use this tool to efficiently manage data from:
            </ListSubheader>
          }
        >
          <ListItem sx={{ pointerEvents: 'none' }}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                <StorageOutlined />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary="Aquifer Mapping Program"
              sx={{
                color: theme.palette.secondary.main,
              }}
            />
          </ListItem>
          <ListItemButton
            component="a"
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/NMGRL/pychron"
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                <AutoAwesome />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary="Pychron"
              sx={{
                color: theme.palette.secondary.main,
              }}
            />
          </ListItemButton>
          <ListItem sx={{ pointerEvents: 'none' }}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                <Plumbing />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary="Geothermal Program"
              sx={{ color: theme.palette.secondary.main }}
            />
          </ListItem>
          <ListItemButton
            component="a"
            target="_blank"
            rel="noopener noreferrer"
            href="https://st2.newmexicowaterdata.org/FROST-Server"
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                <ElectricBolt />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary="ST2"
              sx={{
                color: theme.palette.secondary.main,
              }}
            />
          </ListItemButton>
        </List>
      </Container>
    </Box>
  )
}
