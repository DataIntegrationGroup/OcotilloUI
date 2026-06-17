import { cn } from '@/lib/utils'

export function EditPanelLayout({
  open,
  panel,
  children,
  panelWidthClassName = 'w-[400px]',
  className,
}: {
  open: boolean
  panel: React.ReactNode
  children: React.ReactNode
  panelWidthClassName?: string
  className?: string
}) {
  return (
    <div className={cn('flex min-h-0 h-full overflow-hidden', className)}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        {children}
      </div>

      <div
        className={cn(
          'flex h-full min-h-0 shrink-0 flex-col overflow-hidden transition-[width] duration-200 ease-in-out',
          open ? panelWidthClassName : 'w-0'
        )}
      >
        {open ? <div className="h-full min-h-0 w-full">{panel}</div> : null}
      </div>
    </div>
  )
}
