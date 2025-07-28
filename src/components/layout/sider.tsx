import React, { type CSSProperties, useEffect, useState } from 'react'
import {
  CanAccess,
  type ITreeMenu,
  useTitle,
  useRouterContext,
  useRouterType,
  useLink,
  useMenu,
} from '@refinedev/core'
import { ThemedTitleV2, useThemedLayoutContext } from '@refinedev/mui'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
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
} from '@mui/material'
import type { RefineThemedLayoutV2SiderProps } from '@refinedev/mui'
import { Dashboard } from './dashboard'
import { Logout } from './logout'

export const ThemedSiderV2: React.FC<RefineThemedLayoutV2SiderProps> = ({
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

  const { menuItems, selectedKey, defaultOpenKeys } = useMenu({ meta })
  const TitleFromContext = useTitle()

  const { Link: LegacyLink } = useRouterContext()
  const routerType = useRouterType()

  const NewLink = useLink()
  const Link = routerType === 'legacy' ? LegacyLink : NewLink

  const getDrawerWidth = (isSiderCollapsed: boolean): number =>
    isSiderCollapsed ? 56 : 350

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

  const Title = TitleFromProps ?? TitleFromContext ?? ThemedTitleV2

  const handleClick = (key: string) => {
    setOpen({ ...open, [key]: !open[key] })
  }

  const renderTreeView = (tree: ITreeMenu[], selectedKey?: string) => {
    return tree.map((item: ITreeMenu) => {
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
                    borderRadius: isNested ? '0px' : '10px',
                    border: isNested ? 0 : 1,
                    m: 0.5,
                    backgroundColor: !isNested
                      ? 'rgba(48,114,122,0.5)'
                      : 'rgba(48,114,122,0.25)',
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
              component={Link}
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
        dashboard: (
          <Dashboard collapsed={siderCollapsed} selectedKey={selectedKey} />
        ),
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
        <Logout collapsed={siderCollapsed} />
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
        </Drawer>
      </Box>
    </>
  )
}
