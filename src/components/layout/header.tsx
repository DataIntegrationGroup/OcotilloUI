import { useState } from 'react'
import {
  useGetIdentity,
  useIsExistAuthentication,
  useLogout,
  useWarnAboutChange,
  useTranslate,
} from '@refinedev/core'
import {
  AppBar,
  Button,
  Stack,
  Toolbar,
  ListItemIcon,
  Menu,
  MenuItem,
  Skeleton,
  Divider,
  Box,
  Typography,
  Avatar,
} from '@mui/material'
import {
  AccountCircle,
  LogoutOutlined,
  PersonOutline,
} from '@mui/icons-material'
import type { RefineThemedLayoutHeaderProps } from '@refinedev/mui'
import { HamburgerMenu } from './hamburgerMenu'
import SearchBar from '@/components/SearchBar'
import { Underline } from 'react-flaticons'

export const ThemedHeaderV2: React.FC<RefineThemedLayoutHeaderProps> = () => {
  const isExistAuthentication = useIsExistAuthentication()
  const { data: user, isLoading } = useGetIdentity()
  const { warnWhen, setWarnWhen } = useWarnAboutChange()
  const { mutate: mutateLogout } = useLogout()

  console.debug({ user })

  const translate = useTranslate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleProfile = () => {
    window.open(
      'https://authentik.newmexicowaterdata.org/',
      '_blank',
      'noopener,noreferrer'
    )
    handleMenuClose()
  }

  const handleLogout = () => {
    if (warnWhen) {
      const confirm = window.confirm(
        translate(
          'warnWhenUnsavedChanges',
          'Are you sure you want to leave? You have unsaved changes.'
        )
      )

      if (confirm) {
        setWarnWhen(false)
        mutateLogout()
      }
    } else {
      mutateLogout()
    }

    handleMenuClose()
  }

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{ bgcolor: 'background.default' }}
    >
      <Toolbar disableGutters sx={{ px: 1 }}>
        <HamburgerMenu />
        <Stack
          direction="row"
          width="100%"
          justifyContent="space-between"
          alignItems="center"
          gap="12px"
        >
          <SearchBar />
          <Stack
            direction="row"
            gap="16px"
            alignItems="center"
            justifyContent="center"
          >
            {isLoading ? (
              <Skeleton
                variant="rounded"
                animation="pulse"
                width={140}
                height={36}
                sx={{ borderRadius: 999 }}
              />
            ) : (
              <Button
                onClick={handleMenuOpen}
                color="inherit"
                variant="text"
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  color: 'text.primary',
                  minWidth: 0,
                  px: 1,
                }}
              >
                {user?.name || 'User'}
              </Button>
            )}
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1,
                    minWidth: { xs: null, md: 200, lg: 250 },
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 18px 44px rgba(15, 23, 42, 0.14)',
                  },
                },
              }}
              MenuListProps={{
                dense: true,
                sx: {
                  py: 0,
                },
              }}
            >
              <Box
                sx={{
                  px: 1.5,
                  py: 1.25,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.25,
                }}
              >
                <Avatar
                  src={user?.avatar || undefined}
                  sx={{
                    flexShrink: 0,
                    width: 42,
                    height: 42,
                  }}
                >
                  <AccountCircle sx={{ fontSize: 42 }} />
                </Avatar>
                <Box
                  sx={{
                    minWidth: 0,
                    overflow: 'hidden',
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.96rem',
                      lineHeight: 1.2,
                    }}
                    noWrap
                  >
                    {user?.name || 'User'}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      mt: 0.25,
                      fontSize: '0.75rem',
                    }}
                    noWrap
                  >
                    {user?.email || ''}
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <MenuItem onClick={handleProfile}>
                <ListItemIcon>
                  <PersonOutline />
                </ListItemIcon>
                Profile
              </MenuItem>
              {isExistAuthentication && (
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutOutlined />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              )}
            </Menu>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
