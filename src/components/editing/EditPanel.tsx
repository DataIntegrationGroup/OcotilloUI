import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function EditPanel({
  title,
  onClose,
  children,
  footer,
  widthClassName = 'w-[400px]',
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
        'flex h-full flex-col bg-background border-l shrink-0',
        widthClassName
      )}
    >
      <div className="flex h-11 shrink-0 items-center justify-between border-b px-4">
        <span className="text-sm font-semibold">{title}</span>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 text-sm">{children}</div>

      {footer ? (
        <div className="shrink-0 border-t px-4 py-3 flex justify-end gap-2">
          {footer}
        </div>
      ) : null}
    </div>
  )
}
