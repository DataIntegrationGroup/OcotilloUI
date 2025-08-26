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
  CardHeader,
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
} from '@mui/material'

import ocotilloImage from '@/img/ocotillo.png'
import React, { useEffect } from 'react'
import { useCan } from '@refinedev/core'

const HomeNotification = ({ noPermissions }) => {
  const [notificationOpen, setNotificationOpen] = React.useState(true)

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
export const Home = () => {
  const theme = useTheme()

  const { data: permissions } = useCan({ action: 'list', resource: 'ocotillo' })
  console.log(permissions)

  return (
    <>
      <HomeNotification noPermissions={!permissions?.can} />
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Box
              sx={{
                backgroundImage: `url(${ocotilloImage})`,
                transform: `scaleX(-1)`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                height: '500px',
                padding: 2,
              }}
            >
              <Box sx={{ transform: `scaleX(-1)` }}>
                <Typography variant="h1">Welcome to Ocotillo.</Typography>
                <Typography variant="h2">
                  NMBGMR's Data Management Portal
                </Typography>
              </Box>
            </Box>
            <List
              sx={{ width: '100%', maxWidth: 300 }}
              subheader={
                <ListSubheader component="span">
                  Use this tool to efficiently manage data from:
                </ListSubheader>
              }
            >
              <ListItem>
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
              <ListItem>
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
          </Stack>
        </CardContent>
      </Card>
    </>
  )
}
