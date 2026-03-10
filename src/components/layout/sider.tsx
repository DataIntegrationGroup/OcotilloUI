import React, { type CSSProperties, useContext, useEffect, useState } from 'react'
import {
  CanAccess,
  useMenu,
  type TreeMenuItem,
} from '@refinedev/core'
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

  const [open, setOpen] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    setOpen((previous) => {
      const previousKeys: string[] = Object.keys(previous)
      const previousOpenKeys = previousKeys.filter((key) => previous[key])

      const uniqueKeys = new Set([...previousOpenKeys, ...defaultOpenKeys])
      const uniqueKeysRecord = Object.fromEntries(
        Array.from(uniqueKeys.values()).map((key) => [key, true])
      )
      return uniqueKeysRecord
    })
  }, [defaultOpenKeys])

  const Title = TitleFromProps ?? ThemedTitle

  const handleClick = (key: string) => {
    setOpen({ ...open, [key]: !open[key] })
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

      const icon = deprecatedIcon ?? meta.icon
      const label = meta?.label || deprecatedLabel || name
      const isSelected = key === selectedKey
      const isNested = !(meta.parent === undefined)
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
                  // disabled={!allowedCategories.has(label)}
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
                    pl: isNested ? nestedLevel * 4 : 2,
                    justifyContent: 'center',
                    borderRadius: 0,
                    border: 0,
                    m: 0.5,
                    backgroundColor: 'rgba(48,114,122,0.5)',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      justifyContent: 'center',
                      minWidth: '24px',
                      transition: 'margin-right 0.3s',
                      marginRight: siderCollapsed ? '0px' : '12px',
                      color: 'currentColor',
                    }}
                  >
                    {icon ?? <ListOutlined />}
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    slotProps={{
                      primary: {
                        noWrap: true,
                        fontSize: '14px',
                      },
                    }}
                  />
                  {isOpen ? (
                    <ExpandLess
                      sx={{
                        color: 'text.icon',
                      }}
                    />
                  ) : (
                    <ExpandMore
                      sx={{
                        color: 'text.icon',
                      }}
                    />
                  )}
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
              selected={isSelected}
              style={linkStyle}
              onClick={() => {
                setMobileSiderOpen(false)
              }}
              sx={{
                pl: isNested ? nestedLevel * 4 : 2,
                py: isNested ? 1.25 : 1,
                justifyContent: 'center',
                color: isSelected ? 'primary.main' : 'text.primary',
              }}
            >
              <ListItemIcon
                sx={{
                  justifyContent: 'center',
                  transition: 'margin-right 0.3s',
                  marginRight: siderCollapsed ? '0px' : '12px',
                  minWidth: '24px',
                  color: 'currentColor',
                }}
              >
                {icon ?? <ListOutlined />}
              </ListItemIcon>
              <ListItemText
                primary={label}
                slotProps={{
                  primary: {
                    noWrap: true,
                    fontSize: '14px',
                  },
                }}
              />
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
                { to: '/report-a-bug', label: 'Report a Bug' },
              ].map(({ to, label }) => (
                <Link key={to} to={to} style={{ textDecoration: 'none' }}>
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
                </Link>
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
                title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                placement="right"
              >
                <IconButton onClick={setMode} size="small" sx={{ mr: 0.5, ml: 1 }}>
                  {mode === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Drawer>
      </Box>
    </>
  )
}
