import { useMemo } from 'react'
import { usePermissions } from '@refinedev/core'
import { getAccessCapabilities } from '@/utils'

export const useAccessCapabilities = () => {
  const { data: permissions, isLoading } = usePermissions<string[]>({})

  const capabilities = useMemo(
    () => getAccessCapabilities(permissions),
    [permissions]
  )

  return {
    permissions,
    isLoading,
    ...capabilities,
  }
}
