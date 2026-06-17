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
    <div className={cn('flex flex-1 min-h-0 overflow-hidden', className)}>
      <div className="flex flex-col flex-1 min-w-0">{children}</div>

      <div
        className={cn(
          'overflow-hidden transition-[width] duration-200 ease-in-out shrink-0',
          open ? panelWidthClassName : 'w-0'
        )}
      >
        {open ? panel : null}
      </div>
    </div>
  )
}
