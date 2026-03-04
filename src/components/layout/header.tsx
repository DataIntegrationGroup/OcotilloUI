import { useState } from 'react'
import {
  useGetIdentity,
  useActiveAuthProvider,
  useIsExistAuthentication,
  useLogout,
  useWarnAboutChange,
  useTranslate,
} from '@refinedev/core'
import {
  AppBar,
  Avatar,
  Stack,
  Toolbar,
  ListItemIcon,
  Menu,
  MenuItem,
  Skeleton,
} from '@mui/material'
import { LogoutOutlined, PersonOutline } from '@mui/icons-material'
import type { RefineThemedLayoutV2HeaderProps } from '@refinedev/mui'
import { HamburgerMenu } from './hamburgerMenu'
import SearchBar from '@/components/SearchBar'

const stringAvatar = (name: string) => {
  // Reduce the string into a numerical hash value
  // Convert hash to a hexadecimal string
  // Ensure at least 6 characters for valid hex color
  const stringToColor = (name: string) =>
    `#${[...name]
      .reduce((hash, char) => char.charCodeAt(0) + ((hash << 5) - hash), 0)
      .toString(16)
      .padStart(6, '0')
      .slice(-6)}`

  name = name?.trim() || 'UU'
  const nameParts = name?.trim().split(' ') // Split name into words
  const initials =
    nameParts.length > 1
      ? `${nameParts[0][0]}${nameParts[1][0]}` // First letter of first two words
      : `${nameParts[0][0]}${nameParts[0][1] || nameParts[0][0]}` // Handle single-word names

  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: initials.toUpperCase(),
  }
}

export const ThemedHeaderV2: React.FC<RefineThemedLayoutV2HeaderProps> = () => {
  const authProvider = useActiveAuthProvider()
  const isExistAuthentication = useIsExistAuthentication()
  const { data: user, isLoading } = useGetIdentity({
    v3LegacyAuthProviderCompatible: Boolean(authProvider?.isLegacy),
  })
  const { warnWhen, setWarnWhen } = useWarnAboutChange()
  const { mutate: mutateLogout } = useLogout({
    v3LegacyAuthProviderCompatible: Boolean(authProvider?.isLegacy),
  })

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
    <AppBar position="sticky" color="transparent" elevation={0} sx={{ bgcolor: 'background.default' }}>
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
                variant="circular"
                animation="pulse"
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.55)' }}
              >
                <Avatar />
              </Skeleton>
            ) : user?.avatar ? (
              <Avatar
                onClick={handleMenuOpen}
                src={user?.avatar}
                alt={user?.name}
              />
            ) : (
              <Avatar onClick={handleMenuOpen} {...stringAvatar(user?.name)} />
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
            >
              {user?.name && <MenuItem disabled>{user?.name}</MenuItem>}
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
