import { cn } from '@/lib/utils'
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
  const { panelWidth, isResizing, handleResizeStart } = useEditPanelWidth(
    open && resizable && pinPanel === 'sticky'
  )

  if (pinPanel === 'sticky') {
    return (
      <div className={cn('flex', className)}>
        <div className="min-w-0 flex-1">{children}</div>

        <div
          className={cn(
            'relative shrink-0',
            !isResizing && 'transition-[width] duration-200 ease-in-out',
            !open && 'w-0 overflow-hidden'
          )}
          style={open ? { width: panelWidth } : undefined}
        >
          {open ? (
            <div
              className={cn(
                'relative sticky top-0 w-full',
                PANEL_VIEWPORT_HEIGHT
              )}
            >
              {resizable ? (
                <EditPanelResizeHandle
                  panelWidth={panelWidth}
                  onResizeStart={handleResizeStart}
                />
              ) : null}
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
