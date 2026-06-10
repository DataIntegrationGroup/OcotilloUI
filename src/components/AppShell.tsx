import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Outlet, Link, useLocation, useNavigate } from 'react-router'
import {
  CanAccess,
  useGetIdentity,
  useIsExistAuthentication,
  useLogout,
  useTranslate,
  useWarnAboutChange,
  useOne,
} from '@refinedev/core'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  AppContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  AppLayout,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Check,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  LifeBuoy,
  Lock,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  User,
  X,
} from 'lucide-react'
import { ColorModeContext } from '@/contexts'
import SearchBar from '@/components/SearchBar'
import { ReportBugButton } from '@/components/Button'
import { PRIMARY_NAV, RESOURCE_NAV } from '@/config/navigation'
import { useSearch } from '@/providers/search-provider'

// Support panel state shared between the sidebar footer button and the panel itself
export const SupportPanelContext = createContext<{
  isOpen: boolean
  open: () => void
  close: () => void
}>({ isOpen: false, open: () => {}, close: () => {} })

// Collapse icon — shown in header when sidebar is expanded
function IconCollapse() {
  return (
    <svg
      fill="none"
      height="20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      width="20"
      aria-hidden="true"
    >
      <rect height="18" rx="2" width="18" x="3" y="3" />
      <path d="M9 3v18" />
      <path d="m16 15-3-3 3-3" />
    </svg>
  )
}

// Expand icon — shown in header when sidebar is collapsed
function IconExpand() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
    </svg>
  )
}

// Collapse button — lives in the sidebar header, only visible when sidebar is open.
// Uses Button primitive rather than SidebarTrigger because SidebarTrigger is
// hardcoded to PanelLeftIcon and doesn't allow swapping icons based on state.
function CollapseButton() {
  const { toggleSidebar } = useSidebar()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      title="Collapse sidebar"
      aria-label="Collapse sidebar"
      className="shrink-0 text-muted-foreground hover:text-foreground"
    >
      <IconCollapse />
    </Button>
  )
}

// Expand button — hamburger on mobile, expand icon on desktop when sidebar is collapsed.
// Same reasoning as CollapseButton for using Button over SidebarTrigger.
function ExpandButton() {
  const { state, isMobile, toggleSidebar } = useSidebar()
  if (!isMobile && state !== 'collapsed') return null
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      title={isMobile ? 'Open navigation' : 'Open sidebar'}
      aria-label={isMobile ? 'Open navigation' : 'Open sidebar'}
      className="shrink-0 text-muted-foreground hover:text-foreground"
    >
      {isMobile ? <Menu className="size-5" /> : <IconExpand />}
    </Button>
  )
}


const FOOTER_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Connect Desktop GIS', href: '/ogcapi' },
  { label: 'Report a Bug', href: '/report-a-bug' },
] as const

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}

/**
 * Returns the href of the most specific nav item that matches the current
 * pathname. Prevents a shallow route (e.g. /ocotillo/well) from staying
 * active when a deeper route (e.g. /ocotillo/well/batch-export) is open.
 */
function activeHref(pathname: string): string | null {
  const allHrefs = [...PRIMARY_NAV, ...RESOURCE_NAV]
    .map((item) => item.href)
    .filter(Boolean) as string[]
  const matches = allHrefs.filter((h) => isActive(pathname, h))
  if (matches.length === 0) return null
  return matches.reduce((a, b) => (a.length >= b.length ? a : b))
}

function SidebarBrand() {
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'

  return (
    <Link
      to="/home"
      className="flex items-center no-underline text-foreground"
    >
      <span
        className="font-heading font-extrabold uppercase leading-none tracking-widest"
        style={{ fontSize: collapsed ? '1.25rem' : '1.1rem' }}
      >
        {collapsed ? 'O' : 'Ocotillo'}
      </span>
    </Link>
  )
}

function AppSidebar() {
  const location = useLocation()
  const { mode, setMode } = useContext(ColorModeContext)
  const isExistAuthentication = useIsExistAuthentication()
  const { warnWhen, setWarnWhen } = useWarnAboutChange()
  const { mutate: logout } = useLogout()
  const translate = useTranslate()
  const { state } = useSidebar()
  const { openSearch } = useSearch()
  const collapsed = state === 'collapsed'

  const handleLogout = () => {
    if (warnWhen) {
      const confirmed = window.confirm(
        translate(
          'warnWhenUnsavedChanges',
          'Are you sure you want to leave? You have unsaved changes.'
        )
      )
      if (confirmed) {
        setWarnWhen(false)
        logout()
      }
    } else {
      logout()
    }
  }

  return (
    <Sidebar collapsible="icon">
      {/* Brand header — h-14 matches ShellHeader exactly, no inner wrapper */}
      <SidebarHeader
        className={cn(
          'h-14 flex-row items-center border-b p-0',
          collapsed ? 'justify-center' : 'justify-between px-4'
        )}
      >
        <SidebarBrand />
        {!collapsed && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-100">
            <CollapseButton />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden">
        {/* Primary navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {PRIMARY_NAV.map(({ id, label, href, icon: Icon, disabled, resource }) => {
                const button = id === 'search' ? (
                  <SidebarMenuButton onClick={openSearch} tooltip={label}>
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                ) : disabled ? (
                  <SidebarMenuButton
                    tooltip={`${label} (coming soon)`}
                    className="cursor-not-allowed disabled:opacity-100 disabled:pointer-events-none"
                  >
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton
                    asChild
                    isActive={activeHref(location.pathname) === href}
                    tooltip={label}
                  >
                    <Link to={href!}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                )

                const item = (
                  <SidebarMenuItem key={`primary-${label}`}>
                    {button}
                  </SidebarMenuItem>
                )

                return resource ? (
                  <CanAccess key={`primary-${label}`} resource={resource} action="list">
                    {item}
                  </CanAccess>
                ) : item
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-1 bg-border" />

        {/* Resource navigation + temporary Example section — all in one group */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {RESOURCE_NAV.map(({ label, href, icon: Icon, resource, adminOnly }) => (
                <CanAccess key={`resource-${href}`} resource={resource!} action="list">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={activeHref(location.pathname) === href}
                      tooltip={label}
                    >
                      <Link to={href!}>
                        <Icon />
                        <span>{label}</span>
                        {adminOnly && (
                          <Lock
                            className="ml-auto text-muted-foreground/70 shrink-0"
                            style={{ width: 11, height: 11 }}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </CanAccess>
              ))}
              {/* ── TEMPORARY: Example section — hidden until editing-tools is ready ── */}
              {/* <ExampleNavItem /> */}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* Footer links — hidden when collapsed */}
        {!collapsed && (
          <div className="border-t px-3 pt-3 pb-1 flex flex-col gap-0.5">
            {FOOTER_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                to={href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5 rounded no-underline"
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Help & Support button — hidden until panel content is defined */}
        {/* <SupportPanelTrigger collapsed={collapsed} /> */}
      </SidebarFooter>
    </Sidebar>
  )
}

function ExampleNavItem() {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(location.pathname.startsWith('/example'))

  useEffect(() => {
    if (!location.pathname.startsWith('/example')) setOpen(false)
  }, [location.pathname])

  const handleClick = () => {
    setOpen(true)
    navigate('/example/typography')
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/example">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip="Example" onClick={handleClick}>
            <FlaskConical />
            <span>Example</span>
            <ChevronRight className="ml-auto size-3.5 transition-transform duration-100 group-data-[state=open]/example:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton
                asChild
                isActive={location.pathname === '/example/typography'}
              >
                <Link to="/example/typography">Typography</Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function SupportPanelTrigger({ collapsed }: { collapsed: boolean }) {
  const { isOpen, open, close } = useContext(SupportPanelContext)
  return (
    <div className="border-t px-2 py-2">
      <button
        onClick={isOpen ? close : open}
        title="Help &amp; Support"
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
          collapsed && 'justify-center',
          isOpen ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <LifeBuoy className="size-4 shrink-0" />
        {!collapsed && <span>Help &amp; Support</span>}
      </button>
    </div>
  )
}

const PANEL_MIN_WIDTH = 320
const PANEL_DEFAULT_WIDTH = 320

function SupportPanel() {
  const { isOpen, close } = useContext(SupportPanelContext)
  const [width, setWidth] = useState(PANEL_DEFAULT_WIDTH)
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragState.current = { startX: e.clientX, startWidth: width }
    // Disable the CSS transition for the duration of the drag
    if (outerRef.current) outerRef.current.style.transition = 'none'
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [width])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragState.current) return
      const maxWidth = Math.floor(window.innerWidth / 2)
      const delta = dragState.current.startX - e.clientX
      const next = Math.min(maxWidth, Math.max(PANEL_MIN_WIDTH, dragState.current.startWidth + delta))
      // Write directly to DOM — no React re-render per frame
      if (outerRef.current) outerRef.current.style.width = `${next}px`
      if (innerRef.current) innerRef.current.style.width = `${next}px`
    }
    const onMouseUp = () => {
      if (!dragState.current) return
      // Commit final width to React state and restore transition
      const finalWidth = outerRef.current
        ? parseInt(outerRef.current.style.width, 10) || PANEL_DEFAULT_WIDTH
        : PANEL_DEFAULT_WIDTH
      dragState.current = null
      setWidth(finalWidth)
      if (outerRef.current) outerRef.current.style.transition = ''
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <div
      ref={outerRef}
      className={cn(
        'relative shrink-0 sticky top-0 h-svh overflow-hidden border-l bg-background transition-[width] duration-200 ease-in-out',
        !isOpen && 'w-0 border-l-0'
      )}
      style={isOpen ? { width } : undefined}
      aria-hidden={!isOpen}
    >
      {/* Drag handle — updates DOM directly, no React state during drag */}
      <div
        onMouseDown={onMouseDown}
        className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/20 transition-colors z-10"
      />

      <div ref={innerRef} className="flex h-full flex-col" style={{ width }}>
        {/* Panel header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <span className="font-semibold text-sm">Ocotillo Support</span>
          <button
            onClick={close}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Close support panel"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Panel body — placeholder until content is defined */}
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <LifeBuoy className="size-10 text-muted-foreground/40" />
          <p className="text-sm font-medium">Support coming soon</p>
          <p className="text-xs text-muted-foreground">
            This panel will contain help articles, contact options, and other support resources.
          </p>
        </div>
      </div>
    </div>
  )
}

// Map URL slug → { label, list path, Refine resource name }
const BREADCRUMB_RESOURCES: Record<
  string,
  { label: string; listHref: string; resource: string }
> = {
  well: { label: 'Wells', listHref: '/ocotillo/well', resource: 'thing-well' },
  contact: { label: 'Contacts', listHref: '/ocotillo/contact', resource: 'contact' },
  location: { label: 'Locations', listHref: '/ocotillo/location', resource: 'location' },
  sensor: { label: 'Sensors', listHref: '/ocotillo/sensor', resource: 'sensor' },
  sample: { label: 'Samples', listHref: '/ocotillo/sample', resource: 'sample' },
}

// Pattern: /<prefix>/<slug>/show/<id>  or  /<prefix>/<slug>/edit/<id>
const DETAIL_PATTERN = /\/([a-z0-9-]+)\/(show|edit)\/([^/]+)$/

function HeaderBreadcrumb() {
  const location = useLocation()

  const routeMatch = location.pathname.match(DETAIL_PATTERN)
  const slug = routeMatch?.[1] ?? ''
  const id = routeMatch?.[3] ?? ''
  const resourceInfo = BREADCRUMB_RESOURCES[slug]

  const { query } = useOne({
    resource: resourceInfo?.resource ?? '',
    id,
    queryOptions: { enabled: !!id && !!resourceInfo },
  })
  const recordName = (query?.data?.data as Record<string, unknown> | undefined)?.name as
    | string
    | undefined

  if (!routeMatch || !resourceInfo) return null

  const recordLabel = recordName ?? `#${id}`

  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm shrink-0">
      <Link
        to={resourceInfo.listHref}
        className="text-muted-foreground hover:text-foreground transition-colors no-underline"
      >
        {resourceInfo.label}
      </Link>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" aria-hidden="true" />
      <span className="text-foreground font-medium">{recordLabel}</span>
    </nav>
  )
}

function ShellHeader() {
  const { data: user } = useGetIdentity<{ name: string; email: string }>()
  const isExistAuthentication = useIsExistAuthentication()
  const { warnWhen, setWarnWhen } = useWarnAboutChange()
  const { mutate: logout } = useLogout()
  const translate = useTranslate()
  const { mode, setMode } = useContext(ColorModeContext)
  const { openSearch } = useSearch()

  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?'

  const handleLogout = () => {
    if (warnWhen) {
      const confirmed = window.confirm(
        translate(
          'warnWhenUnsavedChanges',
          'Are you sure you want to leave? You have unsaved changes.'
        )
      )
      if (confirmed) {
        setWarnWhen(false)
        logout()
      }
    } else {
      logout()
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3">
      <ExpandButton />
      <div className="min-w-0 shrink overflow-hidden">
        <HeaderBreadcrumb />
      </div>
      {/* Search bar — hidden on mobile, visible sm+ */}
      <div className="hidden sm:block shrink-0 max-w-sm w-full ml-0">
        <SearchBar />
      </div>
      <div className="ml-auto flex items-center gap-1 shrink-0">
        {/* Mobile search icon */}
        <button
          className="sm:hidden flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          onClick={openSearch}
          aria-label="Search"
        >
          <Search className="size-4" />
        </button>
        <ReportBugButton />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 px-2 sm:px-2.5 gap-1.5 font-semibold">
              {/* Avatar on mobile, full name on sm+ */}
              <span className="flex sm:hidden size-7 rounded bg-primary items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                {initials}
              </span>
              <span className="hidden sm:inline">{user?.name || 'User'}</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            {/* User identity */}
            <div className="flex items-center gap-3 px-3 py-2.5">
              <div className="size-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {user?.email || ''}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            {/* Appearance */}
            <DropdownMenuLabel className="text-xs text-muted-foreground/70 px-3 py-1 font-normal">
              Appearance
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setMode('light')}>
              <Sun className="mr-2 size-4" />
              Light
              {mode === 'light' && <Check className="ml-auto size-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMode('dark')}>
              <Moon className="mr-2 size-4" />
              Dark
              {mode === 'dark' && <Check className="ml-auto size-4" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isExistAuthentication && (
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 size-4" />
                Log out
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

// Pages where the sidebar should always collapse on arrival to maximise workspace
const AUTO_COLLAPSE_PATHS = ['/ocotillo/map']

function SidebarAutoCollapse() {
  const location = useLocation()
  const { setOpen } = useSidebar()
  // Track whether the sidebar was collapsed by this component (not by the user)
  const autoCollapsed = useRef(false)

  useEffect(() => {
    const isAutoCollapsePage = AUTO_COLLAPSE_PATHS.some((p) =>
      location.pathname.startsWith(p)
    )

    if (isAutoCollapsePage) {
      autoCollapsed.current = true
      setOpen(false)
    } else if (autoCollapsed.current) {
      // Leaving an auto-collapse page — restore the sidebar
      autoCollapsed.current = false
      setOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return null
}

function AppShellInner({ children }: { children?: React.ReactNode }) {
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar()
  const [panelOpen, setPanelOpen] = useState(false)
  // Remember whether the sidebar was open when the panel was triggered
  const sidebarWasOpen = useRef(false)

  const openPanel = () => {
    sidebarWasOpen.current = sidebarOpen
    setSidebarOpen(false)
    setPanelOpen(true)
  }

  const closePanel = () => {
    setPanelOpen(false)
    if (sidebarWasOpen.current) setSidebarOpen(true)
  }

  return (
    <SupportPanelContext.Provider value={{ isOpen: panelOpen, open: openPanel, close: closePanel }}>
      <SidebarAutoCollapse />
      <AppSidebar />
      <AppContent className="min-w-0">
        <ShellHeader />
        <div className="flex-1 min-h-0 overflow-y-auto">
          {children ?? <Outlet />}
        </div>
      </AppContent>
      <SupportPanel />
    </SupportPanelContext.Provider>
  )
}

export const AppShell = ({ children }: { children?: React.ReactNode }) => {
  return (
    // h-svh + overflow-hidden pins the shell to exactly the viewport so no page
    // can cause a body-level scroll. AppContent gets overflow-y-auto so regular
    // pages still scroll within the frame.
    <AppLayout className="h-svh overflow-hidden">
      <AppShellInner>{children}</AppShellInner>
    </AppLayout>
  )
}
