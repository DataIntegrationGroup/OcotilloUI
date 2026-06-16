import { useEffect } from 'react'
import { useGetIdentity } from '@refinedev/core'
import { AuthentikIdentity } from '@/providers/authentik-provider'
import {
  identifyUser,
  resetUser,
  getAccessibilityProps,
  setPersonProperties,
  startSessionRecordingIfEligible,
} from '@/analytics/posthog'

export const PostHogIdentify = () => {
  const { data: identity, isLoading } = useGetIdentity<AuthentikIdentity>()

  useEffect(() => {
    // Wait until Authentik finishes resolving the identity.
    // Calling resetUser() while still loading would clear identification
    // mid-session for users who are already logged in.
    if (isLoading) return

    if (identity?.id) {
      identifyUser(identity.id, { name: identity.name, email: identity.email })
      setPersonProperties(getAccessibilityProps())
      startSessionRecordingIfEligible()
    } else {
      resetUser()
    }
  }, [identity, isLoading])

  return null
}
