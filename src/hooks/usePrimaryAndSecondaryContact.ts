import { useMemo } from 'react'
import type { IContact } from '@/interfaces/ocotillo'

/**
 * Picks primary and secondary contacts with fallback logic:
 * - Primary: 'primary' → 'owner' → first contact
 * - Secondary: 'secondary' → any contact that's not primary (if >1 contacts exist)
 */
export const usePrimaryAndSecondaryContact = (contacts: IContact[]) => {
  return useMemo(() => {
    if (!contacts?.length) {
      return {
        primaryContact: undefined,
        secondaryContact: undefined,
      }
    }

    // Normalize once — makes comparisons cheaper and more consistent
    const normalized = contacts.map((contact) => ({
      ...contact,
      _normalizedType: (contact.contact_type ?? '').toLowerCase().trim(),
    }))

    // Primary: explicit "primary" > "owner" > first in list
    let primary = normalized.find((c) => c._normalizedType === 'primary')

    if (!primary) {
      primary = normalized.find((c) => c._normalizedType === 'owner')
    }

    if (!primary) {
      primary = normalized[0]
    }

    // Secondary: only makes sense if we have 2+ contacts
    let secondary: IContact | undefined = undefined

    if (normalized.length > 1) {
      secondary =
        normalized.find((c) => c._normalizedType === 'secondary') ??
        // Fallback: first contact that is not the primary one
        normalized.find((c) => c !== primary)
    }

    return {
      primaryContact: primary,
      secondaryContact: secondary,
    }
  }, [contacts])
}
