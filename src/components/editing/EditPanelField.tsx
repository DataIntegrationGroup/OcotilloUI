import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function EditPanelField({
  label,
  required,
  span,
  children,
}: {
  label: string
  required?: boolean
  span?: 'full'
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', span === 'full' && 'col-span-2')}>
      <Label className="text-xs text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  )
}
