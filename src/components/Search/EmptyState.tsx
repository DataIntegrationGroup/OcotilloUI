import { Typography } from '@mui/material'

type EmptyStateProps = {
  color?: 'error' | 'text.secondary'
  message: string
}

export const EmptyState = ({
  color = 'text.secondary',
  message,
}: EmptyStateProps) => (
  <Typography
    variant="body2"
    color={color}
    sx={{ px: 2, py: 2, textAlign: 'center' }}
  >
    {message}
  </Typography>
)
