import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Outlet, Link, useLocation, useNavigate } from 'react-router'
import {
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
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
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
  Contact,
  Check,
  ChevronDown,
  ChevronRight,
  Droplets,
  FlaskConical,
  Home,
  LifeBuoy,
  LogOut,
  Map,
  Moon,
  Search,
  Sun,
  Upload,
  User,
  X,
} from 'lucide-react'
import { ColorModeContext } from '@/contexts'
import SearchBar from '@/components/SearchBar'
import { ReportBugButton } from '@/components/Button'

// Support panel state shared between the sidebar footer button and the panel itself
const SupportPanelContext = createContext<{
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

// Collapse button — lives in the sidebar header, only visible when sidebar is open
function CollapseButton() {
  const { toggleSidebar } = useSidebar()
  return (
    <button
      onClick={toggleSidebar}
      title="Collapse sidebar"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
    >
      <IconCollapse />
    </button>
  )
}

// Expand button — lives in the main header bar, only visible when sidebar is collapsed
function ExpandButton() {
  const { state, toggleSidebar } = useSidebar()
  if (state !== 'collapsed') return null
  return (
    <button
      onClick={toggleSidebar}
      title="Open sidebar"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
    >
      <IconExpand />
    </button>
  )
}

// Primary navigation: tools and views
// disabled: true = placeholder, not yet implemented
const PRIMARY_NAV = [
  { label: 'Home', href: '/home', icon: Home, disabled: false },
  { label: 'Search', href: null, icon: Search, disabled: true },
  { label: 'Map', href: '/ocotillo/map', icon: Map, disabled: false },
  { label: 'Import Log', href: null, icon: Upload, disabled: true },
]

// Data resources: record management
const RESOURCE_NAV = [
  { label: 'Wells', href: '/ocotillo/well', icon: Droplets },
  { label: 'Contacts', href: '/ocotillo/contact', icon: Contact },
] as const

const FOOTER_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Connect Desktop GIS', href: '/ogcapi' },
  { label: 'Report a Bug', href: '/report-a-bug' },
] as const

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
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
              {PRIMARY_NAV.map(({ label, href, icon: Icon, disabled }) => (
                <SidebarMenuItem key={`primary-${label}`}>
                  {disabled ? (
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
                      isActive={isActive(location.pathname, href!)}
                      tooltip={label}
                    >
                      <Link to={href!}>
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-1 bg-border" />

        {/* Resource navigation + temporary Example section — all in one group */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {RESOURCE_NAV.map(({ label, href, icon: Icon }) => (
                <SidebarMenuItem key={`resource-${href}-${label}`}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(location.pathname, href)}
                    tooltip={label}
                  >
                    <Link to={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* ── TEMPORARY: Example section ── */}
              <ExampleNavItem />
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

        {/* Help & Support button */}
        <SupportPanelTrigger collapsed={collapsed} />
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
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-3">
      <ExpandButton />
      <HeaderBreadcrumb />
      <div className="shrink-0 max-w-sm w-full ml-4">
        <SearchBar />
      </div>
      <div className="ml-auto flex items-center gap-2 shrink-0">
        <ReportBugButton user={user} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 px-2.5 gap-1.5 font-semibold">
              {user?.name || 'User'}
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
      <SidebarInset className="min-w-0">
        <ShellHeader />
        <main className="flex flex-col flex-1 min-h-0">
          {children ?? <Outlet />}
        </main>
      </SidebarInset>
      <SupportPanel />
    </SupportPanelContext.Provider>
  )
}

export const AppShell = ({ children }: { children?: React.ReactNode }) => {
  return (
    // overflow-x-clip on the provider prevents wide page content (DataGrid etc.)
    // from creating a body-level horizontal scrollbar that slides under the sidebar
    <SidebarProvider className="overflow-x-clip">
      <AppShellInner>{children}</AppShellInner>
    </SidebarProvider>
  )
}
