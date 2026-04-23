import { useRef, useState } from 'react'
import {
  MapOutlined,
  SearchOutlined,
  FolderOpenOutlined,
  FileDownloadOutlined,
  HelpOutlineOutlined,
} from '@mui/icons-material'
import {
  CardActionArea,
  Card,
  CardContent,
  Stack,
  Typography,
  Box,
  Drawer,
  Alert,
  Divider,
  Container,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { useSearch } from '@/providers/search-provider'
import { useGo, useDataProvider, useNotification } from '@refinedev/core'
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

const appEnv = import.meta.env.VITE_APP_ENV || 'production'
const showTestSiteBanner =
  import.meta.env.DEV || appEnv !== 'production'

const HomeNotification = ({ noPermissions }) => {
  const [notificationOpen, setNotificationOpen] = useState(true)

  if (!noPermissions && !showTestSiteBanner) {
    return null
  }

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
      {!noPermissions && showTestSiteBanner && (
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

const About = () => {
  const { openSearch } = useSearch()
  const go = useGo()
  const dataProvider = useDataProvider()
  const { open: notify } = useNotification()
  const isFetchingRandomWellRef = useRef(false)
  const [isFetchingRandomWell, setIsFetchingRandomWell] = useState(false)

  const handleRandomWellClick = async () => {
    if (isFetchingRandomWellRef.current) return

    isFetchingRandomWellRef.current = true
    setIsFetchingRandomWell(true)

    const fallbackToList = () => {
      go({ to: '/ocotillo/well', type: 'push' })
    }

    try {
      const provider = dataProvider('ocotillo')
      const firstPage = await provider.getList({
        resource: 'thing/water-well',
        pagination: { currentPage: 1, pageSize: 1 },
      })

      if (!firstPage.total || firstPage.total < 1) {
        fallbackToList()
        return
      }

      const randomPage = Math.floor(Math.random() * firstPage.total) + 1
      const randomPageResult = await provider.getList({
        resource: 'thing/water-well',
        pagination: { currentPage: randomPage, pageSize: 1 },
      })

      const randomWell = randomPageResult.data?.[0]
      if (!randomWell?.id) {
        fallbackToList()
        return
      }

      go({
        to: {
          resource: 'ocotillo.thing-well',
          action: 'show',
          id: randomWell.id,
        },
      })
    } catch (error) {
      notify?.({
        type: 'error',
        message: 'Could not load a random well',
        description: 'Showing the wells list instead.',
      })
      fallbackToList()
    } finally {
      isFetchingRandomWellRef.current = false
      setIsFetchingRandomWell(false)
    }
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Box>
            <Typography variant="deck" sx={{ color: 'text.secondary' }}>
              Ocotillo is an application for accessing and working with New
              Mexico Bureau of Geology water data. It provides access to
              groundwater well information from the Aquifer Mapping Program
              (AMP), with additional datasets from Geothermal, Oil &amp; Gas,
              and Argon Geochronology planned for the future.
            </Typography>
          </Box>

          <Divider />

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            What you can do now
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                variant="outlined"
                sx={{ height: '100%', cursor: 'pointer' }}
                onClick={() => go({ to: '/ocotillo/map' })}
              >
                <CardContent>
                  <MapOutlined color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 0.5 }}
                  >
                    Browse wells on the Map
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Explore well locations and spatial data
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                variant="outlined"
                sx={{ height: '100%', cursor: 'pointer' }}
                onClick={openSearch}
              >
                <CardContent>
                  <SearchOutlined
                    color="primary"
                    sx={{ fontSize: 40, mb: 1 }}
                  />
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 0.5 }}
                  >
                    Search records
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Find wells by ID, site name, or contact/owner
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardActionArea
                  data-testid="random-well-card"
                  onClick={handleRandomWellClick}
                  disabled={isFetchingRandomWell}
                  sx={{ height: '100%', alignItems: 'stretch' }}
                >
                  <CardContent>
                    <FolderOpenOutlined
                      color="primary"
                      sx={{ fontSize: 40, mb: 1 }}
                    />
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, mb: 0.5 }}
                    >
                      View well records
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isFetchingRandomWell
                        ? 'Choosing a random well...'
                        : 'Water levels, equipment, photos, contacts/owners'}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                variant="outlined"
                sx={{ height: '100%', cursor: 'pointer' }}
                onClick={() => go({ to: '/ocotillo/well/batch-export' })}
              >
                <CardContent>
                  <FileDownloadOutlined
                    color="primary"
                    sx={{ fontSize: 40, mb: 1 }}
                  />
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 0.5 }}
                  >
                    Batch export Field Compilations
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Generate field compilation sheets for groups of wells
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                variant="outlined"
                sx={{ height: '100%', cursor: 'pointer' }}
                onClick={() => go({ to: '/ocotillo/help' })}
              >
                <CardContent>
                  <HelpOutlineOutlined
                    color="primary"
                    sx={{ fontSize: 40, mb: 1 }}
                  />
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 0.5 }}
                  >
                    Connect to GIS
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Connect Ocotillo to ArcGIS Pro or QGIS
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  )
}
