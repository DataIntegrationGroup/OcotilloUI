/**
 * Utilities for resolving a consistent display name for a contact record.
 *
 * Full logic spec: feature_files/contact-display-name.md
 *
 * Resolution order (single contact):
 *   1. name (non-empty after trim)  → return name
 *   2. organization (non-empty)     → return organization
 *   3. neither                      → return "" (guarded by API validation)
 *
 * Note: always call getContactDisplayName on the value *after* sanitizeContact
 * has run so that confidential contacts surface as "Confidential Contact"
 * rather than falling through to their organization field.
 */

export interface ContactDisplayFields {
  name?: string | null
  organization?: string | null
}

export function getContactDisplayName(contact: ContactDisplayFields): string {
  const name = contact.name?.trim()
  if (name) return name
  return contact.organization?.trim() ?? ''
}

/**
 * Returns a comma-separated label for a list of contacts.
 * Each contact is resolved through getContactDisplayName; blank results are
 * filtered out before joining.
 */
export function getContactsLabel(contacts: ContactDisplayFields[]): string {
  return contacts.map(getContactDisplayName).filter(Boolean).join(', ')
}
