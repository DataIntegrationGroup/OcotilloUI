import { Button } from '@mui/material'
import { BugReportOutlined } from '@mui/icons-material'
import { buildBugReportUrl } from '@/utils'

interface ReportBugButtonProps {
  user?: {
    name?: string
    email?: string
  }
}

export const ReportBugButton = ({ user }: ReportBugButtonProps) => {
  const handleClick = () => {
    const url = buildBugReportUrl({
      userName: user?.name,
      userEmail: user?.email,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Button
      onClick={handleClick}
      size="small"
      variant="text"
      startIcon={<BugReportOutlined sx={{ fontSize: '0.9rem !important', mr: -0.5 }} />}
      aria-label="Get help / report a bug"
      sx={{
        textTransform: 'none',
        color: 'text.secondary',
        fontSize: '0.8rem',
        fontWeight: 400,
        minWidth: 0,
        px: 1.5,
        borderRadius: 999,
        whiteSpace: 'nowrap',
        '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
      }}
    >
      Get Help
    </Button>
  )
}
