import React, { type CSSProperties, useContext, useState } from 'react'
import { CanAccess, useMenu, type TreeMenuItem } from '@refinedev/core'
import { ThemedTitle, useThemedLayoutContext } from '@refinedev/mui'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import LightModeOutlined from '@mui/icons-material/LightModeOutlined'
import ListOutlined from '@mui/icons-material/ListOutlined'
import {
  Box,
  Collapse,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  List,
  IconButton,
  Drawer,
  Tooltip,
  Paper,
  Typography,
} from '@mui/material'
import type { RefineThemedLayoutSiderProps } from '@refinedev/mui'
import { Link as RouterLink } from 'react-router'
import { ColorModeContext } from '@/contexts'
import { Dashboard } from './dashboard'
import { Logout } from './logout'

export const ThemedSiderV2: React.FC<RefineThemedLayoutSiderProps> = ({
  Title: TitleFromProps,
  render,
  meta,
  activeItemDisabled = false,
}) => {
  const {
    siderCollapsed,
    setSiderCollapsed,
    mobileSiderOpen,
    setMobileSiderOpen,
  } = useThemedLayoutContext()

  const { mode, setMode } = useContext(ColorModeContext)

  const { menuItems, selectedKey, defaultOpenKeys } = useMenu({ meta })

  const getDrawerWidth = (isSiderCollapsed: boolean): number =>
    isSiderCollapsed ? 56 : 260

  const [open, setOpen] = useState<{ [key: string]: boolean }>(() =>
    Object.fromEntries(defaultOpenKeys.map((key) => [key, true]))
  )

  const Title = TitleFromProps ?? ThemedTitle

  const handleClick = (key: string) => {
    setOpen({ [key]: !open[key] })
  }

  const renderTreeView = (tree: TreeMenuItem[], selectedKey?: string) => {
    return tree.map((item: TreeMenuItem) => {
      const {
        icon: deprecatedIcon,
        label: deprecatedLabel,
        meta,
        key,
        children,
        name,
        route,
      } = item
      const isOpen = open[key] || false

      const icon = deprecatedIcon ?? meta?.icon
      const derivedLabel = meta?.label || deprecatedLabel || name
      const label =
        name === 'Sandbox' || name === 'sandbox' ? 'Sandbox' : derivedLabel
      const isSelected = key === selectedKey
      const isNested = meta?.parent !== undefined
      const nestedLevel = isNested ? meta?.nestedLevel || 1 : 0
      const disabled = meta?.disabled || false

      // const allowedCategories = new Set([
      //   'Water',
      //   'Batch Upload',
      //   'Lookup Tables',
      //   'DataForge: Coming Soon',
      //   'Observations',
      // ])

      if (children.length > 0) {
        return (
          <CanAccess
            key={item.key}
            resource={name}
            action="list"
            params={{
              resource: item,
            }}
          >
            <div key={key}>
              <Tooltip
                title={label ?? name}
                placement="right"
                disableHoverListener={!siderCollapsed}
                arrow
              >
                <ListItemButton
                  disabled={disabled}
                  component={route ? RouterLink : 'div'}
                  to={route}
                  selected={isSelected}
                  onClick={() => {
                    if (siderCollapsed) {
                      setSiderCollapsed(false)
                      if (!isOpen) {
                        handleClick(key || '')
                      }
                    } else {
                      handleClick(key || '')
                    }
                  }}
                  sx={{
                    py: isNested ? 0 : 1,
                    pl: isNested ? nestedLevel * 2 : 1.5,
                    justifyContent: 'center',
                    borderRadius: 0,
                    border: 0,
                    my: 0,
                    mx: 0,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      justifyContent: 'center',
                      minWidth: '20px',
                      transition: 'margin-right 0.3s',
                      // marginRight: siderCollapsed ? '0px' : '12px',
                      mr: siderCollapsed ? 0 : 1,
                      color: 'currentColor',
                    }}
                  >
                    {icon ?? <ListOutlined />}
                  </ListItemIcon>
                  {!siderCollapsed && (
                    <ListItemText
                      primary={label}
                      slotProps={{
                        primary: {
                          noWrap: true,
                          fontSize: '14px',
                          sx: {
                            textDecoration: isSelected ? 'underline' : 'none',
                          },
                        },
                      }}
                    />
                  )}
                  {!siderCollapsed &&
                    (isOpen ? (
                      <ExpandLess sx={{ color: 'text.icon' }} />
                    ) : (
                      <ExpandMore sx={{ color: 'text.icon' }} />
                    ))}
                </ListItemButton>
              </Tooltip>
              {!siderCollapsed && (
                <Collapse
                  in={open[item.key || '']}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    {renderTreeView(children, selectedKey)}
                  </List>
                </Collapse>
              )}
            </div>
          </CanAccess>
        )
      }

      const linkStyle: CSSProperties =
        activeItemDisabled && isSelected ? { pointerEvents: 'none' } : {}

      return (
        <CanAccess
          key={item.key}
          resource={name}
          action="list"
          params={{ resource: item }}
        >
          <Tooltip
            title={label ?? name}
            placement="right"
            disableHoverListener={!siderCollapsed}
            arrow
          >
            <ListItemButton
              disabled={disabled}
              component={RouterLink}
              to={route}
              style={linkStyle}
              onClick={() => {
                if (!isNested) setOpen({})
                setMobileSiderOpen(false)
              }}
              sx={{
                ml: isNested ? 0.5 : 0,
                pl: isNested ? nestedLevel * 2.5 : 1.5,
                py: isNested ? 0 : 1,
                minHeight: isNested ? 'unset' : undefined,
                justifyContent: 'center',
                color: isSelected
                  ? 'primary.main'
                  : isNested
                    ? 'text.secondary'
                    : 'text.primary',
              }}
            >
              {!isNested && (
                <ListItemIcon
                  sx={{
                    justifyContent: 'center',
                    transition: 'margin-right 0.3s',
                    marginRight: siderCollapsed ? 0 : 1,
                    minWidth: '20px',
                    color: 'currentColor',
                  }}
                >
                  {icon ?? <ListOutlined />}
                </ListItemIcon>
              )}
              {!siderCollapsed && (
                <ListItemText
                  primary={label}
                  slotProps={{
                    primary: {
                      noWrap: true,
                      fontSize: '14px',
                      sx: { textDecoration: isSelected ? 'underline' : 'none' },
                    },
                  }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </CanAccess>
      )
    })
  }

  const Sider = () => {
    if (render) {
      return render({
        logout: <Logout collapsed={siderCollapsed} />,
        items: renderTreeView(menuItems, selectedKey),
        collapsed: siderCollapsed,
      })
    }
    return (
      <List
        disablePadding
        sx={{
          flexGrow: 1,
          paddingTop: '16px',
        }}
      >
        <Dashboard collapsed={siderCollapsed} selectedKey={selectedKey} />
        {renderTreeView(menuItems, selectedKey)}
      </List>
    )
  }

  return (
    <>
      <Box
        sx={{
          width: { xs: getDrawerWidth(siderCollapsed) },
          display: {
            xs: 'none',
            md: 'block',
          },
          transition: 'width 0.3s ease',
        }}
      />
      <Box
        component="nav"
        sx={{
          position: 'fixed',
          zIndex: 1101,
          width: { sm: getDrawerWidth(siderCollapsed) },
          display: 'flex',
        }}
      >
        <Drawer
          variant="temporary"
          elevation={2}
          open={mobileSiderOpen}
          onClose={() => setMobileSiderOpen(false)}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: {
              sm: 'block',
              md: 'none',
            },
          }}
        >
          <Box
            sx={{
              width: getDrawerWidth(siderCollapsed),
            }}
          >
            <Box
              sx={{
                height: 64,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '16px',
                fontSize: '14px',
              }}
            >
              <Title collapsed={false} />
            </Box>
            <Sider />
          </Box>
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: getDrawerWidth(siderCollapsed),
              overflow: 'hidden',
              transition: 'width 200ms cubic-bezier(0.4, 0, 0.6, 1) 0ms',
            },
          }}
          open
        >
          <Paper
            elevation={0}
            sx={{
              fontSize: '14px',
              width: '100%',
              height: 64,
              display: 'flex',
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: siderCollapsed ? 'center' : 'space-between',
              paddingLeft: siderCollapsed ? 0 : '16px',
              paddingRight: siderCollapsed ? 0 : '8px',
              variant: 'outlined',
              borderRadius: 0,
              bgcolor: 'background.default',
              borderBottom: (theme) =>
                `1px solid ${theme.palette.action.focus}`,
            }}
          >
            <Title collapsed={siderCollapsed} />
            {!siderCollapsed && (
              <IconButton size="small" onClick={() => setSiderCollapsed(true)}>
                {<ChevronLeft />}
              </IconButton>
            )}
          </Paper>
          <Box
            sx={{
              flexGrow: 1,
              overflowX: 'hidden',
              overflowY: 'auto',
            }}
          >
            <Sider />
          </Box>
          {!siderCollapsed && (
            <Box
              sx={{
                borderTop: (theme) => `1px solid ${theme.palette.action.focus}`,
                px: 2,
                py: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              {[
                { to: '/about', label: 'About' },
                { to: '/ocotillo/help', label: 'Desktop GIS Help' },
                { to: '/report-a-bug', label: 'Report a Bug' },
              ].map(({ to, label }) => (
                <RouterLink key={to} to={to} style={{ textDecoration: 'none' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { color: 'text.primary' },
                      transition: 'color 0.15s',
                    }}
                  >
                    {label}
                  </Typography>
                </RouterLink>
              ))}
            </Box>
          )}
          <Box
            sx={{
              borderTop: (theme) => `1px solid ${theme.palette.action.focus}`,
              px: 0.5,
              py: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: siderCollapsed ? 'center' : 'space-between',
            }}
          >
            <Logout collapsed={siderCollapsed} />
            {!siderCollapsed && (
              <Tooltip
                title={
                  mode === 'dark'
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'
                }
                placement="right"
              >
                <IconButton
                  onClick={setMode}
                  size="small"
                  sx={{ mr: 0.5, ml: 1 }}
                >
                  {mode === 'dark' ? (
                    <LightModeOutlined />
                  ) : (
                    <DarkModeOutlined />
                  )}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Drawer>
      </Box>
    </>
  )
}
