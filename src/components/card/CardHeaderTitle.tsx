import { Stack, Typography } from '@mui/material'
import { ReactNode } from 'react'

export const CardHeaderTitle = ({
  icon,
  title,
}: {
  icon: ReactNode
  title: string
}) => (
  <Stack direction="row" alignItems="center" spacing={1}>
    {icon}
    <Typography variant="body1" fontWeight="bold">
      {title}
    </Typography>
  </Stack>
)
