import { useContext } from 'react'
import { Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SupportPanelContext } from '@/components/AppShell'

export const ReportBugButton = () => {
  const { open } = useContext(SupportPanelContext)

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={open}
      aria-label="Get help / report a bug"
      className="h-8 px-2 sm:px-2.5 gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
    >
      <Bug className="size-4 shrink-0" />
      <span className="hidden sm:inline text-sm font-normal">Get Help</span>
    </Button>
  )
}
