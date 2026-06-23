import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { useEditPanelWidth } from './useEditPanelWidth'

/** Height of the main content area below the app shell header (h-14). */
const PANEL_VIEWPORT_HEIGHT = 'h-[calc(100svh-3.5rem)]'

function EditPanelResizeHandle({
  panelWidth,
  onResizeStart,
}: {
  panelWidth: number
  onResizeStart: (event: React.MouseEvent<HTMLDivElement>) => void
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize edit panel"
      aria-valuemin={320}
      aria-valuemax={720}
      aria-valuenow={panelWidth}
      onMouseDown={onResizeStart}
      className="absolute inset-y-0 left-0 z-20 flex w-3 -translate-x-1/2 cursor-col-resize touch-none items-center justify-center"
    >
      <div className="h-10 w-1 rounded-full bg-border transition-colors hover:bg-primary/50 active:bg-primary" />
    </div>
  )
}

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
  /** Allow drag-to-resize panel width (sticky mode only). */
  resizable = pinPanel === 'sticky',
}: {
  open: boolean
  panel: React.ReactNode
  children: React.ReactNode
  panelWidthClassName?: string
  className?: string
  pinPanel?: 'sticky' | 'split'
  resizable?: boolean
}) {
  const isMobile = useIsMobile()
  const resizeEnabled =
    open && resizable && pinPanel === 'sticky' && !isMobile
  const { panelWidth, isResizing, handleResizeStart } =
    useEditPanelWidth(resizeEnabled)

  if (pinPanel === 'sticky') {
    const showPanelShell = open || !isMobile

    return (
      <div className={cn('flex', className)}>
        <div className={cn('min-w-0 flex-1', isMobile && open && 'hidden')}>
          {children}
        </div>

        {showPanelShell ? (
          <div
            className={cn(
              isMobile
                ? cn(
                    'fixed inset-x-0 top-14 z-30 w-full bg-background',
                    PANEL_VIEWPORT_HEIGHT
                  )
                : cn(
                    'relative shrink-0',
                    !isResizing &&
                      'transition-[width] duration-200 ease-in-out',
                    !open && 'w-0 overflow-hidden'
                  )
            )}
            style={!isMobile && open ? { width: panelWidth } : undefined}
            aria-hidden={!open}
          >
            {!isMobile && open && resizeEnabled ? (
              <EditPanelResizeHandle
                panelWidth={panelWidth}
                onResizeStart={handleResizeStart}
              />
            ) : null}
            {open ? (
              <div
                className={cn(
                  'relative w-full',
                  !isMobile && 'sticky top-0',
                  PANEL_VIEWPORT_HEIGHT
                )}
              >
                {panel}
              </div>
            ) : null}
          </div>
        ) : null}
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
