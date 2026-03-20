import { ReactNode } from 'react'
import { useCan } from '@refinedev/core'
import { CircularProgress, Stack } from '@mui/material'
import { ErrorComponent } from '@refinedev/mui'

export const ProtectedRoute = ({
  resource,
  action = 'list',
  children,
}: {
  resource: string
  action?: 'list' | 'show' | 'create' | 'edit' | 'delete'
  children: ReactNode
}) => {
  const { data, isLoading } = useCan({ resource, action })

  if (isLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
        <CircularProgress />
      </Stack>
    )
  }

  if (!data?.can) {
    return <ErrorComponent />
  }

  return <>{children}</>
}
