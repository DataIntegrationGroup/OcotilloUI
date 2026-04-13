import { useEffect } from 'react'
import { useGetIdentity } from '@refinedev/core'
import { AuthentikIdentity } from '@/providers/authentik-provider'
import { identifyUser, resetUser } from '@/analytics/posthog'

export const PostHogIdentify = () => {
  const { data: identity } = useGetIdentity<AuthentikIdentity>()

  useEffect(() => {
    if (identity?.id) {
      identifyUser(identity.id, { name: identity.name, email: identity.email })
    } else {
      resetUser()
    }
  }, [identity])

  return null
}
