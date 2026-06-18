import { cn } from '@/lib/utils'

/** Height of the main content area below the app shell header (h-14). */
const PANEL_VIEWPORT_HEIGHT = 'h-[calc(100svh-3.5rem)]'

export function EditPanelLayout({
  open,
  panel,
  children,
  panelWidthClassName = 'w-[400px]',
  className,
  /**
   * sticky: main page scrolls in AppShell; panel pins to the right (well show).
   * split: main column scrolls inside a fixed viewport (Data Grid create panel).
   */
  pinPanel = 'split',
}: {
  open: boolean
  panel: React.ReactNode
  children: React.ReactNode
  panelWidthClassName?: string
  className?: string
  pinPanel?: 'sticky' | 'split'
}) {
  if (pinPanel === 'sticky') {
    return (
      <div className={cn('flex items-start', className)}>
        <div className="min-w-0 flex-1">{children}</div>

        <div
          className={cn(
            'shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out',
            open ? panelWidthClassName : 'w-0'
          )}
        >
          {open ? (
            <div className={cn('sticky top-0 w-full', PANEL_VIEWPORT_HEIGHT)}>
              {panel}
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex min-h-0',
        open && 'h-full overflow-hidden',
        className
      )}
    >
      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col',
          open && 'overflow-y-auto'
        )}
      >
        {children}
      </div>

      <div
        className={cn(
          'flex shrink-0 flex-col overflow-hidden transition-[width] duration-200 ease-in-out',
          open ? cn('h-full min-h-0', panelWidthClassName) : 'w-0'
        )}
      >
        {open ? <div className="h-full min-h-0 w-full">{panel}</div> : null}
      </div>
    </div>
  )
}
