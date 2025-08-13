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
} from '@mui/material'

import ocotilloImage from '@/img/ocotillo.png'
import React from 'react'

export const Home = () => {
  const theme = useTheme()

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Box
            sx={{
              backgroundImage: `url(${ocotilloImage})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              height: '500px',
              padding: 2,
            }}
          >
            <Typography variant="h1">Welcome to Ocotillo.</Typography>
            <Typography variant="h2">
              NMBGMR's Data Management Portal
            </Typography>
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
  )
}
