import { useEffect } from 'react'
import { useGetIdentity } from '@refinedev/core'
import { AuthentikIdentity } from '@/providers/authentik-provider'
import { identifyUser, resetUser, getAccessibilityProps, setPersonProperties } from '@/analytics/posthog'

export const PostHogIdentify = () => {
  const { data: identity } = useGetIdentity<AuthentikIdentity>()

  useEffect(() => {
    if (identity?.id) {
      identifyUser(identity.id, { name: identity.name, email: identity.email })
      setPersonProperties(getAccessibilityProps())
    } else {
      resetUser()
    }
  }, [identity])

  return null
}
