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
  Button,
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
