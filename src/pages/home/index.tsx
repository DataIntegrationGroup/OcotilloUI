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
} from '@mui/material'

export const Home = () => {
  const theme = useTheme()

  return (
    <Card>
      <CardHeader title="Home" />
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h1">Welcome to Ocotillo.</Typography>
          <Typography variant="h2">NMBGMR's Data Management Portal</Typography>
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
                <Avatar>
                  <StorageOutlined />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary="NM_Aquifer" />
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
                <Avatar>
                  <Plumbing />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary="NM_Wells" />
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
