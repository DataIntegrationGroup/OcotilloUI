import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Outlet, Link, useLocation, useNavigate } from 'react-router'
import {
  CanAccess,
  useCustomMutation,
  useGetIdentity,
  useIsExistAuthentication,
  useLogout,
  useTranslate,
  useWarnAboutChange,
  useOne,
  type HttpError,
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
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useSidebar } from '@/components/ui/use-sidebar'
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
  Bug,
  Check,
  ChevronDown,
  ChevronRight,
  FlaskConical,
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
import { AmpRole, PRIMARY_NAV, RESOURCE_NAV, type NavItem } from '@/config/navigation'
import { useAccessCapabilities } from '@/hooks'
import { useSearch } from '@/providers/search-provider'
import { SupportPanelContext } from '@/components/SupportPanelContext'
import { NewVersionBanner } from '@/components/NewVersionBanner'
import { trackNavItemClicked } from '@/analytics/posthog'
import pkg from '../../package.json'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export { SupportPanelContext }

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

function collectNavHrefs(items: NavItem[]): string[] {
  return items.flatMap((item) => {
    const hrefs = item.href ? [item.href] : []
    if (item.children?.length) {
      hrefs.push(...collectNavHrefs(item.children))
    }
    return hrefs
  })
}

/**
 * Returns the href of the most specific nav item that matches the current
 * pathname. Prevents a shallow route (e.g. /ocotillo/well) from staying
 * active when a deeper route (e.g. /ocotillo/well/batch-export) is open.
 */
function activeHref(pathname: string): string | null {
  const allHrefs = [
    ...collectNavHrefs(PRIMARY_NAV),
    ...collectNavHrefs(RESOURCE_NAV),
  ]
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

function isNavSectionActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function ResourceNavItem({
  item,
  pathname,
  canSeeNavItem,
}: {
  item: NavItem
  pathname: string
  canSeeNavItem: (itemRoles: NavItem['roles']) => boolean
}) {
  const { label, href, icon: Icon, resource, roles, children } = item
  const visibleChildren =
    children?.filter((child) => canSeeNavItem(child.roles)) ?? []
  const hasChildren = visibleChildren.length > 0
  const currentActiveHref = activeHref(pathname)
  const sectionActive =
    hasChildren && href != null && isNavSectionActive(pathname, href)
  const [open, setOpen] = useState(sectionActive)
  const isOpen = sectionActive || open

  useEffect(() => {
    setOpen(sectionActive)
  }, [sectionActive])

  if (!canSeeNavItem(roles)) return null

  const handleOpenChange = (next: boolean) => {
    if (!sectionActive) setOpen(next)
  }

  const trackNavClick = (target: NavItem, parentLabel?: string) => {
    if (!target.href) return
    trackNavItemClicked({
      label: target.label,
      href: target.href,
      resource: target.resource,
      ...(parentLabel ? { parent_label: parentLabel } : {}),
    })
  }

  if (!hasChildren) {
    return (
      <CanAccess resource={resource!} action="list">
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={currentActiveHref === href}
            tooltip={label}
          >
            <Link
              to={href!}
              onClick={() => trackNavClick({ label, href, icon: Icon, resource, roles })}
            >
              <Icon />
              <span>{label}</span>
              {roles && !roles.includes(AmpRole.Viewer) && (
                <Lock
                  className="ml-auto text-muted-foreground/70 shrink-0"
                  style={{ width: 11, height: 11 }}
                />
              )}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </CanAccess>
    )
  }

  const groupClass = `group/nav-${resource?.replace(/\./g, '-') ?? label}`

  return (
    <CanAccess resource={resource!} action="list">
      <Collapsible open={isOpen} onOpenChange={handleOpenChange} className={groupClass}>
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              asChild
              isActive={currentActiveHref === href}
              tooltip={label}
            >
              <Link
                to={href!}
                onClick={() => trackNavClick({ label, href, icon: Icon, resource, roles })}
              >
                <Icon />
                <span>{label}</span>
                <ChevronRight
                  className={cn(
                    'ml-auto size-3.5 transition-transform duration-100',
                    isOpen && 'rotate-90'
                  )}
                />
              </Link>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {visibleChildren.map((child) => {
                const ChildIcon = child.icon
                return (
                  <CanAccess
                    key={child.href}
                    resource={child.resource!}
                    action="list"
                  >
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={currentActiveHref === child.href}
                      >
                        <Link
                          to={child.href!}
                          onClick={() => trackNavClick(child, label)}
                        >
                          <ChildIcon />
                          <span>{child.label}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </CanAccess>
                )
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </CanAccess>
  )
}

function AppSidebar() {
  const location = useLocation()
  const { state } = useSidebar()
  const { openSearch } = useSearch()
  const { roles: userRoles } = useAccessCapabilities()
  const collapsed = state === 'collapsed'

  const canSeeNavItem = (itemRoles: NavItem['roles']) => {
    if (!itemRoles) return true
    return itemRoles.some((r) => userRoles.includes(r))
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
              {PRIMARY_NAV.map(({ id, label, href, icon: Icon, disabled, resource, roles }) => {
                if (!canSeeNavItem(roles)) return null

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
              {RESOURCE_NAV.map((item) => (
                <ResourceNavItem
                  key={item.href ?? item.label}
                  item={item}
                  pathname={location.pathname}
                  canSeeNavItem={canSeeNavItem}
                />
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

        <SupportPanelTrigger collapsed={collapsed} />

        {!collapsed && (
          <div className="px-3 pb-2">
            <span className="text-xs text-muted-foreground/60">
              v{pkg.version}
            </span>
          </div>
        )}
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
        title="Report a bug or request a feature"
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent cursor-pointer',
          collapsed && 'justify-center',
          isOpen ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Bug className="size-4 shrink-0" />
        {!collapsed && <span>Get Help</span>}
      </button>
    </div>
  )
}

const PANEL_MIN_WIDTH = 320
const PANEL_DEFAULT_WIDTH = 360

type PanelView = 'home' | 'bug' | 'feature'

interface FeedbackResponse {
  jira_key: string
  jira_url: string
}

interface FeedbackPayload {
  type: 'bug' | 'feature'
  page_url: string
  reporter_name?: string
  reporter_email?: string
  browser: string
  what_happened?: string
  severity?: string
  problem?: string
  who_would_use?: string
  what_it_should_do?: string
}

function getFeedbackErrorMessage(error: HttpError): string {
  const detail = error.response?.data?.detail
  if (Array.isArray(detail) && detail[0]?.msg) {
    return detail[0].msg
  }
  return error.message || 'Something went wrong. Please try again.'
}

interface BugFormData {
  whatHappened: string
  severity: string
}

interface FeatureFormData {
  problem: string
  whoWouldUse: string
  whatItShouldDo: string
}

function getBrowser(): string {
  const ua = navigator.userAgent
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  if (ua.includes('Edg')) return 'Edge'
  return 'Unknown'
}

function SupportPanel() {
  const { isOpen, close } = useContext(SupportPanelContext)
  const { data: user } = useGetIdentity<{ name: string; email: string }>()
  const location = useLocation()

  const [view, setView] = useState<PanelView>('home')
  const { mutate, mutation } = useCustomMutation<FeedbackResponse>()
  const { isPending, reset } = mutation
  const [ticketKey, setTicketKey] = useState<string>('')
  const [ticketUrl, setTicketUrl] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')

  const showSuccess = Boolean(ticketKey)
  const showError = Boolean(errorMsg)
  const formLocked = isPending || showSuccess

  const clearSubmitFeedback = () => {
    setErrorMsg('')
    setTicketKey('')
    setTicketUrl('')
    reset()
  }

  const [bugForm, setBugForm] = useState<BugFormData>({ whatHappened: '', severity: 'Low' })
  const [featureForm, setFeatureForm] = useState<FeatureFormData>({
    problem: '',
    whoWouldUse: '',
    whatItShouldDo: '',
  })

  const [width, setWidth] = useState(PANEL_DEFAULT_WIDTH)
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null)

  // Reset to home view when panel closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView('home')
        clearSubmitFeedback()
        setBugForm({ whatHappened: '', severity: 'Low' })
        setFeatureForm({ problem: '', whoWouldUse: '', whatItShouldDo: '' })
      }, 300)
    }
  }, [isOpen])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragState.current = { startX: e.clientX, startWidth: width }
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
      if (outerRef.current) outerRef.current.style.width = `${next}px`
      if (innerRef.current) innerRef.current.style.width = `${next}px`
    }
    const onMouseUp = () => {
      if (!dragState.current) return
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

  const handleSubmit = (type: 'bug' | 'feature') => {
    setErrorMsg('')
    setTicketKey('')
    setTicketUrl('')

    const payload: FeedbackPayload = {
      type,
      page_url: window.location.href,
      reporter_name: user?.name,
      reporter_email: user?.email,
      browser: getBrowser(),
      ...(type === 'bug'
        ? { what_happened: bugForm.whatHappened, severity: bugForm.severity }
        : {
            problem: featureForm.problem,
            who_would_use: featureForm.whoWouldUse,
            what_it_should_do: featureForm.whatItShouldDo,
          }),
    }

    mutate(
      {
        url: 'feedback',
        method: 'post',
        values: payload,
        dataProviderName: 'ocotillo',
      },
      {
        onSuccess: ({ data }) => {
          setTicketKey(data.jira_key)
          setTicketUrl(data.jira_url)
          setTimeout(() => {
            setView('home')
            clearSubmitFeedback()
            setBugForm({ whatHappened: '', severity: 'Low' })
            setFeatureForm({ problem: '', whoWouldUse: '', whatItShouldDo: '' })
          }, 3000)
        },
        onError: (error) => {
          setErrorMsg(getFeedbackErrorMessage(error))
        },
      }
    )
  }

  const pageUrl = location.pathname

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
      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/20 transition-colors z-10"
      />

      <div ref={innerRef} className="flex h-full flex-col" style={{ width }}>
        {/* Panel header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            {view !== 'home' && (
              <button
                onClick={() => { setView('home'); clearSubmitFeedback() }}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Back"
              >
                <ChevronRight className="size-4 rotate-180" />
              </button>
            )}
            <span className="font-semibold text-sm">
              {view === 'home' && 'Get Help'}
              {view === 'bug' && 'Report a Bug'}
              {view === 'feature' && 'Request a Feature'}
            </span>
          </div>
          <button
            onClick={close}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Close panel"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Panel body */}
        <div className="flex flex-1 flex-col overflow-y-auto">

          {/* Home view */}
          {view === 'home' && (
            <div className="flex flex-col gap-3 p-4">
              <p className="text-sm text-muted-foreground">
                Found something broken or have a suggestion? Let us know.
              </p>
              <div className="rounded-xl p-[2.5px]" style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6, #06b6d4)' }}>
                <button
                  onClick={() => setView('bug')}
                  className="flex w-full items-start gap-3 rounded-[9px] bg-background p-4 text-left hover:bg-accent transition-colors cursor-pointer"
                >
                  <Bug className="size-5 shrink-0 mt-0.5 text-emerald-500" />
                  <div>
                    <p className="font-medium text-sm">Report a Bug</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Something is broken or not working as expected.
                    </p>
                  </div>
                </button>
              </div>
              <div className="rounded-xl p-[2.5px]" style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9, #6366f1)' }}>
                <button
                  onClick={() => setView('feature')}
                  className="flex w-full items-start gap-3 rounded-[9px] bg-background p-4 text-left hover:bg-accent transition-colors cursor-pointer"
                >
                  <User className="size-5 shrink-0 mt-0.5 text-sky-500" />
                  <div>
                    <p className="font-medium text-sm">Request a Feature</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Describe something you need that Ocotillo doesn&apos;t do yet.
                    </p>
                  </div>
                </button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground px-1">
                For urgent issues, email{' '}
                <a
                  href="mailto:ocotillo-nmbg@nmt.edu"
                  className="underline hover:text-foreground"
                >
                  ocotillo-nmbg@nmt.edu
                </a>
              </p>
            </div>
          )}

          {/* Bug form */}
          {view === 'bug' && (
            <div className="flex flex-col gap-4 p-4">
              {/* Auto-captured context */}
              <div className="rounded-md bg-orange-100 dark:bg-orange-950/40 p-3 flex flex-col gap-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Captured automatically</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Page:</span> {pageUrl}
                </p>
                {user?.name && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Reported by:</span> {user.name}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Browser:</span> {getBrowser()}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Date & time:</span>{' '}
                  {new Date().toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bug-what-happened" className="text-sm">
                  What happened? <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="bug-what-happened"
                  placeholder={"Describe what went wrong.\n\nInclude:\n• What you expected to happen\n• What actually happened\n• Steps to reproduce"}
                  rows={7}
                  value={bugForm.whatHappened}
                  onChange={(e) => setBugForm((f) => ({ ...f, whatHappened: e.target.value }))}
                  disabled={formLocked}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-sm">Severity</Label>
                {[
                  { value: 'Low', label: 'Low', description: 'Minor annoyance, workaround exists' },
                  { value: 'Medium', label: 'Medium', description: 'Impacts my workflow' },
                  { value: 'High', label: 'High', description: 'Blocking, data loss, or completely broken' },
                ].map(({ value, label, description }) => (
                  <label
                    key={value}
                    className={cn(
                      'flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors',
                      bugForm.severity === value
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-accent',
                      (formLocked) && 'pointer-events-none opacity-50'
                    )}
                  >
                    <input
                      type="radio"
                      name="severity"
                      value={value}
                      checked={bugForm.severity === value}
                      onChange={() => setBugForm((f) => ({ ...f, severity: value }))}
                      disabled={formLocked}
                      className="mt-0.5 accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium leading-tight">{label}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                    </div>
                  </label>
                ))}
              </div>

              {showSuccess && (
                <div className="rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 p-3 text-sm text-green-800 dark:text-green-300">
                  Bug filed —{' '}
                  <a href={ticketUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline">
                    {ticketKey}
                  </a>
                  . Thanks!
                </div>
              )}

              {showError && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setView('home'); clearSubmitFeedback() }}
                  disabled={isPending}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSubmit('bug')}
                  disabled={!bugForm.whatHappened.trim() || formLocked}
                  className="flex-1"
                >
                  {isPending ? 'Submitting…' : 'Submit Bug'}
                </Button>
              </div>
            </div>
          )}

          {/* Feature request form */}
          {view === 'feature' && (
            <div className="flex flex-col gap-4 p-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="feat-problem" className="text-sm">
                  What problem does this solve? <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="feat-problem"
                  placeholder="Describe the pain point or gap in the current workflow."
                  rows={4}
                  value={featureForm.problem}
                  onChange={(e) => setFeatureForm((f) => ({ ...f, problem: e.target.value }))}
                  disabled={formLocked}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="feat-who" className="text-sm">
                  Who would use this?{' '}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <input
                  id="feat-who"
                  type="text"
                  placeholder="e.g. field staff, all users, data managers"
                  value={featureForm.whoWouldUse}
                  onChange={(e) => setFeatureForm((f) => ({ ...f, whoWouldUse: e.target.value }))}
                  disabled={formLocked}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="feat-what" className="text-sm">
                  What should it do? <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="feat-what"
                  placeholder="Describe the feature and how it should work."
                  rows={4}
                  value={featureForm.whatItShouldDo}
                  onChange={(e) => setFeatureForm((f) => ({ ...f, whatItShouldDo: e.target.value }))}
                  disabled={formLocked}
                />
              </div>

              {showSuccess && (
                <div className="rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 p-3 text-sm text-green-800 dark:text-green-300">
                  Request filed —{' '}
                  <a href={ticketUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline">
                    {ticketKey}
                  </a>
                  . Thanks!
                </div>
              )}

              {showError && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setView('home'); clearSubmitFeedback() }}
                  disabled={isPending}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSubmit('feature')}
                  disabled={
                    !featureForm.problem.trim() ||
                    !featureForm.whatItShouldDo.trim() ||
                    formLocked
                  }
                  className="flex-1"
                >
                  {isPending ? 'Submitting…' : 'Submit Request'}
                </Button>
              </div>
            </div>
          )}
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

// Nested list pages shown as Parent > Current in the header bar
const NESTED_LIST_BREADCRUMBS: Record<
  string,
  { parentLabel: string; parentHref: string; label: string }
> = {}

// Pattern: /<prefix>/<slug>/show/<id>  or  /<prefix>/<slug>/edit/<id>
const DETAIL_PATTERN = /\/([a-z0-9-]+)\/(show|edit)\/([^/]+)$/

function NestedListBreadcrumb({
  parentLabel,
  parentHref,
  label,
}: {
  parentLabel: string
  parentHref: string
  label: string
}) {
  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm shrink-0">
      <Link
        to={parentHref}
        className="text-muted-foreground hover:text-foreground transition-colors no-underline"
      >
        {parentLabel}
      </Link>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" aria-hidden="true" />
      <span className="text-foreground font-medium">{label}</span>
    </nav>
  )
}

function HeaderBreadcrumb() {
  const location = useLocation()

  const nestedList = NESTED_LIST_BREADCRUMBS[location.pathname]
  const routeMatch = location.pathname.match(DETAIL_PATTERN)
  const slug = routeMatch?.[1] ?? ''
  const id = routeMatch?.[3] ?? ''
  const resourceInfo = BREADCRUMB_RESOURCES[slug]

  const { query } = useOne({
    resource: resourceInfo?.resource ?? '',
    id,
    queryOptions: { enabled: !nestedList && !!id && !!resourceInfo },
  })
  const recordName = (query?.data?.data as Record<string, unknown> | undefined)?.name as
    | string
    | undefined

  if (nestedList) {
    return <NestedListBreadcrumb {...nestedList} />
  }

  if (!routeMatch || !resourceInfo) return null

  const recordLabel = recordName ?? `#${id}`

  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm shrink-0">
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
      <div className="hidden sm:block shrink-0 max-w-sm w-full sm:ml-3">
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
            <Button variant="ghost" className="h-8 px-2 sm:px-2.5 gap-1.5 font-semibold cursor-pointer">
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

function SidebarAutoCollapse(): null {
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
        <NewVersionBanner />
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
    <AppLayout className="h-svh overflow-hidden">
      <AppShellInner>{children}</AppShellInner>
    </AppLayout>
  )
}
