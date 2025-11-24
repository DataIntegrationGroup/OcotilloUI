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
  ListSubheader,
  Stack,
  Typography,
  useTheme,
  Box,
  Drawer,
  Alert,
  Button,
  Container,
  Fade,
} from '@mui/material'

// import ocotilloImage from '@/img/ocotillo.png'
import ocotilloImage from '@/img/home.png'
import React from 'react'
import { useCan } from '@refinedev/core'
import { Link as RouterLink } from "react-router-dom";

const HomeNotification: React.FC<{ noPermissions: boolean }> = ({
                                                                  noPermissions,
                                                                }) => {
  const [open, setOpen] = React.useState(true)

  const title = noPermissions
    ? 'Access required'
    : 'Ocotillo portal is in development'
  const body = noPermissions
    ? `You do not have permission to access this site. Please contact the site administrator to request access.`
    : `This is a test site for the NMBGMR Data Management Portal. Features may change and data may be incomplete.`

  return (
    <Drawer
      anchor="top"
      open={open}
      onClose={() => setOpen(false)}
      slotProps={{
        paper: {
          sx: {
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
          },
        },
      }}
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Alert
          severity={noPermissions ? 'warning' : 'info'}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setOpen(false)}
              aria-label="Close notification"
            >
              Dismiss
            </Button>
          }
          sx={{ alignItems: 'center' }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="body2">{body}</Typography>
        </Alert>
      </Box>
    </Drawer>
  )
}

type Program = {
  title: string
  description: string
  icon: React.ReactNode
  href?: string
  disabled?: boolean
}

export const Home: React.FC = () => {
  const theme = useTheme()
  const { data: permissions } = useCan({ action: 'list', resource: 'ocotillo' })
  const noPermissions = !permissions?.can

  const programs: Program[] = [
    {
      title: 'Aquifer Mapping Program',
      description: 'Manage and explore aquifer mapping datasets.',
      icon: <StorageOutlined />,
    },
    {
      title: 'Pychron',
      description: 'Tools and pipelines for geochronology data.',
      icon: <AutoAwesome />,
      href: 'https://github.com/NMGRL/pychron',
    },
    {
      title: 'Geothermal Program',
      description: 'Curate and publish geothermal project data.',
      icon: <Plumbing />,
    },
    {
      title: 'ST2',
      description: 'Access the FROST Server and station data.',
      icon: <ElectricBolt />,
      href: 'https://st2.newmexicowaterdata.org/FROST-Server',
    },
  ]

  return (
    <>
      <HomeNotification noPermissions={noPermissions} />

      <Fade in timeout={500}>
        <Box>
          {/* HERO — wide banner, never cropped */}
          <Box
            sx={{
              position: "relative",
              width: "100%",
              // Wide banner feel:
              aspectRatio: { xs: "16 / 9", md: "21 / 9" }, // ✅ wide on desktop
              minHeight: { xs: 240, md: 320 },            // ✅ prevents tiny hero
              maxHeight: { md: 420 },                      // ✅ keeps it banner-like
              borderRadius: 2,
              overflow: "hidden",
              mb: 3,
              bgcolor: "grey.900",                         // ✅ fills letterbox area
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Image layer — contain = never crop */}
            <Box
              component="img"
              src={ocotilloImage}
              alt=""
              aria-hidden
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",     // ✅ never crops
                objectPosition: "center",
              }}
            />

            {/* Dark overlay for text contrast */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                bgcolor: "rgba(0,0,0,0.45)",
              }}
            />

            {/* Hero content */}
            <Container
              maxWidth="md"
              sx={{
                position: "relative",
                textAlign: "center",
                color: "common.white",
                py: { xs: 3, md: 5 },
              }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  fontSize: { xs: "2.2rem", md: "3.5rem" },
                }}
              >
                Welcome to Ocotillo
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  mt: 1,
                  opacity: 0.95,
                  fontSize: { xs: "1.1rem", md: "1.5rem" },
                }}
              >
                NMBGMR&apos;s Data Management Portal
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  mt: 2,
                  maxWidth: 680,
                  mx: "auto",
                  opacity: 0.9,
                }}
              >
                A unified workspace for managing, validating, and publishing
                program data across NMBGMR.
              </Typography>

              {/* CTA */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                justifyContent="center"
                sx={{ mt: 3 }}
              >
                <Button
                  variant="contained"
                  color="secondary"
                  component={RouterLink}
                  to="/ocotillo/map"
                  disabled={noPermissions}
                  sx={{ px: 3 }}
                >
                  Go to Map
                </Button>
              </Stack>
            </Container>
          </Box>

          {/* CONTENT */}
          <Container maxWidth="lg">
            <Card elevation={1} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Stack spacing={2.5}>
                  <ListSubheader
                    component="div"
                    disableSticky
                    sx={{
                      px: 0,
                      bgcolor: 'transparent',
                      typography: 'h6',
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                    }}
                  >
                    Use this tool to efficiently manage data from:
                  </ListSubheader>

                  {/* CSS GRID instead of deprecated Grid */}
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(4, 1fr)",
                      },
                      alignItems: "stretch",
                    }}
                  >
                    {programs.map((p) => {
                      const clickable = Boolean(p.href) && !p.disabled

                      return (
                        <Card
                          key={p.title}
                          variant="outlined"
                          sx={{
                            height: "100%",
                            borderRadius: 2,
                            display: "flex",
                            flexDirection: "column",
                            transition: "0.15s ease",
                            ...(clickable && {
                              cursor: "pointer",
                              "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: 3,
                                borderColor: theme.palette.secondary.main,
                              },
                            }),
                            ...(p.disabled && { opacity: 0.6 }),
                          }}
                          onClick={() => {
                            if (clickable) window.open(p.href, "_blank")
                          }}
                          role={clickable ? "link" : undefined}
                          aria-label={clickable ? `Open ${p.title}` : p.title}
                        >
                          <CardContent
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1.5,
                              p: 2.25,
                              flexGrow: 1,
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: theme.palette.secondary.main,
                                width: 44,
                                height: 44,
                              }}
                            >
                              {p.icon}
                            </Avatar>

                            <Typography variant="subtitle1" fontWeight={700}>
                              {p.title}
                            </Typography>

                            {/* Let description take remaining space for even card heights */}
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ flexGrow: 1 }}
                            >
                              {p.description}
                            </Typography>

                            {p.href && (
                              <Button
                                size="small"
                                variant="text"
                                color="secondary"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(p.href, "_blank")
                                }}
                                sx={{ alignSelf: "flex-start" }}
                              >
                                Open
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Container>
        </Box>
      </Fade>
    </>
  )
}
