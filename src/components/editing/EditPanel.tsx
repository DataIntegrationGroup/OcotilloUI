import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function EditPanel({
  title,
  onClose,
  children,
  footer,
  widthClassName = 'w-full',
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  widthClassName?: string
}) {
  return (
    <div
      className={cn(
        'flex h-full min-h-0 w-full flex-col bg-background border-l',
        widthClassName
      )}
    >
      <div className="sticky top-0 z-10 flex h-11 shrink-0 items-center justify-between border-b bg-background px-4">
        <span className="text-sm font-semibold">{title}</span>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2 text-sm">
        {children}
      </div>

      {footer ? (
        <div className="sticky bottom-0 z-10 flex shrink-0 justify-end gap-2 border-t bg-background px-4 py-3">
          {footer}
        </div>
      ) : null}
    </div>
  )
}
